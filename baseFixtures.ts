import { Page, test as base } from '@playwright/test';

/**
 * Apply CPU and network throttling using the Chrome DevTools Protocol.
 * Only works on Chromium/Chrome.
 */
export async function applyThrottling(
  page: Page,
  opts?: {
    cpuRate?: number; // 1 = no throttle, 2 ≈ 2x slower CPU
    latencyMs?: number;
    downloadBps?: number; // bytes/sec
    uploadBps?: number; // bytes/sec
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
 * Export a test that keeps the standard `{ page }` signature.
 * If the running project is `chrome-for-flake`, we transparently throttle.
 */
export const test = base.extend<{ page: Page }>({
  // Override Playwright's built-in `page` fixture
  page: async ({ page }, use, testInfo) => {
    console.log(`Project name: ${testInfo.project.name}`);
    if (testInfo.project.name === 'chrome-for-flake') {
      console.log('Applying throttling to chrome-for-flake project');
      await applyThrottling(page);
    } else {
      console.log('No throttling applied');
    }
    await use(page);
  },
});

export const expect = base.expect;
