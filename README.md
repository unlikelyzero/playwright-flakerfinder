# Playwright FlakerFinder

A demonstration project showcasing techniques for finding and addressing test flakiness in Playwright tests. This project targets crowdstrike.com and includes configurations to simulate underpowered CI environments.

## Overview

This project demonstrates how test flakiness can be identified and addressed through 4 distinct modes of operation:

1. **Local Headed**: Development with visible browser
2. **Local Headless**: Fast local testing without UI
3. **Local Flake**: Simulate CI conditions locally
4. **CI Mode**: Production CI environment testing

The key comparison is between **Local Headless** (fast, reliable) and **CI Mode** (throttled, potentially flaky) to demonstrate how underpowered CI environments can cause test failures.

## Features

- Two browser configurations: `chrome` and `chrome-for-flake`
- CPU throttling (2x slower) and network throttling (3 Mbps down, 1.5 Mbps up) for `chrome-for-flake`
- Tests targeting crowdstrike.com to demonstrate real-world scenarios
- Examples of timing-sensitive operations that may fail in throttled environments

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd playwright-flakerfinder
```

2. Install Node.js LTS (using nvm recommended):
```bash
# Install nvm if you haven't already
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js LTS 22
nvm install 22
nvm use 22

# Verify Node.js version
node --version  # Should show v22.x.x
```

3. Install dependencies:
```bash
npm install
```

4. Install Playwright browsers:
```bash
npm run install
```

## Running Tests

### 3 Modes of Operation

#### 1. Local Headed Mode
```bash
npm run test:local-headed
```
- **Purpose**: Development and debugging
- **Browser**: Standard Chrome (headed)
- **Performance**: Full desktop performance
- **Use Case**: See what's happening during test execution

#### 2. Local Headless Mode
```bash
npm run test:local-headless
```
- **Purpose**: Local testing without UI
- **Browser**: Standard Chrome (headless)
- **Performance**: Full desktop performance
- **Use Case**: Fast local testing, pre-commit checks

#### 3. Local Flake Mode
```bash
npm run test:local-flake
```
- **Purpose**: Simulate CI conditions locally
- **Browser**: Chrome with throttling (headless)
- **Performance**: Throttled (4x CPU, slow network)
- **Use Case**: Reproduce CI flakiness locally

#### 4. CI Mode
```bash
npm run test:ci
```
- **Purpose**: CI/CD pipeline testing
- **Browser**: Chrome with throttling (headless)
- **Performance**: Throttled (4x CPU, slow network)
- **Use Case**: Production CI environment

### Additional Commands

#### Run with UI mode
```bash
npm run test:ui
```

#### Debug mode
```bash
npm run test:debug
```

#### Run all tests
```bash
npm test
```

#### Performance Comparison
```bash
npm run test:compare
```
Runs both local and CI modes and generates a detailed performance comparison report.

## GitHub Actions CI/CD

This project includes a GitHub Actions workflow that automatically runs performance comparisons on every push and pull request.

### Workflow Features

- **Performance Comparison**: Runs both local headless and CI mode tests
- **Detailed Reporting**: Generates comprehensive performance metrics
- **Artifact Upload**: Saves test results and reports for download
- **Summary Generation**: Creates GitHub step summaries with key insights

### CI Results

The workflow will show:
- **Local Headless**: Baseline performance with full desktop resources
- **CI Mode**: Throttled performance simulating underpowered CI environments
- **Performance Metrics**: Load times, pass rates, and throttling status
- **Key Insights**: Comparison between local and CI performance

### Viewing Results

1. Go to the **Actions** tab in your GitHub repository
2. Click on any workflow run
3. View the **Performance Comparison Report** in the job summary
4. Download artifacts for detailed test results

## Development with nvm

This project uses Node.js LTS version 22. The `.nvmrc` file specifies the exact version for consistency across environments.

### Using nvm locally:
```bash
# Use the project's Node.js version
nvm use

# Or install and use Node.js 22
nvm install 22
nvm use 22
```

### Benefits of nvm:
- **Version Consistency**: Ensures all developers use the same Node.js version
- **Easy Switching**: Switch between Node.js versions for different projects
- **CI/CD Alignment**: GitHub Actions uses the same version as specified in `.nvmrc`

## Browser Configurations

### Standard Chrome (`chrome`)
- Normal browser performance
- Standard timeouts
- No throttling applied

### Chrome-for-Flake (`chrome-for-flake`)
- **CPU Throttling**: 4x slower CPU performance
- **Network Throttling**: 1.5 Mbps download, 0.75 Mbps upload, 150ms latency
- **Cellular 3G Simulation**: Realistic mobile network conditions
- **Transparent Throttling**: Applied automatically via TypeScript fixtures

## Test Scenarios

The test suite includes scenarios designed to demonstrate flakiness:

1. **Basic Page Load**: Compares load times between standard and throttled browsers
2. **Timing-Sensitive Interactions**: Tests that may fail due to timing issues in slow environments
3. **Network Condition Handling**: Tests resilience to poor network conditions

## Understanding Flakiness

### Common Causes of Test Flakiness

1. **Timing Issues**: Elements not ready when tests try to interact
2. **Network Conditions**: Slow or unstable connections in CI
3. **Resource Constraints**: Limited CPU/memory in CI environments
4. **Race Conditions**: Asynchronous operations completing in unpredictable order

### How This Project Helps

- **Performance Comparison**: See the difference between local and CI-like performance
- **Timing Analysis**: Identify operations that are sensitive to timing
- **Network Impact**: Understand how network conditions affect test reliability
- **Resource Constraints**: Experience how limited resources affect test execution

## Best Practices Demonstrated

1. **Extended Timeouts**: Using longer timeouts for throttled environments
2. **Conditional Throttling**: Applying throttling only to specific browser configurations
3. **Graceful Degradation**: Handling cases where elements might not be ready
4. **Performance Monitoring**: Logging load times to identify performance differences

## CI/CD Considerations

When running in CI environments:
- Use the `chrome-for-flake` configuration to simulate CI conditions
- Increase timeouts for network and CPU operations
- Consider retry strategies for flaky tests
- Monitor test performance and adjust timeouts accordingly

## Contributing

This project serves as a learning tool for understanding test flakiness. Feel free to:
- Add more test scenarios
- Experiment with different throttling levels
- Test with different websites
- Share your findings and solutions
