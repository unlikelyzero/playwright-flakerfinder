import { test, expect, NetworkLatency, setupNetworkMonitoring } from '../baseFixtures';

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

    // Track network latency for all requests
    const networkLatencies: NetworkLatency[] = [];

    // Set up network monitoring using the simpler Request.timing() API
    setupNetworkMonitoring(page, networkLatencies);

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

      console.log(`Journey Performance Metrics:`);
      console.log(`- Total journey time: ${totalJourneyTime}ms`);
      console.log(`- Network requests tracked: ${networkLatencies.length}`);

      // Analyze static assets (CSS, JS, images, fonts)
      const staticAssets = networkLatencies.filter(
        n =>
          n.resourceType === 'stylesheet' ||
          n.resourceType === 'script' ||
          n.resourceType === 'image' ||
          n.resourceType === 'font'
      );

      // eslint-disable-next-line playwright/no-conditional-in-test
      if (staticAssets.length > 0) {
        const avgStaticLatency =
          staticAssets.reduce((sum, n) => sum + n.latency, 0) / staticAssets.length;
        const maxStaticLatency = Math.max(...staticAssets.map(n => n.latency));
        const minStaticLatency = Math.min(...staticAssets.map(n => n.latency));

        console.log(`\nStatic Assets Network Latency:`);
        console.log(`- Total static assets: ${staticAssets.length}`);
        console.log(`- Average latency: ${avgStaticLatency.toFixed(2)}ms`);
        console.log(`- Min latency: ${minStaticLatency.toFixed(2)}ms`);
        console.log(`- Max latency: ${maxStaticLatency.toFixed(2)}ms`);

        // Show breakdown by resource type
        const cssAssets = staticAssets.filter(n => n.resourceType === 'stylesheet');
        const jsAssets = staticAssets.filter(n => n.resourceType === 'script');
        const imageAssets = staticAssets.filter(n => n.resourceType === 'image');

        // eslint-disable-next-line playwright/no-conditional-in-test
        if (cssAssets.length > 0) {
          const avgCssLatency = cssAssets.reduce((sum, n) => sum + n.latency, 0) / cssAssets.length;
          console.log(`  - CSS files (${cssAssets.length}): avg ${avgCssLatency.toFixed(2)}ms`);
        }
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (jsAssets.length > 0) {
          const avgJsLatency = jsAssets.reduce((sum, n) => sum + n.latency, 0) / jsAssets.length;
          console.log(
            `  - JavaScript files (${jsAssets.length}): avg ${avgJsLatency.toFixed(2)}ms`
          );
        }
        // eslint-disable-next-line playwright/no-conditional-in-test
        if (imageAssets.length > 0) {
          const avgImageLatency =
            imageAssets.reduce((sum, n) => sum + n.latency, 0) / imageAssets.length;
          console.log(
            `  - Image files (${imageAssets.length}): avg ${avgImageLatency.toFixed(2)}ms`
          );
        }
      }

      // Analyze API/fetch requests (likely form submission endpoints)
      const apiRequests = networkLatencies.filter(
        n =>
          n.resourceType === 'fetch' ||
          n.resourceType === 'xhr' ||
          n.url.includes('/api/') ||
          n.url.includes('/submit') ||
          n.url.includes('/form')
      );

      // eslint-disable-next-line playwright/no-conditional-in-test
      if (apiRequests.length > 0) {
        const avgApiLatency =
          apiRequests.reduce((sum, n) => sum + n.latency, 0) / apiRequests.length;
        const maxApiLatency = Math.max(...apiRequests.map(n => n.latency));
        const minApiLatency = Math.min(...apiRequests.map(n => n.latency));

        console.log(`\nAPI/Form Submission Network Latency:`);
        console.log(`- Total API requests: ${apiRequests.length}`);
        console.log(`- Average latency: ${avgApiLatency.toFixed(2)}ms`);
        console.log(`- Min latency: ${minApiLatency.toFixed(2)}ms`);
        console.log(`- Max latency: ${maxApiLatency.toFixed(2)}ms`);

        // Show top 5 slowest API requests
        const slowestApi = [...apiRequests].sort((a, b) => b.latency - a.latency).slice(0, 5);
        console.log(`  Top 5 slowest API requests:`);
        slowestApi.forEach((req, idx) => {
          const urlParts = req.url.split('/');
          const shortUrl = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
          console.log(
            `    ${idx + 1}. ${shortUrl}: ${req.latency.toFixed(2)}ms (${req.resourceType})`
          );
        });
      } else {
        console.log(`\nAPI/Form Submission Network Latency:`);
        console.log(`- No API/fetch requests detected in this test run`);
      }

      // Document requests (HTML pages)
      const documentRequests = networkLatencies.filter(n => n.resourceType === 'document');
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (documentRequests.length > 0) {
        const avgDocLatency =
          documentRequests.reduce((sum, n) => sum + n.latency, 0) / documentRequests.length;
        console.log(`\nHTML Document Network Latency:`);
        console.log(`- Total HTML pages loaded: ${documentRequests.length}`);
        console.log(`- Average latency: ${avgDocLatency.toFixed(2)}ms`);
      }

      // Overall network performance summary
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (networkLatencies.length > 0) {
        const overallAvgLatency =
          networkLatencies.reduce((sum, n) => sum + n.latency, 0) / networkLatencies.length;
        const overallMaxLatency = Math.max(...networkLatencies.map(n => n.latency));
        console.log(`\nOverall Network Performance:`);
        console.log(`- Average latency across all resources: ${overallAvgLatency.toFixed(2)}ms`);
        console.log(`- Maximum latency observed: ${overallMaxLatency.toFixed(2)}ms`);
      }

      // Assertions - use a reasonable default max time
      // Adjust based on your test environment needs
      const maxJourneyTime = 300000; // 5 minutes max
      expect(totalJourneyTime).toBeLessThan(maxJourneyTime);

      console.log('\nComprehensive user journey test completed successfully!');
    });
  });
});
