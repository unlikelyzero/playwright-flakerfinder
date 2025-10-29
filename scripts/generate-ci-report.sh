#!/bin/bash

# Generate CI Performance Report for GitHub Actions Step Summary

echo "## CI Performance Report" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "### Actual CI Environment Results" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY

if [ -f "ci-performance-report.json" ]; then
  echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
  echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
  
  CI_DURATION=$(node -p "Math.round(require('./ci-performance-report.json').duration/1000)")
  CI_PASSED=$(node -p "require('./ci-performance-report.json').metrics.testResults.passed")
  CI_FAILED=$(node -p "require('./ci-performance-report.json').metrics.testResults.failed")
  CI_LOAD=$(node -p "require('./ci-performance-report.json').metrics.loadTimes.length > 0 ? Math.round(require('./ci-performance-report.json').metrics.loadTimes.reduce((a,b)=>a+b,0)/require('./ci-performance-report.json').metrics.loadTimes.length) : 'N/A'")
  CI_TOTAL=$(node -p "const data = require('./ci-performance-report.json').metrics.testResults; data.passed + data.failed")
  CI_RATE=$(node -p "const data = require('./ci-performance-report.json').metrics.testResults; const total = data.passed + data.failed; total > 0 ? ((data.passed / total) * 100).toFixed(1) : 'N/A'")
  
  echo "| Duration | ${CI_DURATION}s |" >> $GITHUB_STEP_SUMMARY
  echo "| Load Time | ${CI_LOAD}ms |" >> $GITHUB_STEP_SUMMARY
  echo "| Pass Rate | ${CI_RATE}% |" >> $GITHUB_STEP_SUMMARY
  echo "| Tests Passed | ${CI_PASSED}/${CI_TOTAL} |" >> $GITHUB_STEP_SUMMARY
else
  echo "ERROR: CI performance data not available" >> $GITHUB_STEP_SUMMARY
fi

echo "" >> $GITHUB_STEP_SUMMARY
echo "This shows how tests perform in the actual GitHub Actions CI environment:" >> $GITHUB_STEP_SUMMARY
echo "- **Environment**: Playwright Docker container on GitHub Actions" >> $GITHUB_STEP_SUMMARY
echo "- **Resources**: Limited CPU and memory compared to local development" >> $GITHUB_STEP_SUMMARY
echo "- **Network**: Shared infrastructure with potential latency" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "### Local Simulation Available" >> $GITHUB_STEP_SUMMARY
echo "Run \`npm run test:compare\` locally to compare all 4 modes:" >> $GITHUB_STEP_SUMMARY
echo "- **Local Headed**: Full desktop performance + UI" >> $GITHUB_STEP_SUMMARY
echo "- **Local Headless**: Full desktop performance" >> $GITHUB_STEP_SUMMARY
echo "- **Local Flake**: Simulated CI with throttling" >> $GITHUB_STEP_SUMMARY
echo "- **CI Mode**: Actual CI data (archived from this run)" >> $GITHUB_STEP_SUMMARY
echo "" >> $GITHUB_STEP_SUMMARY
echo "### Environment Configuration" >> $GITHUB_STEP_SUMMARY
echo "- Node.js: LTS 22 (specified in .nvmrc)" >> $GITHUB_STEP_SUMMARY
echo "- Container: Playwright Docker (mcr.microsoft.com/playwright:v1.56.1-jammy)" >> $GITHUB_STEP_SUMMARY
echo "- Browsers: Pre-installed in Docker image" >> $GITHUB_STEP_SUMMARY

