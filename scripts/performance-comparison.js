#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Playwright FlakerFinder Performance Comparison');
console.log('================================================\n');

// Function to run tests and capture timing
function runTests(mode, description) {
  console.log(`📊 Running ${description}...`);
  const startTime = Date.now();
  
  try {
    const result = execSync(`npm run test:${mode}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
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
    testResults: { passed: 0, failed: 0 }
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
  
  // Run Local Headless (baseline)
  console.log('1️⃣  LOCAL HEADLESS MODE (Baseline)');
  console.log('-----------------------------------');
  const localResult = runTests('local-headless', 'Local Headless Tests');
  results.local = {
    ...localResult,
    metrics: extractMetrics(localResult.output),
    mode: 'local-headless',
    description: 'Local Headless (Full Performance)'
  };
  
  console.log('\n2️⃣  CI MODE (Throttled)');
  console.log('------------------------');
  const ciResult = runTests('ci', 'CI Mode Tests');
  results.ci = {
    ...ciResult,
    metrics: extractMetrics(ciResult.output),
    mode: 'ci',
    description: 'CI Mode (Throttled)'
  };
  
  // Generate comparison report
  console.log('\n📈 PERFORMANCE COMPARISON REPORT');
  console.log('==================================');
  
  console.log('\n| Mode | Duration | Load Times | Throttling | Pass Rate |');
  console.log('|------|----------|------------|------------|-----------|');
  
  Object.values(results).forEach(result => {
    const avgLoadTime = result.metrics.loadTimes.length > 0 
      ? (result.metrics.loadTimes.reduce((a, b) => a + b, 0) / result.metrics.loadTimes.length).toFixed(0)
      : 'N/A';
    
    const totalTests = result.metrics.testResults.passed + result.metrics.testResults.failed;
    const passRate = totalTests > 0 
      ? ((result.metrics.testResults.passed / totalTests) * 100).toFixed(1) + '%'
      : 'N/A';
    
    const throttlingStatus = result.metrics.throttlingApplied ? '✅ Yes' : '❌ No';
    
    console.log(`| ${result.description} | ${(result.duration / 1000).toFixed(1)}s | ${avgLoadTime}ms | ${throttlingStatus} | ${passRate} |`);
  });
  
  // Key insights
  console.log('\n🔍 KEY INSIGHTS');
  console.log('===============');
  
  if (results.local.metrics.loadTimes.length > 0 && results.ci.metrics.loadTimes.length > 0) {
    const localAvg = results.local.metrics.loadTimes.reduce((a, b) => a + b, 0) / results.local.metrics.loadTimes.length;
    const ciAvg = results.ci.metrics.loadTimes.reduce((a, b) => a + b, 0) / results.ci.metrics.loadTimes.length;
    const slowdown = (ciAvg / localAvg).toFixed(1);
    
    console.log(`• Performance Impact: CI mode is ${slowdown}x slower than local`);
  }
  
  console.log(`• Local Success Rate: ${results.local.metrics.testResults.passed}/${results.local.metrics.testResults.passed + results.local.metrics.testResults.failed} tests passed`);
  console.log(`• CI Success Rate: ${results.ci.metrics.testResults.passed}/${results.ci.metrics.testResults.passed + results.ci.metrics.testResults.failed} tests passed`);
  
  if (results.ci.metrics.throttlingApplied) {
    console.log('• Throttling: Successfully applied CPU and network throttling in CI mode');
  } else {
    console.log('• Throttling: ⚠️  Throttling may not have been applied correctly');
  }
  
  console.log('\n💡 CONCLUSION');
  console.log('==============');
  console.log('This demonstrates the classic "works on my machine" problem:');
  console.log('• Local development: Fast, mostly reliable');
  console.log('• CI environment: Slower, resource-constrained, prone to flakiness');
  console.log('• The throttling simulation helps identify timing-sensitive issues early');
  
  // Save results to file for CI
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);
}

main().catch(console.error);
