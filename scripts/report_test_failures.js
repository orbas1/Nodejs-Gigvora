#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const resultsPath = path.resolve(repoRoot, 'jest-results.json');

if (!fs.existsSync(resultsPath)) {
  console.error(`Could not find jest-results.json at ${resultsPath}. Run the Jest suite with --json and --outputFile first.`);
  process.exit(1);
}

const raw = fs.readFileSync(resultsPath, 'utf8');
let results;
try {
  results = JSON.parse(raw);
} catch (error) {
  console.error('Failed to parse jest-results.json:', error);
  process.exit(1);
}

const failures = [];

for (const suite of results.testResults || []) {
  const suitePath = path.relative(repoRoot, suite.name || '');
  const failedAssertions = (suite.assertionResults || []).filter((assertion) => assertion.status === 'failed');

  if (failedAssertions.length === 0) {
    if (suite.status === 'failed' && suite.message) {
      const firstLine = suite.message.split('\n').find((line) => line.trim().length > 0) || suite.message.trim();
      failures.push({
        suite: suitePath,
        test: '(suite failure)',
        message: firstLine.trim(),
      });
    }
    continue;
  }

  for (const assertion of failedAssertions) {
    const joinedTitle = assertion.titlePath ? assertion.titlePath.join(' › ') : assertion.fullName;
    let failureMessage = '';
    if (assertion.failureMessages && assertion.failureMessages.length > 0) {
      const messageLines = assertion.failureMessages[0]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      failureMessage = messageLines[0] || '(no failure message provided)';
    } else {
      failureMessage = '(no failure message provided)';
    }

    failures.push({
      suite: suitePath,
      test: joinedTitle,
      message: failureMessage,
    });
  }
}

if (failures.length === 0) {
  console.log('No failing tests detected in jest-results.json.');
  process.exit(0);
}

console.log(`Found ${failures.length} failing tests:`);
failures.forEach((failure, index) => {
  const number = index + 1;
  console.log(`${number}. [${failure.suite}] ${failure.test}`);
  console.log(`   → ${failure.message}`);
});
