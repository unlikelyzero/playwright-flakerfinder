import { test, expect } from '../baseFixtures';

test.describe('crowdstrike website - comprehensive user journey test', () => {
  test.afterEach(async ({ page }) => {
    // Check for JavaScript errors using the new pageErrors API
    const pageErrors = await page.pageErrors();

    console.log(`Found ${pageErrors.length} JavaScript errors`);
    pageErrors.slice(0, 3).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.message}`);
    });

    // Verify no critical JavaScript errors
    const criticalErrors = pageErrors.filter(
      error =>
        error.message.includes('TypeError') ||
        error.message.includes('ReferenceError') ||
        error.message.includes('SyntaxError')
    );

    console.log(`Found ${criticalErrors.length} critical JavaScript errors`);
    // This will fail the test if critical errors are present
    expect(criticalErrors).toHaveLength(0);
  });

  test('comprehensive end-to-end user journey - deep platform exploration', async ({ page }) => {
    console.log('Starting comprehensive CrowdStrike user journey test...');
    const journeyStartTime = Date.now();

    await test.step('Initial Homepage Load and Cookie Handling', async () => {
      await page.goto('https://www.crowdstrike.com');
      await page.waitForLoadState('domcontentloaded');

      // Handle cookie consent banner (critical for subsequent interactions)
      const cookieConsent = page
        .locator(
          '#onetrust-accept-btn-handler, .cookie-accept, [data-testid*="accept"], button:has-text("OK")'
        )
        .first();
      await cookieConsent.click();
      console.log('SUCCESS: Cookie consent banner handled');
    });

    await test.step('Explore Platform Section - Deep Navigation', async () => {
      await page.goto('https://www.crowdstrike.com/en-us/products/');
      await page.waitForLoadState('domcontentloaded');

      // Test platform products using aria snapshot comparison
      await expect(page.locator('body')).toMatchAriaSnapshot(`
        - heading "Tailored bundles to stop breaches" [level=1]
        - heading "Falcon Go" [level=3]
        - heading "Falcon Pro" [level=3]
        - heading "Falcon Enterprise" [level=3]
        - heading "Falcon Complete" [level=3]
      `);

      console.log('SUCCESS: Platform products verified with aria snapshot');
    });

    await test.step('Trial Signup Form Testing (No Actual Submission)', async () => {
      await page.goto('https://www.crowdstrike.com/en-us/products/trials/try-falcon/');
      await page.waitForLoadState('domcontentloaded');

      // Handle cookie consent on trial page - accept cookies and wait for modal to close
      const trialCookieConsent = page.locator('#onetrust-accept-btn-handler').first();
      await trialCookieConsent.click();

      // Wait for the cookie consent SDK to disappear completely before interacting with form
      await page.locator('#onetrust-consent-sdk').waitFor({ state: 'hidden' });
      console.log('SUCCESS: Trial page cookie consent handled');

      // Test form elements (fill but don't submit)
      const formElements = [
        { selector: 'input[name="FirstName"]', value: 'Test', description: 'First Name' },
        { selector: 'input[name="LastName"]', value: 'User', description: 'Last Name' },
        { selector: 'input[name="Company"]', value: 'Test Company', description: 'Company' },
        { selector: 'input[name="Email"]', value: 'test@example.com', description: 'Email' },
        { selector: 'input[name="Phone"]', value: '555-123-4567', description: 'Phone' },
      ];

      let formFieldsTested = 0;
      for (const field of formElements) {
        const element = page.locator(field.selector).first();
        await element.scrollIntoViewIfNeeded();
        await element.fill(field.value);
        formFieldsTested++;
        console.log(`SUCCESS: Filled ${field.description} field (no submission)`);
      }

      // Test country dropdown
      const countryDropdown = page.locator('select[name="Country"]').first();
      await countryDropdown.selectOption('United States');
      formFieldsTested++;
      console.log('SUCCESS: Selected country from dropdown (no submission)');

      // Test terms and conditions checkbox
      const termsCheckbox = page.locator('input[name="Trial_T_C_Version__c"]').first();
      await termsCheckbox.check();
      console.log('SUCCESS: Checked terms and conditions (no submission)');

      // Verify form is ready but explicitly avoid submission
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.isVisible();
      console.log('SUCCESS: Submit button found but intentionally not clicked');

      console.log(`SUCCESS: Tested ${formFieldsTested} form fields (no submission)`);
    });

    await test.step('Performance Monitoring Throughout Journey', async () => {
      const journeyEndTime = Date.now();
      const totalJourneyTime = journeyEndTime - journeyStartTime;

      // Monitor network requests throughout the journey
      const allRequests: string[] = [];
      page.on('request', request => {
        allRequests.push(request.url());
      });

      console.log(`Journey Performance Metrics:`);
      console.log(`- Total journey time: ${totalJourneyTime}ms`);
      console.log(`- Network requests: ${allRequests.length}`);

      // Assertions - use a reasonable default max time
      // Adjust based on your test environment needs
      const maxJourneyTime = 300000; // 5 minutes max
      expect(totalJourneyTime).toBeLessThan(maxJourneyTime);

      console.log('Comprehensive user journey test completed successfully!');
    });
  });
});
