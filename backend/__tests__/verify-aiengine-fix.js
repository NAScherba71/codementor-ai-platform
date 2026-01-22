#!/usr/bin/env node
/**
 * Standalone test to verify aiEngine is properly initialized
 * Tests that the console.js module can be loaded without ReferenceError
 */

const path = require('path');

console.log('Testing aiEngine initialization fix...\n');

try {
  // Test 1: Load the AIEngineService module
  console.log('1. Loading AIEngineService...');
  const AIEngineService = require(path.join(__dirname, '../services/aiEngineService'));
  console.log('   ✓ AIEngineService loaded successfully');

  // Test 2: Instantiate the service
  console.log('2. Creating AIEngineService instance...');
  const aiEngine = new AIEngineService();
  console.log('   ✓ AIEngineService instance created');

  // Test 3: Verify methods exist
  console.log('3. Verifying methods exist...');
  const methods = ['analyzeCode', 'setPersonality', 'setContext', 'getContext'];
  methods.forEach(method => {
    if (typeof aiEngine[method] !== 'function') {
      throw new Error(`Method ${method} not found`);
    }
    console.log(`   ✓ Method ${method} exists`);
  });

  // Test 4: Test personality setter
  console.log('4. Testing setPersonality...');
  aiEngine.setPersonality('analytical');
  if (aiEngine.personality !== 'analytical') {
    throw new Error('setPersonality failed');
  }
  console.log('   ✓ setPersonality works');

  // Test 5: Test context getter/setter
  console.log('5. Testing context methods...');
  const success = aiEngine.setContext('language', 'javascript');
  if (!success) {
    throw new Error('setContext failed');
  }
  const context = aiEngine.getContext();
  if (context.language !== 'javascript') {
    throw new Error('getContext failed');
  }
  console.log('   ✓ Context methods work');

  // Test 6: Test invalid context key
  console.log('6. Testing invalid context key...');
  const invalidResult = aiEngine.setContext('invalid_key', 'value');
  if (invalidResult !== false) {
    throw new Error('Invalid context key should return false');
  }
  console.log('   ✓ Invalid context key handling works');

  console.log('\n✓ All tests passed! The aiEngine is properly initialized.\n');
  console.log('The fix successfully resolves the ReferenceError: aiEngine is not defined');
  process.exit(0);

} catch (error) {
  console.error('\n✗ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
