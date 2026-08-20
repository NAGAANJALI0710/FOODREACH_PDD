// ─────────────────────────────────────────────────────────────────────────────
// FoodReach AI — Selenium Helper: Shared Chrome Driver Builder
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'https://Anjali-0710.github.io/FoodShare';
const TIMEOUT  = parseInt(process.env.SELENIUM_TIMEOUT || '15000', 10);

/**
 * Build a headless Chrome WebDriver
 * @param {object} opts
 * @param {boolean} [opts.headless=true]
 * @param {number}  [opts.width=1280]
 * @param {number}  [opts.height=800]
 */
async function buildDriver(opts = {}) {
  const { headless = true, width = 1280, height = 800 } = opts;
  const options = new chrome.Options();
  if (headless) {
    options.addArguments(
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-infobars',
      '--ignore-certificate-errors',
      '--allow-insecure-localhost'
    );
  }
  options.addArguments(`--window-size=${width},${height}`);
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  await driver.manage().window().setRect({ width, height });
  await driver.manage().setTimeouts({ implicit: TIMEOUT });
  return driver;
}

/**
 * Navigate to a hash route
 */
async function goTo(driver, hash) {
  await driver.get(`${BASE_URL}${hash}`);
  await driver.sleep(800);
}

/**
 * Wait for an element and return it
 */
async function waitFor(driver, locator, timeout = TIMEOUT) {
  return driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Safe click — scrolls into view first
 */
async function safeClick(driver, locator) {
  const el = await waitFor(driver, locator);
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', el);
  await driver.sleep(200);
  await el.click();
  return el;
}

/**
 * Fill an input field
 */
async function fillField(driver, locator, value) {
  const el = await waitFor(driver, locator);
  await el.clear();
  await el.sendKeys(value);
  return el;
}

/**
 * Get page body text (lowercase)
 */
async function bodyText(driver) {
  const body = await driver.findElement(By.tagName('body'));
  return (await body.getText()).toLowerCase();
}

/**
 * Check if page URL contains a fragment
 */
async function urlContains(driver, fragment) {
  const url = await driver.getCurrentUrl();
  return url.toLowerCase().includes(fragment.toLowerCase());
}

module.exports = { buildDriver, goTo, waitFor, safeClick, fillField, bodyText, urlContains, BASE_URL, TIMEOUT, By, until, Key };
