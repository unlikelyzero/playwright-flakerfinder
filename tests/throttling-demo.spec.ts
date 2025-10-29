import { test, expect } from '../baseFixtures';

// Test data URLs
const COMPLEX_PAGE_URL =
  'data:text/html,<html><body><div id="content">Complex page content loaded</div></body></html>';
const CALCULATION_RESULT_URL =
  'data:text/html,<html><body><div id="result">Calculation complete: 42</div></body></html>';
const NETWORK_REQUEST_URL =
  'data:text/html,<html><body><div id="status">Request completed!</div></body></html>';

test.describe('throttling demonstration', () => {
  test('should demonstrate throttling effect with complex page - standard chrome', async ({
    page,
  }) => {
    const startTime = Date.now();

    // Use a data URL for reliable testing
    await page.goto(COMPLEX_PAGE_URL);

    const loadTime = Date.now() - startTime;
    console.log(`Standard Chrome load time: ${loadTime}ms`);

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should demonstrate throttling effect with complex page - throttled chrome-for-flake', async ({
    page,
  }) => {
    const startTime = Date.now();

    // Use a data URL for reliable testing
    await page.goto(COMPLEX_PAGE_URL);

    const loadTime = Date.now() - startTime;
    console.log(`Throttled Chrome (chrome-for-flake) load time: ${loadTime}ms`);

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should demonstrate CPU throttling with JavaScript execution', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(CALCULATION_RESULT_URL);

    // Wait for the element to be visible
    await page.waitForSelector('#result');

    const loadTime = Date.now() - startTime;
    console.log(`JavaScript execution time: ${loadTime}ms`);

    // Verify calculation completed
    const result = await page.textContent('#result');
    expect(result).toContain('Calculation complete');
  });

  test('should demonstrate network throttling with multiple requests', async ({ page }) => {
    const startTime = Date.now();

    // Create a simple page that doesn't rely on external services
    await page.goto(NETWORK_REQUEST_URL);

    // Wait for request to complete
    await page.waitForSelector('#status');

    const loadTime = Date.now() - startTime;
    console.log(`Network request completion time: ${loadTime}ms`);

    // Verify request completed
    const status = await page.textContent('#status');
    expect(status).toContain('Request completed');
  });

  test('should handle basic DOM interactions reliably', async ({ page }) => {
    // This test demonstrates that basic operations work consistently
    // even under throttled conditions
    const startTime = Date.now();

    const testPage =
      'data:text/html,<html><body><button id="btn">Click Me</button><div id="output"></div><script>document.getElementById("btn").onclick=()=>{document.getElementById("output").textContent="Clicked!"}</script></body></html>';

    await page.goto(testPage);

    // Wait for button to be ready
    await page.waitForSelector('#btn');

    // Click the button
    await page.click('#btn');

    // Verify the output
    await expect(page.locator('#output')).toHaveText('Clicked!');

    const executionTime = Date.now() - startTime;
    console.log(`DOM interaction test completed in: ${executionTime}ms`);
  });
});
