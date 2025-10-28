#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Playwright FlakerFinder Performance Comparison');
console.log('================================================\n');

// Function to run tests and capture timing
function runTests(mode, description) {
  console.log(`📊 Running ${description}...`);
  const startTime = Date.now();

  try {
    const result = execSync(`npm run test:${mode}`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ ${description} completed in ${(duration / 1000).toFixed(1)}s`);
    return { success: true, duration, output: result };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ ${description} failed after ${(duration / 1000).toFixed(1)}s`);
    return { success: false, duration, output: error.stdout || error.message };
  }
}

// Function to extract performance metrics from output
function extractMetrics(output) {
  const metrics = {
    loadTimes: [],
    throttlingApplied: false,
    testResults: { passed: 0, failed: 0 },
  };

  // Extract load times
  const loadTimeMatches = output.match(/(\w+)\s+load time:\s+(\d+)ms/g);
  if (loadTimeMatches) {
    loadTimeMatches.forEach(match => {
      const timeMatch = match.match(/(\d+)ms/);
      if (timeMatch) {
        metrics.loadTimes.push(parseInt(timeMatch[1]));
      }
    });
  }

  // Check if throttling was applied
  metrics.throttlingApplied = output.includes('Applying throttling to chrome-for-flake project');

  // Extract test results
  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);

  if (passedMatch) metrics.testResults.passed = parseInt(passedMatch[1]);
  if (failedMatch) metrics.testResults.failed = parseInt(failedMatch[1]);

  return metrics;
}

// Main execution
async function main() {
  const results = {};

  // Run Local Headed (baseline with UI)
  console.log('1️⃣  LOCAL HEADED MODE (Baseline with UI)');
  console.log('------------------------------------------');
  const headedResult = runTests('local-headed', 'Local Headed Tests');
  results.headed = {
    ...headedResult,
    metrics: extractMetrics(headedResult.output),
    mode: 'local-headed',
    description: 'Local Headed (Full Performance + UI)',
  };

  // Run Local Headless (baseline without UI)
  console.log('\n2️⃣  LOCAL HEADLESS MODE (Baseline without UI)');
  console.log('----------------------------------------------');
  const headlessResult = runTests('local-headless', 'Local Headless Tests');
  results.headless = {
    ...headlessResult,
    metrics: extractMetrics(headlessResult.output),
    mode: 'local-headless',
    description: 'Local Headless (Full Performance)',
  };

  // Run Local Flake (simulated CI)
  console.log('\n3️⃣  LOCAL FLAKE MODE (Simulated CI)');
  console.log('------------------------------------');
  const flakeResult = runTests('local-flake', 'Local Flake Tests (Simulated CI)');
  results.flake = {
    ...flakeResult,
    metrics: extractMetrics(flakeResult.output),
    mode: 'local-flake',
    description: 'Local Flake (Simulated CI Environment)',
  };

  // Check if we have CI data from previous run
  console.log('\n4️⃣  CI MODE (Actual CI Environment)');
  console.log('------------------------------------');
  const ciReportPath = path.join(process.cwd(), 'ci-performance-report.json');
  if (fs.existsSync(ciReportPath)) {
    try {
      const ciData = JSON.parse(fs.readFileSync(ciReportPath, 'utf8'));
      results.ci = {
        ...ciData,
        description: 'CI Mode (Actual CI Environment)',
      };
      console.log('✅ Using archived CI performance data');
    } catch (error) {
      console.log('❌ Failed to load CI data:', error.message);
      results.ci = {
        success: false,
        duration: 0,
        metrics: { loadTimes: [], throttlingApplied: false, testResults: { passed: 0, failed: 0 } },
        description: 'CI Mode (No Data Available)',
      };
    }
  } else {
    console.log('ℹ️  No CI data available. Run in CI environment to generate CI performance data.');
    results.ci = {
      success: false,
      duration: 0,
      metrics: { loadTimes: [], throttlingApplied: false, testResults: { passed: 0, failed: 0 } },
      description: 'CI Mode (No Data Available)',
    };
  }

  // Generate comparison report
  console.log('\n📈 COMPREHENSIVE PERFORMANCE COMPARISON');
  console.log('========================================');

  console.log('\n| Mode | Duration | Load Times | Throttling | Pass Rate |');
  console.log('|------|----------|------------|------------|-----------|');

  Object.values(results).forEach(result => {
    const avgLoadTime =
      result.metrics.loadTimes.length > 0
        ? (
            result.metrics.loadTimes.reduce((a, b) => a + b, 0) / result.metrics.loadTimes.length
          ).toFixed(0)
        : 'N/A';

    const totalTests = result.metrics.testResults.passed + result.metrics.testResults.failed;
    const passRate =
      totalTests > 0
        ? ((result.metrics.testResults.passed / totalTests) * 100).toFixed(1) + '%'
        : 'N/A';

    const throttlingStatus = result.metrics.throttlingApplied ? '✅ Yes' : '❌ No';
    const duration = result.duration > 0 ? `${(result.duration / 1000).toFixed(1)}s` : 'N/A';

    console.log(
      `| ${result.description} | ${duration} | ${avgLoadTime}ms | ${throttlingStatus} | ${passRate} |`
    );
  });

  // Key insights
  console.log('\n🔍 KEY INSIGHTS');
  console.log('===============');

  // Compare local modes
  if (
    results.headed.metrics.loadTimes.length > 0 &&
    results.headless.metrics.loadTimes.length > 0
  ) {
    const headedAvg =
      results.headed.metrics.loadTimes.reduce((a, b) => a + b, 0) /
      results.headed.metrics.loadTimes.length;
    const headlessAvg =
      results.headless.metrics.loadTimes.reduce((a, b) => a + b, 0) /
      results.headless.metrics.loadTimes.length;
    const uiOverhead = (((headedAvg - headlessAvg) / headlessAvg) * 100).toFixed(1);

    console.log(`• UI Overhead: Headed mode is ${uiOverhead}% slower than headless`);
  }

  // Compare local vs simulated CI
  if (results.headless.metrics.loadTimes.length > 0 && results.flake.metrics.loadTimes.length > 0) {
    const headlessAvg =
      results.headless.metrics.loadTimes.reduce((a, b) => a + b, 0) /
      results.headless.metrics.loadTimes.length;
    const flakeAvg =
      results.flake.metrics.loadTimes.reduce((a, b) => a + b, 0) /
      results.flake.metrics.loadTimes.length;
    const slowdown = (flakeAvg / headlessAvg).toFixed(1);

    console.log(`• Simulated CI Impact: ${slowdown}x slower than local headless`);
  }

  // Compare simulated vs actual CI
  if (results.flake.metrics.loadTimes.length > 0 && results.ci.metrics.loadTimes.length > 0) {
    const flakeAvg =
      results.flake.metrics.loadTimes.reduce((a, b) => a + b, 0) /
      results.flake.metrics.loadTimes.length;
    const ciAvg =
      results.ci.metrics.loadTimes.reduce((a, b) => a + b, 0) / results.ci.metrics.loadTimes.length;
    const accuracy = ((Math.abs(flakeAvg - ciAvg) / ciAvg) * 100).toFixed(1);

    console.log(`• Simulation Accuracy: ${accuracy}% difference from actual CI`);
  }

  console.log(
    `• Local Headed Success Rate: ${results.headed.metrics.testResults.passed}/${results.headed.metrics.testResults.passed + results.headed.metrics.testResults.failed} tests passed`
  );
  console.log(
    `• Local Headless Success Rate: ${results.headless.metrics.testResults.passed}/${results.headless.metrics.testResults.passed + results.headless.metrics.testResults.failed} tests passed`
  );
  console.log(
    `• Simulated CI Success Rate: ${results.flake.metrics.testResults.passed}/${results.flake.metrics.testResults.passed + results.flake.metrics.testResults.failed} tests passed`
  );

  if (results.ci.metrics.testResults.passed + results.ci.metrics.testResults.failed > 0) {
    console.log(
      `• Actual CI Success Rate: ${results.ci.metrics.testResults.passed}/${results.ci.metrics.testResults.passed + results.ci.metrics.testResults.failed} tests passed`
    );
  }

  if (results.flake.metrics.throttlingApplied) {
    console.log(
      '• Throttling: Successfully applied CPU and network throttling in simulated CI mode'
    );
  } else {
    console.log('• Throttling: ⚠️  Throttling may not have been applied correctly');
  }

  console.log('\n💡 CONCLUSION');
  console.log('==============');
  console.log('This comprehensive comparison shows:');
  console.log('• **UI Impact**: How browser UI affects performance');
  console.log('• **Local vs Simulated CI**: Throttling simulation effectiveness');
  console.log('• **Simulation Accuracy**: How well local simulation predicts actual CI');
  console.log('• **Flakiness Sources**: Multiple performance factors that cause test failures');

  // Save results to file
  const reportPath = path.join(process.cwd(), 'comprehensive-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Comprehensive results saved to: ${reportPath}`);
}

main().catch(console.error);
