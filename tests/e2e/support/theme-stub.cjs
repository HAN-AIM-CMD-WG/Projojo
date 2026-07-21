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

// A single theme resource: `/themes/{id}`, and deliberately NOT the `/themes/`
// collection (trailing slash) or the two-segment `/themes/project/{id}`.
const THEME_RESOURCE_ROUTE = /\/themes\/[^/?]+$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, accept',
};

/**
 * Make DELETE /themes/{id} fail for a page, leaving every other request alone.
 *
 * A healthy backend only fails a delete for reasons the UI cannot stage on demand
 * (the real 404 for an already-deleted theme is covered without a stub), so this
 * exists purely to drive the server-error branch of the delete confirmation.
 *
 * @param {import('playwright').Page} page
 * @param {{ status?: number, detail?: string }} [options]
 */
async function stubThemeDeleteEndpoint(page, { status = 500, detail = 'Verwijderen is mislukt' } = {}) {
  await page.unroute(THEME_RESOURCE_ROUTE).catch(() => {});
  await page.route(THEME_RESOURCE_ROUTE, async (route) => {
    const method = route.request().method();
    // The frontend (:10121) calls the backend (:10122) cross-origin, so a DELETE
    // carrying an Authorization header is preflighted. Answer that preflight here;
    // otherwise the browser blocks the request and the UI would show a generic
    // network failure instead of the server error this stub is staging.
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    if (method !== 'DELETE') {
      return route.fallback();
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: CORS_HEADERS,
      body: JSON.stringify({ detail }),
    });
  });
}

module.exports = { stubThemesEndpoint, stubThemeDeleteEndpoint, THEMES_ROUTE };
