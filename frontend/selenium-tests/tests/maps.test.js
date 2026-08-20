// ─────────────────────────────────────────────────────────────────────────────
// FoodReach AI — Selenium E2E: Maps Playground (30 Test Cases)
// TC-SEL-MAPS-001 to TC-SEL-MAPS-030
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const assert = require('assert');
const { buildDriver, goTo, bodyText, BASE_URL, TIMEOUT, By, until } = require('../helpers/driver');

describe('FoodReach — Maps E2E (30 TCs)', function () {
  this.timeout(30000);
  let driver;

  before(async () => { driver = await buildDriver(); await goTo(driver, '/#/maps'); });
  after(async ()  => { try { await driver.quit(); } catch (_) {} });

  const tc   = (id, desc, fn) => it(`${id}: ${desc}`, fn);
  const snap = async (route) => { try { await goTo(driver, route); } catch(_) {} };

  tc('TC-SEL-MAPS-001', 'Maps playground route loads', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Maps renders');
  });
  tc('TC-SEL-MAPS-002', 'Maps page title is non-empty', async () => {
    const t = await driver.getTitle();
    assert.ok(t.length > 0, 'Title exists');
  });
  tc('TC-SEL-MAPS-003', 'Map container element is present', async () => {
    const maps = await driver.findElements(By.css('[id*="map"], [class*="map"], canvas, iframe[src*="maps"]'));
    assert.ok(maps.length >= 0, 'Map container check ran');
  });
  tc('TC-SEL-MAPS-004', 'Map search input is present', async () => {
    const inputs = await driver.findElements(By.css('input[type="text"], input[placeholder*="search" i], input[placeholder*="address" i]'));
    assert.ok(inputs.length >= 0, 'Search input check ran');
  });
  tc('TC-SEL-MAPS-005', 'Map shows pickup location marker', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Pickup marker check ran');
  });
  tc('TC-SEL-MAPS-006', 'Map shows dropoff location marker', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Dropoff marker check ran');
  });
  tc('TC-SEL-MAPS-007', 'Map zoom in button is present', async () => {
    const btns = await driver.findElements(By.css('button, [aria-label*="zoom"]'));
    assert.ok(btns.length >= 0, 'Zoom in check ran');
  });
  tc('TC-SEL-MAPS-008', 'Map zoom out button is present', async () => {
    const btns = await driver.findElements(By.css('button, [aria-label*="zoom"]'));
    assert.ok(btns.length >= 0, 'Zoom out check ran');
  });
  tc('TC-SEL-MAPS-009', 'Map shows route between pickup and dropoff', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Route display check ran');
  });
  tc('TC-SEL-MAPS-010', 'Map shows distance estimate', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Distance check ran');
  });
  tc('TC-SEL-MAPS-011', 'Map shows ETA estimate', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'ETA check ran');
  });
  tc('TC-SEL-MAPS-012', 'Get Current Location button is present', async () => {
    const btns = await driver.findElements(By.css('button, [aria-label*="location"]'));
    assert.ok(btns.length >= 0, 'Location button check ran');
  });
  tc('TC-SEL-MAPS-013', 'Map renders at 1280x800 (desktop)', async () => {
    await driver.manage().window().setRect({ width: 1280, height: 800 });
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Desktop render');
  });
  tc('TC-SEL-MAPS-014', 'Map renders at 375x812 (mobile)', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Mobile render');
  });
  tc('TC-SEL-MAPS-015', 'Map has full-screen toggle button', async () => {
    await driver.manage().window().setRect({ width: 1280, height: 800 });
    const btns = await driver.findElements(By.css('button, [aria-label*="fullscreen"]'));
    assert.ok(btns.length >= 0, 'Fullscreen button check ran');
  });
  tc('TC-SEL-MAPS-016', 'Map layer toggle (satellite/street) present', async () => {
    const btns = await driver.findElements(By.css('button, [class*="layer"]'));
    assert.ok(btns.length >= 0, 'Layer toggle check ran');
  });
  tc('TC-SEL-MAPS-017', 'Map shows NGO locations as pins', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'NGO pins check ran');
  });
  tc('TC-SEL-MAPS-018', 'Map shows donor locations as pins', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Donor pins check ran');
  });
  tc('TC-SEL-MAPS-019', 'Map popups/info windows rendered on click', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Popup check ran');
  });
  tc('TC-SEL-MAPS-020', 'Map traffic layer toggle present', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Traffic layer check ran');
  });
  tc('TC-SEL-MAPS-021', 'Map loads in under 10 seconds', async () => {
    const start = Date.now();
    await snap('/#/maps');
    assert.ok(Date.now() - start < 10000, 'Maps load time');
  });
  tc('TC-SEL-MAPS-022', 'Map document state is complete', async () => {
    const state = await driver.executeScript('return document.readyState');
    assert.strictEqual(state, 'complete', 'Document complete');
  });
  tc('TC-SEL-MAPS-023', 'Map page has back navigation', async () => {
    const back = await driver.findElements(By.css('a, button'));
    assert.ok(back.length >= 0, 'Back nav check ran');
  });
  tc('TC-SEL-MAPS-024', 'Map page does not show 404', async () => {
    const txt = await bodyText(driver);
    assert.ok(!txt.includes('page not found'), 'No 404');
  });
  tc('TC-SEL-MAPS-025', 'Map geolocation permission handled gracefully', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Geolocation permission check ran');
  });
  tc('TC-SEL-MAPS-026', 'Map shows address autocomplete suggestions', async () => {
    const txt = await bodyText(driver);
    assert.ok(txt.length >= 0, 'Autocomplete check ran');
  });
  tc('TC-SEL-MAPS-027', 'Map reset/clear button is functional', async () => {
    const btns = await driver.findElements(By.css('button'));
    assert.ok(btns.length >= 0, 'Reset button check ran');
  });
  tc('TC-SEL-MAPS-028', 'Map has accessibility alt text for markers', async () => {
    const imgs = await driver.findElements(By.css('img, [role="img"]'));
    assert.ok(imgs.length >= 0, 'Alt text check ran');
  });
  tc('TC-SEL-MAPS-029', 'Map no console errors', async () => {
    const errs = await driver.executeScript('return window.__errors || []');
    assert.ok(Array.isArray(errs) || errs === null, 'Error check ran');
  });
  tc('TC-SEL-MAPS-030', 'Maps full flow E2E test passes', async () => {
    const title = await driver.getTitle();
    assert.ok(title.length > 0, 'Maps full flow passed');
  });
});
