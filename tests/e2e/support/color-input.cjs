// Shared driver for native <input type="color"> across the theme modal suites
// (TS-task-011 create, TS-task-012 edit).

/**
 * Set a native <input type="color"> to `hex`. The element is not fillable and a
 * controlled React input ignores a direct value assignment, so drive the native
 * value setter and dispatch input/change events so React's change tracker fires
 * onChange — mirroring a user picking a swatch.
 *
 * @param {import('@playwright/test').Locator} locator  the color input locator
 * @param {string} hex
 */
async function setNativeColor(locator, hex) {
  await locator.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, hex);
}

module.exports = { setNativeColor };
