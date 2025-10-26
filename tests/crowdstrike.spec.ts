import { test, expect } from '../baseFixtures';

test.describe('CrowdStrike Website Tests', () => {
  
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
    
    // Try to interact with elements that might not be ready
    const heroSection = page.locator('[data-testid="hero-section"], .hero, [class*="hero"]').first();
    
    if (await heroSection.isVisible()) {
      await heroSection.hover();
      await page.waitForTimeout(100); // Small delay that might cause issues in slow environments
    }
    
    // Look for interactive elements that might be timing-sensitive
    const buttons = page.locator('button, [role="button"], a[href]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Try to click the first button - this might fail in throttled environments
      await buttons.first().click();
    }
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
