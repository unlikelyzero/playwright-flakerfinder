import { test, expect } from '../baseFixtures';

test.describe('Throttling Demonstration', () => {
  
  test('should demonstrate throttling effect with complex page - standard chrome', async ({ page }) => {
    const startTime = Date.now();
    
    // Use a more complex page that will show throttling effects
    await page.goto('https://httpbin.org/delay/1');
    
    // Wait for response
    await page.waitForResponse(response => response.url().includes('httpbin.org/delay/1'));
    
    const loadTime = Date.now() - startTime;
    console.log(`Standard Chrome load time: ${loadTime}ms`);
    
    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should demonstrate throttling effect with complex page - throttled chrome-for-flake', async ({ page }) => {
    const startTime = Date.now();
    
    // Use a more complex page that will show throttling effects
    await page.goto('https://httpbin.org/delay/1');
    
    // Wait for response
    await page.waitForResponse(response => response.url().includes('httpbin.org/delay/1'));
    
    const loadTime = Date.now() - startTime;
    console.log(`Throttled Chrome (chrome-for-flake) load time: ${loadTime}ms`);
    
    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should demonstrate CPU throttling with JavaScript execution', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('data:text/html,<html><body><div id="result"></div><script>' +
      '// CPU-intensive operation' +
      'let result = 0;' +
      'for (let i = 0; i < 1000000; i++) {' +
        'result += Math.sqrt(i) * Math.sin(i);' +
      '}' +
      'document.getElementById("result").textContent = "Calculation complete: " + result;' +
      '</script></body></html>');
    
    // Wait for the calculation to complete
    await page.waitForSelector('#result:not(:empty)');
    
    const loadTime = Date.now() - startTime;
    console.log(`JavaScript execution time: ${loadTime}ms`);
    
    // Verify calculation completed
    const result = await page.textContent('#result');
    expect(result).toContain('Calculation complete');
  });

  test('should demonstrate network throttling with multiple requests', async ({ page }) => {
    const startTime = Date.now();
    
    // Create a page that makes multiple requests
    await page.goto('data:text/html,<html><body><div id="status">Loading...</div><script>' +
      'async function loadData() {' +
        'const status = document.getElementById("status");' +
        'try {' +
          '// Make multiple requests to demonstrate network throttling' +
          'const promises = [];' +
          'for (let i = 0; i < 5; i++) {' +
            'promises.push(fetch("https://httpbin.org/delay/0.5").then(r => r.json()));' +
          '}' +
          'await Promise.all(promises);' +
          'status.textContent = "All requests completed!";' +
        '} catch (error) {' +
          'status.textContent = "Error: " + error.message;' +
        '}' +
      '}' +
      'loadData();' +
      '</script></body></html>');
    
    // Wait for all requests to complete
    await page.waitForSelector('#status:not(:empty)');
    await page.waitForFunction(() => {
      const status = document.getElementById('status');
      return status && status.textContent?.includes('completed');
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`Multiple requests completion time: ${loadTime}ms`);
    
    // Verify all requests completed
    const status = await page.textContent('#status');
    expect(status).toContain('All requests completed');
  });
});
