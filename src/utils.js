/**
 * Dedicated method to page to click and wait for navigation.
 * Adapted from (c) https://github.com/GoogleChrome/puppeteer/issues/1421
 * @param {import('puppeteer').Page} page
 * @param {string} selector
 * @param {import('puppeteer').NavigationOptions} [waitOptions]
 * @returns {Promise<import('puppeteer').Response>}
 */
module.exports.clickAndWaitNavi = async (page, selector, waitOptions = {}) =>
  Promise.all([
    // NOTE: isso esconde o fato de ter dado algum erro após o .click
    page.waitForNavigation(waitOptions),
    page.click(selector),
  ]).then(value => value[0]);

/**
 *
 * @param {import('puppeteer').Page} page
 * @param {import('puppeteer').ElementHandle} element
 * @param {string} attrName
 */
module.exports.getAttrForElement = (page, element, attrName) =>
  page.evaluate((element, propName) => element[propName], element, attrName);

/**
 *
 * @param {string} id
 * @param {Promise} promise
 * @returns {Promise<{id:string, value:any}>}
 */
module.exports.wrapPromiseResultWithId = (id, promise) => promise.then(value => ({ id, value }));

module.exports.lastElementFromArr = arr => arr.slice(-1).pop();
