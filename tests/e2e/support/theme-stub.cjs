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
 * @param {{ status?: number, body?: unknown, delayMs?: number, allowOrigin?: string }} [options]
 */
async function stubThemesEndpoint(page, { status = 200, body = [], delayMs = 0, allowOrigin = '*' } = {}) {
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
      headers: { 'Access-Control-Allow-Origin': allowOrigin },
      body: JSON.stringify(body),
    });
  });
}

module.exports = { stubThemesEndpoint, THEMES_ROUTE };
