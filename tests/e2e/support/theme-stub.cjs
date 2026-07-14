// Reusable Playwright network stub for the public GET /themes/ collection endpoint.
//
// The isolated E2E TypeDB seed contains no themes, and the existing theme
// integrity scenarios mutate the shared theme catalog without per-scenario
// cleanup. Driving theme-list UI states from that shared, mutable catalog would
// be order-dependent and could never produce a loading/error state on demand.
//
// This helper lets any theme UI scenario deterministically control what
// GET /themes/ returns. It is intentionally generic so the sibling theme UI
// tasks (TS-task-011/012/013 modals, the theme display tasks) can reuse it.

// getThemes() calls `${API_BASE_URL}themes/` (always a trailing slash and no
// query string in this app); this matches exactly that collection request and
// deliberately NOT `/themes/project/:id` or `/themes/:id`.
const THEMES_ROUTE = /\/themes\/(\?.*)?$/;

/**
 * Intercept GET /themes/ for a page and fulfil it with a controlled response.
 *
 * @param {import('playwright').Page} page
 * @param {{ status?: number, body?: unknown, delayMs?: number }} [options]
 */
async function stubThemesEndpoint(page, { status = 200, body = [], delayMs = 0 } = {}) {
  // Drop any previously installed themes stub so scenarios can re-stub cleanly.
  await page.unroute(THEMES_ROUTE).catch(() => {});
  await page.route(THEMES_ROUTE, async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      // The frontend (:10121) fetches the backend (:10122) cross-origin, so the
      // fulfilled response must expose CORS or the browser fetch would reject
      // and the happy-path scenarios would incorrectly fall into the error state.
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

// createTheme() posts to `${API_BASE_URL}themes` (no trailing slash), which is
// exactly the collection resource without a slash and never `/themes/`,
// `/themes/:id` or `/themes/project/:id`. Matching on the missing trailing
// slash keeps this stub disjoint from stubThemesEndpoint above.
const CREATE_THEME_ROUTE = /\/themes$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type',
};

/**
 * Intercept POST /themes and record every create request the form sends.
 *
 * The cross-origin JSON+Authorization POST triggers a CORS preflight, so the
 * OPTIONS request is answered here too; otherwise the real POST would be
 * blocked and the happy path could never reach the stub.
 *
 * @param {import('playwright').Page} page
 * @param {{ status?: number, detail?: string, body?: unknown }} [options]
 * @returns {Array<object>} a live array that collects each parsed request body
 */
async function stubCreateThemeEndpoint(page, { status = 201, detail, body } = {}) {
  const requests = [];
  await page.unroute(CREATE_THEME_ROUTE).catch(() => {});
  await page.route(CREATE_THEME_ROUTE, async (route) => {
    const request = route.request();

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    if (request.method() !== 'POST') {
      await route.fallback();
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(request.postData() || 'null');
    } catch {
      payload = null;
    }
    requests.push(payload);

    // On success echo the payload back as the created resource (mirrors the
    // backend response_model=Theme) so the UI can render the new row.
    const responseBody =
      body ?? (status < 400 ? { id: `ts011-created-${requests.length}`, ...payload } : { detail: detail ?? 'error' });

    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    });
  });
  return requests;
}

module.exports = { stubThemesEndpoint, THEMES_ROUTE, stubCreateThemeEndpoint, CREATE_THEME_ROUTE };
