# Playwright FlakerFinder

A demonstration project showcasing techniques for finding and addressing test flakiness in Playwright tests. This project targets crowdstrike.com and includes configurations to simulate underpowered CI environments as well as a pattern for running the new tests 10x to identify flake

## Overview

This project demonstrates how the various modes of operating Chrome locally (headed or headless) can have impact on test execution performance. This project also demonstrates the impact the CI resources can have on test performance by artificially limiting resources with the `chrome-for-flake` profile. Lastly, it serves as an example repo on how to run new tests to verify that they're not flaky by only running newly changed tests.

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd playwright-flakerfinder
```

2. Install dependencies using nvm

```bash
# Install nvm if you haven't already
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js LTS 22
nvm install 22
nvm use 22

# Install dependencies
npm install
```

## Running Tests

### 1. Local Headed Mode (GPU Enabled)

```bash
npm run test:local-headed
```

### 2. Local Headless Mode

```bash
npm run test:local-headless
```

### 3. Local Flake Mode

```bash
npm run test:local-flake
```

Uses the `chrome-for-flake` project to inject CPU throttling and network constraints on a running browser.

### 4. Flake Testing for New Tests

```bash
npm run test:flake-new
```

Runs only changed tests 10 times with the `chrome-for-flake` project to catch flakiness in new tests before they're merged. This uses Playwright's `--only-changed` flag to detect which tests have been modified and repeats each one 10 times under throttled conditions.

**Use this to:**

- Validate new tests are stable before committing
- Catch timing-sensitive issues early in development
- Ensure tests pass consistently under CI-like conditions

### Performance Analysis Comparison

```bash
npm run test:compare
```

Runs tests in multiple modes and generates a comprehensive performance comparison report.

### Viewing Results in CI

The GitHub Actions workflow includes two parallel jobs:

1. **Flake Detection Job**: Runs changed tests 10 times with throttling to catch flakiness
2. **Test Comparison Job**: Executes the full test suite and generates performance reports

**To view results:**

1. Go to the **Actions** tab in your GitHub repository
2. Click on any workflow run
3. View both job results:
   - **flake-detection**: Shows the Flake Detection Report
   - **test-comparison**: Shows the CI Performance Report
4. Download artifacts:
   - `flake-test-results`: Results from flake detection (30 days retention)
   - `playwright-report`: HTML test report from test comparison
   - `ci-performance-data`: CI performance metrics (90 days retention)
5. Use CI data locally: Download `ci-performance-data` and place as `ci-performance-report.json` in project root
6. Run `npm run test:compare` locally for comprehensive 4-mode comparison

**Note:** The flake-detection job will fail the CI build if any changed test fails during its 10 iterations, preventing flaky tests from being merged. This job runs in parallel with the main test suite for faster feedback.

## Test Scenarios

There are two styles of tests:

1. `crowdstrike.spec.ts` - Runs a long-running user journey against crowdstrike.com to simulate network and CPU impact to test runtime.
2. `throttling-demo.spec.ts` - Injects artificial websites with performance issues to characterize network and CPU impact to test runtime.

## Network Latency Measurements

The test suite now includes comprehensive network latency tracking using Playwright's built-in `Request.timing()` API to measure actual network performance between the Playwright runner and crowdstrike.com resources.

## Understanding Flakiness

### Common Causes of Test Flakiness

1. **Timing Issues**: Elements not ready when tests try to interact
2. **Network Conditions**: Slow or unstable connections in CI
3. **Resource Constraints**: Limited CPU/memory in CI environments
4. **Race Conditions**: Asynchronous operations completing in unpredictable order

## Integrating chrome-for-flake into Your Project

You can integrate the chrome-for-flake pattern into your own Playwright project to test for flakiness under simulated CI conditions. This involves three main steps:

### Step 1: Add the Throttling Fixture

Create a fixture file (e.g., `baseFixtures.ts` or `test-setup.ts`) with the `applyThrottling` function and a custom test fixture:

```typescript
import { Page, test as base } from '@playwright/test';

/**
 * Apply CPU and network throttling using the Chrome DevTools Protocol.
 * Only works on Chromium/Chrome browsers.
 */
export async function applyThrottling(
  page: Page,
  opts?: {
    cpuRate?: number; // 1 = no throttle, 2 = 2x slower CPU
    latencyMs?: number; // Network latency in milliseconds
    downloadBps?: number; // Download speed in bytes/sec
    uploadBps?: number; // Upload speed in bytes/sec
  }
): Promise<void> {
  const cpuRate = opts?.cpuRate ?? 2;
  const latencyMs = opts?.latencyMs ?? 100;
  const downloadBps = opts?.downloadBps ?? Math.floor((3 * 1024 * 1024) / 8); // ~3 Mbps
  const uploadBps = opts?.uploadBps ?? Math.floor((1.5 * 1024 * 1024) / 8); // ~1.5 Mbps

  // Create a CDP session bound to this page
  const client = await page.context().newCDPSession(page);

  // CPU throttling
  await client.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });

  // Network throttling (must enable Network domain first)
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: latencyMs,
    downloadThroughput: downloadBps,
    uploadThroughput: uploadBps,
    connectionType: 'cellular4g',
  });
}

/**
 * Export a test that keeps the standard { page } signature.
 * If the running project is 'chrome-for-flake', throttling is automatically applied.
 */
export const test = base.extend<{ page: Page }>({
  // Override Playwright's built-in page fixture
  page: async ({ page }, use, testInfo) => {
    if (testInfo.project.name === 'chrome-for-flake') {
      console.log('Applying throttling to chrome-for-flake project');
      await applyThrottling(page);
    }
    await use(page);
  },
});

export const expect = base.expect;
```

### Step 2: Add chrome-for-flake Project to Config

Update your `playwright.config.ts` to include a `chrome-for-flake` project:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // ... other config options ...

  projects: [
    {
      name: 'chrome', // Example of standard Chrome
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'chrome-for-flake', // All that's needed. Configuration happens in baseFixtures.ts
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
```

### Step 3: Use the Custom Test Fixture in Your Tests

Replace the standard Playwright imports in your test files:

```typescript
// Instead of:
// import { test, expect } from '@playwright/test';

// Use your custom fixture:
import { test, expect } from './baseFixtures';

test('my test that works in both normal and throttled conditions', async ({ page }) => {
  await page.goto('https://example.com');
  // Throttling is automatically applied when running with chrome-for-flake project
  // No changes needed to your test code
});
```

### Running Tests with chrome-for-flake

Run your tests targeting the `chrome-for-flake` project:

```bash
# Run specific project
npx playwright test --project=chrome-for-flake

# Run both projects for comparison
npx playwright test --project=chrome --project=chrome-for-flake

# Run only changed tests 10 times to catch flakiness in new tests
npx playwright test --project=chrome-for-flake --only-changed --repeat-each 10

# Add to package.json scripts
{
  "scripts": {
    "test": "playwright test --project=chrome",
    "test:flake": "playwright test --project=chrome-for-flake",
    "test:flake-new": "playwright test --project=chrome-for-flake --only-changed --repeat-each 10"
  }
}
```

### Customizing Throttling Levels

You can adjust the throttling parameters in `applyThrottling()` to match your CI environment:

```typescript
await applyThrottling(page, {
  cpuRate: 4, // 4x slower CPU (more aggressive)
  latencyMs: 150, // 150ms network latency
  downloadBps: 1024 * 512, // 512 KB/s download (~4 Mbps)
  uploadBps: 1024 * 256, // 256 KB/s upload (~2 Mbps)
});
```
