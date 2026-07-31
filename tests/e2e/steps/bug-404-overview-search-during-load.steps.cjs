// BUG-404 — the overview page's filter must survive the page's own initial load.
//
// UI suite against the real stack. The only unusual thing this file does is hold a
// real backend response back: a Playwright route intercepts the response the page
// needs, parks it until the scenario releases it, and then lets it continue to the
// real backend. Nothing is faked - the payload the page finally renders is the one
// the backend produced. Holding it is what turns an unobservable race into a
// deterministic one, because on the local stack /businesses/complete answers in
// roughly 50ms and there is no way to type into that window by hand.
//
// Step text is prefixed with "the overview page" wherever it could collide, because
// Cucumber matches step text across every file in the suite. The student login and
// the seeded fixture ids are reused from the existing suites rather than copied.

const assert = require('node:assert/strict');

const { After, Given, Then, When } = require('@qavajs/core');

const {
  CROSS_BUSINESS_PROJECT_ID,
  FRONTEND_URL,
  PROOF_PROJECT_ID,
  PROOF_PROJECT_NAME,
} = require('../support/test-data.cjs');
const { page } = require('../support/e2e-session.cjs');
const { THEMES_ROUTE } = require('../support/theme-stub.cjs');

const OVERVIEW_URL = `${FRONTEND_URL}/ontdek`;

// Filter.jsx debounces a keystroke by exactly this much before it calls the page back.
const SEARCH_DEBOUNCE_MS = 300;

// How long a step waits when it needs the debounced call to have happened. Well
// clear of the debounce itself so a busy machine cannot make a scenario assert on a
// filter that simply had not run yet.
const DEBOUNCE_SETTLE_MS = 1_000;

// The page's own data reads. Held back one at a time to stage the two orderings the
// defect has: the project list is what the filter is applied to, and the theme
// catalog is the other half of the settle OverviewPage waits on before it publishes
// that list - so holding the catalog back keeps the list unpublished while
// everything else on the page is already loaded and interactive.
//
// It used to be the per-project theme reads that served that purpose; TS-task-020
// (#303) moved /ontdek onto the themes nested in the business query and those reads
// no longer happen, so this is the repoint that feature file asked for. The two are
// not interchangeable in one respect, which `projectListArrival` below exists to
// close: those reads were issued only after the project list had come back, so
// holding them proved the projects had already arrived, whereas the catalog is
// requested alongside the projects and holding it proves nothing about them.
const PROJECT_LIST_ROUTE = /\/businesses\/complete(\?.*)?$/;

// --- world state -----------------------------------------------------------------

function state(world) {
  if (!world.overviewSearchRace) world.overviewSearchRace = { gate: null, typedAt: 0, projectListArrival: null };
  return world.overviewSearchRace;
}

// A scenario that fails before its release step would otherwise leave a request
// parked forever, and closing the page on a parked route hangs the run.
After(function () {
  this.overviewSearchRace?.gate?.release();
});

// --- holding a real response back --------------------------------------------------

/**
 * Park every request matching `pattern` until the returned gate is released, then
 * let it continue to the real backend.
 *
 * @returns {{ release: () => void, held: () => number }} `held` counts the requests
 *   parked so far, so a step can wait for the page to have actually asked before it
 *   relies on the response being held.
 */
async function holdResponses(world, pattern) {
  let release;
  const opened = new Promise((resolve) => { release = resolve; });
  let held = 0;

  await page(world).route(pattern, async (route) => {
    held += 1;
    await opened;
    // The page may already be gone if a scenario failed before releasing; that is
    // the After hook draining the gate, not a problem worth failing on.
    await route.continue().catch(() => {});
  });

  return { release: () => release(), held: () => held };
}

// The detail a staged failure carries. Chosen here rather than guessed, because
// services.js surfaces a 500's `detail` verbatim as the page's error message - so
// the scenario knows the exact text the alert must keep showing.
const STAGED_LOAD_FAILURE = 'E2E gesimuleerde storing bij het laden van projecten';

/**
 * Make the project list fail for this page. The one state a healthy backend will
 * not produce on demand, and the only way to reach the page's load-error branch.
 */
async function failProjectList(world) {
  await page(world).route(PROJECT_LIST_ROUTE, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      // The frontend calls the backend cross-origin, so a fulfilled response has to
      // expose CORS or the browser rejects it and the page reports a generic network
      // failure instead of the staged one.
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ detail: STAGED_LOAD_FAILURE }),
    }),
  );
}

async function waitUntil(predicate, message, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await predicate()) return;
    if (Date.now() >= deadline) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

// --- element helpers ---------------------------------------------------------------

function projectCard(world, projectId) {
  return page(world).locator(`#project-${projectId}`);
}

/** Every project card currently rendered, on whichever organisation. */
function projectCards(world) {
  return page(world).locator('article[id^="project-"]');
}

function searchBox(world) {
  return page(world).getByPlaceholder('Zoek organisatie of project...');
}

async function openOverview(world) {
  // Dropped to about:blank first so the previously open page cannot keep firing its
  // own reads into the routes this suite installs.
  await page(world).goto('about:blank');
  await page(world).goto(OVERVIEW_URL);
  await searchBox(world).waitFor({ state: 'visible', timeout: 20_000 });
}

async function loadOverviewWithBothProjects(world) {
  await openOverview(world);
  // Both cards, not just one: the scenarios below prove a filtered list by the
  // absence of the cross-business project, which would be a vacuous assertion if
  // that project were not on the unfiltered page to begin with.
  await projectCard(world, PROOF_PROJECT_ID).waitFor({ state: 'visible', timeout: 20_000 });
  await projectCard(world, CROSS_BUSINESS_PROJECT_ID).waitFor({ state: 'visible', timeout: 20_000 });
}

/** The page's alerts, as text. Several components on /ontdek render role="alert". */
function alertTexts(world) {
  return page(world).getByRole('alert').allInnerTexts();
}

async function assertNoProjectsShown(world, context) {
  const shown = await projectCards(world).evaluateAll((cards) => cards.map((card) => card.id));
  assert.deepEqual(shown, [], `Expected no project cards ${context}, saw ${JSON.stringify(shown)}`);
}

/** Type into the search box and remember when, so the debounce can be waited out. */
async function search(world, term) {
  await searchBox(world).fill(term);
  state(world).typedAt = Date.now();
}

async function settleDebounce(world) {
  const elapsed = Date.now() - state(world).typedAt;
  const remaining = DEBOUNCE_SETTLE_MS - elapsed;
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

// --- Given ---------------------------------------------------------------------------

Given('the overview page has loaded showing both seeded projects', async function () {
  await loadOverviewWithBothProjects(this);
});

Given("the overview page's project list fails to load", async function () {
  await failProjectList(this);
});

Given("the overview page's project list is held back", async function () {
  state(this).gate = await holdResponses(this, PROJECT_LIST_ROUTE);
});

Given("the overview page's theme catalog is held back", async function () {
  const current = state(this);
  current.gate = await holdResponses(this, THEMES_ROUTE);
  // Started here, before the page is opened, so it captures the reopened page's own
  // project read. Waiting for it later is what leaves the held catalog as the only
  // thing between the release and the first render - see the note on
  // PROJECT_LIST_ROUTE.
  current.projectListArrival = page(this).waitForResponse(
    (response) => PROJECT_LIST_ROUTE.test(response.url()),
    { timeout: 20_000 },
  );
});

Given('I have searched for the proof project', async function () {
  await search(this, PROOF_PROJECT_NAME);
  // Verified rather than assumed: the scenario that clears this search can only
  // prove the full list came back if the list really was filtered first.
  await projectCard(this, CROSS_BUSINESS_PROJECT_ID).waitFor({ state: 'hidden', timeout: 10_000 });
  await projectCard(this, PROOF_PROJECT_ID).waitFor({ state: 'visible', timeout: 10_000 });
});

// --- When ----------------------------------------------------------------------------

When('I reopen the overview page with no projects loaded yet', async function () {
  const { gate, projectListArrival } = state(this);
  assert.ok(gate, 'Expected a held back response to have been staged before opening the page');

  await openOverview(this);
  await waitUntil(
    async () => gate.held() > 0,
    'Expected the overview page to have requested the held back data within 10s',
  );
  // Only staged when it is the theme catalog being held: the projects are then
  // already in the browser and the page is holding them back from the screen, so
  // the later release renders them within one round trip instead of racing the
  // 300ms debounce against a project query still in flight.
  if (projectListArrival) await projectListArrival;
  await assertNoProjectsShown(this, 'while the page is still loading its projects');
});

When('I search for the proof project while no projects are shown', async function () {
  await assertNoProjectsShown(this, 'at the moment the search term is typed');
  await search(this, PROOF_PROJECT_NAME);
});

When('I filter on my own work while no projects are shown', async function () {
  await assertNoProjectsShown(this, 'at the moment the filter is set');
  const myWork = page(this).getByRole('button', { name: /Mijn werk/ });
  await myWork.waitFor({ state: 'visible', timeout: 10_000 });
  await myWork.click();
});

When('I reopen the overview page with its projects loaded', async function () {
  await loadOverviewWithBothProjects(this);
});

When('I open the overview page and it reports the load failure', async function () {
  await openOverview(this);
  await waitUntil(
    async () => (await alertTexts(this)).some((text) => text.includes(STAGED_LOAD_FAILURE)),
    `Expected the overview page to report the staged load failure '${STAGED_LOAD_FAILURE}' within 10s`,
  );
});

When('the projects arrive before the debounce fires', async function () {
  // The unfiltered list reaching the screen IS the ordering: it can only be there if
  // the data landed while the debounced filter had not run yet. Had the debounce won
  // the race, the filter would already have been active when the data arrived and
  // this card would never have rendered at all - so this is the ordering itself,
  // observed, rather than a stopwatch reading that drifts with machine speed.
  try {
    await projectCard(this, CROSS_BUSINESS_PROJECT_ID).waitFor({ state: 'visible', timeout: 10_000 });
  } catch {
    throw new Error(
      'Could not stage the "projects first" ordering: the unfiltered list never reached the screen, so the ' +
      `${SEARCH_DEBOUNCE_MS}ms debounce won the race and filtered the data before it rendered. Once the debounce ` +
      'has fired, that card can no longer appear however long this waits. This scenario cannot prove what it ' +
      'claims - restage it rather than reading this as the defect.',
    );
  }
});

When('I search for the proof project', async function () {
  await search(this, PROOF_PROJECT_NAME);
});

When('I filter on archived projects', async function () {
  await page(this).getByRole('button', { name: 'Archief', exact: true }).click();
});

When('I filter on the theme {string}', async function (name) {
  // Anchored: once selected, the theme also appears as a "Verwijder filter: <name>"
  // chip, and that button must not be the one this step clicks.
  await page(this).getByRole('button', { name: new RegExp(`^${name}`) }).click();
});

When('I search for {string}', async function (term) {
  await search(this, term);
});

When('I clear the search', async function () {
  await page(this).getByRole('button', { name: 'Wis zoekopdracht' }).click();
});

When('the search debounce elapses', async function () {
  await settleDebounce(this);
});

When('the search debounce elapses while no projects are shown', async function () {
  await settleDebounce(this);
  // The point of the wait: the debounced filter has now run, and it ran against a
  // page that still had nothing to filter. That is the state the defect starts from.
  await assertNoProjectsShown(this, 'after the debounce fired on the still-loading page');
});

When('the overview page has not called the still-loading list empty', async function () {
  // The filter has run against no data at this point. "Nothing to find yet" is not
  // "nothing found", so the page must not have announced an empty result.
  const announced = (await alertTexts(this)).filter((text) => text.includes('Geen resultaten gevonden'));
  assert.deepEqual(
    announced,
    [],
    `Expected no empty-result message while the projects are still loading, saw ${JSON.stringify(announced)}`,
  );
});

When('the held back data is released', async function () {
  const { gate } = state(this);
  assert.ok(gate, 'Expected a held back response to release');
  gate.release();
});

// --- Then ----------------------------------------------------------------------------

Then('the overview page shows the proof project', async function () {
  const card = projectCard(this, PROOF_PROJECT_ID);
  try {
    await card.waitFor({ state: 'visible', timeout: 12_000 });
  } catch (error) {
    // An empty list and a wrongly filtered one fail the same way otherwise, and the
    // difference is the whole point of this suite.
    const seen = await page(this).evaluate(() => ({
      url: location.href,
      cards: [...document.querySelectorAll('article[id^="project-"]')].map((el) => el.id),
      search: document.querySelector('#search')?.value ?? null,
      alert: document.querySelector('[role="alert"]')?.innerText ?? null,
    }));
    throw new Error(`${error.message}\nPage at that moment: ${JSON.stringify(seen)}`);
  }
});

Then('the overview page shows the cross-business project', async function () {
  await projectCard(this, CROSS_BUSINESS_PROJECT_ID).waitFor({ state: 'visible', timeout: 12_000 });
});

Then('the overview page does not show the cross-business project', async function () {
  // Deliberately a plain count and not a wait: by the time this runs the matching
  // card is already on screen, so both cards were committed in the same render. A
  // wait here would be waiting for a change that is never coming, and would turn an
  // unfiltered list into a slow failure instead of an immediate one.
  const shown = await projectCards(this).evaluateAll((cards) => cards.map((card) => card.id));
  assert.ok(
    !shown.includes(`project-${CROSS_BUSINESS_PROJECT_ID}`),
    `Expected the filtered list to exclude the cross-business project, saw ${JSON.stringify(shown)}`,
  );
});

Then('the overview page shows no projects', async function () {
  await assertNoProjectsShown(this, 'for a search term that matches nothing');
});

Then('the overview page reports no results for {string}', async function (term) {
  const alert = page(this).getByRole('alert').filter({ hasText: 'Geen resultaten gevonden' });
  await alert.waitFor({ state: 'visible', timeout: 10_000 });
  assert.match(
    (await alert.innerText()).trim(),
    new RegExp(`Geen resultaten gevonden voor "${term}"`),
    `Expected the overview page to name '${term}' in its no-results message`,
  );
});

Then('the overview page still shows the cross-business project right after typing', async function () {
  // Timestamped in the page, alongside the read itself: taking it back in Node would
  // charge the round trip to the debounce budget and could report a window as missed
  // when the page was in fact still inside it. Same machine, so the same wall clock.
  const { shown, readAt } = await projectCards(this).evaluateAll((cards) => ({
    shown: cards.map((card) => card.id),
    readAt: Date.now(),
  }));
  const elapsed = readAt - state(this).typedAt;
  // Guard first: past the debounce window a correctly debounced page has already
  // dropped the card, so a failure would say nothing about the debounce. Better to
  // report that the window was missed than to report a defect that is not there.
  assert.ok(
    elapsed < SEARCH_DEBOUNCE_MS,
    `Could not observe the debounce window: reading the list took ${elapsed}ms of the ${SEARCH_DEBOUNCE_MS}ms debounce`,
  );
  assert.ok(
    shown.includes(`project-${CROSS_BUSINESS_PROJECT_ID}`),
    `Expected the list to be untouched ${elapsed}ms after typing, within the ${SEARCH_DEBOUNCE_MS}ms debounce, saw ${JSON.stringify(shown)}`,
  );
});

Then('the overview page reports no results mentioning {string}', async function (fragment) {
  const message = (await alertTexts(this)).find((text) => text.includes('Geen resultaten gevonden'));
  assert.ok(message, `Expected the overview page to report an empty result mentioning '${fragment}'`);
  assert.ok(
    message.includes(fragment),
    `Expected the empty-result message to name '${fragment}', got '${message}'`,
  );
});

Then('the overview page still reports the same load failure', async function () {
  const texts = await alertTexts(this);
  assert.ok(
    texts.some((text) => text.includes(STAGED_LOAD_FAILURE)),
    `Expected the load failure to survive the search, saw ${JSON.stringify(texts)}`,
  );
  // The regression this guards: filtering used to clear the page error first, so the
  // real cause was replaced by an empty-result message about the search term.
  const announced = texts.filter((text) => text.includes('Geen resultaten gevonden'));
  assert.deepEqual(
    announced,
    [],
    `Expected the failed load not to be reported as an empty search result, saw ${JSON.stringify(announced)}`,
  );
});

Then('the overview page drops the cross-business project once the debounce elapses', async function () {
  await projectCard(this, CROSS_BUSINESS_PROJECT_ID).waitFor({ state: 'hidden', timeout: 10_000 });
});