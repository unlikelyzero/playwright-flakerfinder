import { test, expect } from '../baseFixtures';

test.describe('crowdstrike website tests', () => {
  
  test('should load CrowdStrike homepage - standard chrome', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://www.crowdstrike.com');
    
    // Wait for basic page structure
    await page.waitForSelector('body');
    
    // Verify key elements are present
    await expect(page).toHaveTitle(/CrowdStrike/);
    
    const loadTime = Date.now() - startTime;
    console.log(`Standard Chrome load time: ${loadTime}ms`);
  });

  test('should load CrowdStrike homepage - throttled chrome-for-flake', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://www.crowdstrike.com');
    
    // Wait for basic page structure
    await page.waitForSelector('body');
    
    // Verify key elements are present
    await expect(page).toHaveTitle(/CrowdStrike/);
    
    const loadTime = Date.now() - startTime;
    console.log(`Throttled Chrome (chrome-for-flake) load time: ${loadTime}ms`);
  });

  test('should demonstrate flakiness with timing-sensitive interactions', async ({ page }) => {
    await page.goto('https://www.crowdstrike.com');
    
    // Wait for basic page structure
    await page.waitForSelector('body');
    
    // This test demonstrates potential flakiness with timing-sensitive operations
    // In a throttled environment, these operations might fail intermittently
    
    // Verify the page is interactive by checking for common elements
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Test that the page has loaded interactive content
    await expect(page.locator('a').first()).toBeVisible();
  });

  test('should handle slow network conditions gracefully', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate with longer timeout for slow conditions
    await page.goto('https://www.crowdstrike.com');
    
    // Wait for critical content
    await page.waitForSelector('body');
    
    const loadTime = Date.now() - startTime;
    console.log(`Slow network load time: ${loadTime}ms`);
    
    // Verify basic page structure is present
    await expect(page.locator('body')).toBeVisible();
  });
});
