// Reusable Playwright network stub for the public GET /themes/ collection endpoint.
//
// Theme UI scenarios run against the real backend and reset the catalog to a
// deterministic baseline (see theme-catalog.cjs). This stub is reserved for the
// few states a healthy backend cannot produce on demand: a slow response
// (loading indicator), a failed fetch (error state), and an empty catalog.
//
// Prefer the real backend + resetThemeCatalog() for anything else: a stub can
// only prove "given the API responds like this, the UI does that", never that
// the frontend and backend actually agree.

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

module.exports = { stubThemesEndpoint, THEMES_ROUTE };
