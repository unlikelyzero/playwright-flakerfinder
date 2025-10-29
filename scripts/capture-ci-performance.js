#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Capturing CI performance metrics...');

// Run tests and capture output
try {
  const startTime = Date.now();
  const output = execSync('npm run test:local-headless', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const endTime = Date.now();
  const duration = endTime - startTime;

  // Extract metrics from output
  const loadTimeMatches = output.match(/(\w+)\s+load time:\s+(\d+)ms/g);
  const loadTimes = [];
  if (loadTimeMatches) {
    loadTimeMatches.forEach(match => {
      const timeMatch = match.match(/(\d+)ms/);
      if (timeMatch) {
        loadTimes.push(parseInt(timeMatch[1]));
      }
    });
  }

  const passedMatch = output.match(/(\d+)\s+passed/);
  const failedMatch = output.match(/(\d+)\s+failed/);

  const ciData = {
    success: true,
    duration: duration,
    metrics: {
      loadTimes: loadTimes,
      throttlingApplied: false,
      testResults: {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      },
    },
    output: output,
    timestamp: new Date().toISOString(),
    environment: 'GitHub Actions CI',
  };

  fs.writeFileSync('ci-performance-report.json', JSON.stringify(ciData, null, 2));
  console.log('SUCCESS: CI performance data saved');
} catch (error) {
  console.log('ERROR: Failed to capture CI data:', error.message);
  const ciData = {
    success: false,
    duration: 0,
    metrics: { loadTimes: [], throttlingApplied: false, testResults: { passed: 0, failed: 0 } },
    output: error.stdout || error.message,
    timestamp: new Date().toISOString(),
    environment: 'GitHub Actions CI',
  };
  fs.writeFileSync('ci-performance-report.json', JSON.stringify(ciData, null, 2));
}
