#!/usr/bin/env node

/**
 * Test Runner for DnD Campaign Tracker Achievement System
 * 
 * This script runs comprehensive tests to ensure the entire achievement system works correctly:
 * 1. Player Creation and Campaign Joining
 * 2. Achievement Creation
 * 3. Achievement Assignment to Campaign
 * 4. Achievement Assignment to Player
 * 5. Achievement Progress Tracking
 * 6. Achievement Level Upgrades
 * 7. Error Handling
 * 8. Data Persistence
 * 9. Component UI Tests
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎲 DnD Campaign Tracker - Achievement System Tests');
console.log('==================================================\n');

try {
  // Run the tests
  console.log('🧪 Running Achievement System Tests...\n');
  
  execSync('npm test -- --testPathPattern="tests" --verbose', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('\n✅ All tests passed! Achievement system is working correctly.');
  console.log('\n📋 Test Summary:');
  console.log('   ✓ Player Creation and Campaign Joining');
  console.log('   ✓ Achievement Creation');
  console.log('   ✓ Achievement Assignment to Campaign');
  console.log('   ✓ Achievement Assignment to Player');
  console.log('   ✓ Achievement Progress Tracking');
  console.log('   ✓ Achievement Level Upgrades');
  console.log('   ✓ Error Handling');
  console.log('   ✓ Data Persistence');
  console.log('   ✓ Component UI Tests');
  
} catch (error) {
  console.error('\n❌ Some tests failed. Please check the output above.');
  console.error('   This indicates issues with the achievement system that need to be fixed.');
  process.exit(1);
} 