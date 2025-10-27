#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running comprehensive test suite...\n');

try {
  // Run unit tests with coverage
  console.log('📊 Running unit tests with coverage...');
  execSync('npm run test:cov', { stdio: 'inherit' });

  // Check if coverage meets requirements
  const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
  
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    console.log('\n📈 Coverage Summary:');
    console.log(`Lines: ${total.lines.pct}%`);
    console.log(`Functions: ${total.functions.pct}%`);
    console.log(`Branches: ${total.branches.pct}%`);
    console.log(`Statements: ${total.statements.pct}%`);
    
    const threshold = 80;
    const meetsThreshold = 
      total.lines.pct >= threshold &&
      total.functions.pct >= threshold &&
      total.branches.pct >= threshold &&
      total.statements.pct >= threshold;
    
    if (meetsThreshold) {
      console.log('\n✅ Coverage threshold met! All metrics above 80%');
    } else {
      console.log('\n❌ Coverage threshold not met. Some metrics below 80%');
      process.exit(1);
    }
  }

  // Run e2e tests
  console.log('\n🔄 Running integration tests...');
  execSync('npm run test:e2e', { stdio: 'inherit' });

  console.log('\n🎉 All tests passed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('✅ Unit tests: PASSED');
  console.log('✅ Integration tests: PASSED');
  console.log('✅ Coverage threshold: MET');

} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
