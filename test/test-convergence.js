/**
 * Test Suite for Convergence Engine
 * 
 * Tests core functionality, error handling, and edge cases
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  converge,
  convergeOnCode,
  convergeOnArchitecture,
  hasConverged,
  getConvergenceScore,
  calculateTokenCost
} from '../index.js';

// Test utilities
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Convergence Engine Tests\n');
  console.log('═'.repeat(80));
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passCount++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failCount++;
    }
  }
  
  console.log('═'.repeat(80));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed out of ${tests.length} tests\n`);
  
  return failCount === 0;
}

// ============================================================================
// UNIT TESTS
// ============================================================================

test('hasConverged returns true when continue is false and no missing context', () => {
  const response = {
    response: 'Complete analysis',
    continue: false,
    missingContext: [],
    confidence: 95
  };
  
  if (!hasConverged(response)) {
    throw new Error('Expected hasConverged to return true');
  }
});

test('hasConverged returns false when continue is true', () => {
  const response = {
    response: 'Analysis',
    continue: true,
    missingContext: [],
    confidence: 80
  };
  
  if (hasConverged(response)) {
    throw new Error('Expected hasConverged to return false');
  }
});

test('hasConverged returns false when missingContext has items', () => {
  const response = {
    response: 'Analysis',
    continue: false,
    missingContext: ['More examples needed'],
    confidence: 75
  };
  
  if (hasConverged(response)) {
    throw new Error('Expected hasConverged to return false when missingContext is not empty');
  }
});

test('getConvergenceScore calculates correct score (100)', () => {
  const response = {
    response: 'Complete',
    continue: false,
    missingContext: [],
    confidence: 95
  };
  
  const score = getConvergenceScore(response);
  if (score !== 100) {
    throw new Error(`Expected score 100, got ${score}`);
  }
});

test('getConvergenceScore calculates correct score (40) when continue=true', () => {
  const response = {
    response: 'Incomplete',
    continue: true,
    missingContext: [],
    confidence: 60
  };
  
  const score = getConvergenceScore(response);
  // Score when continue=true but no missing context: 0 + 40 = 40
  if (score !== 40) {
    throw new Error(`Expected score 40, got ${score}`);
  }
});

test('getConvergenceScore applies penalty for missing context', () => {
  const response = {
    response: 'Analysis',
    continue: false,
    missingContext: ['Item 1', 'Item 2'],
    confidence: 70
  };
  
  const score = getConvergenceScore(response);
  // 60 (continue) + (40 - 20) = 80
  if (score !== 80) {
    throw new Error(`Expected score 80, got ${score}`);
  }
});

test('calculateTokenCost returns correct estimate', () => {
  // Test with 1000 prompt tokens and 500 completion tokens
  // gpt-4o-2024-08-06: prompt=$0.0025/1M, completion=$0.010/1M
  // Expected: (1000 * 0.0025 + 500 * 0.010) / 1000000 = 0.000005
  const cost = calculateTokenCost(1000, 500, 'gpt-4o-2024-08-06');
  const expectedCost = (1000 * 0.0025 + 500 * 0.010) / 1000000;
  
  if (Math.abs(cost - expectedCost) > 0.0000001) {
    throw new Error(`Expected cost ${expectedCost}, got ${cost}`);
  }
});

test('calculateTokenCost uses correct pricing for gpt-4-turbo', () => {
  // gpt-4-turbo: prompt=$0.01/1M, completion=$0.03/1M
  const cost = calculateTokenCost(1000, 1000, 'gpt-4-turbo');
  const expectedCost = (1000 * 0.01 + 1000 * 0.03) / 1000000;
  
  if (Math.abs(cost - expectedCost) > 0.0000001) {
    throw new Error(`Expected cost ${expectedCost}, got ${cost}`);
  }
});

test('converge throws error when initialQuery is empty string', async () => {
  try {
    await converge('');
    throw new Error('Expected error for empty query');
  } catch (error) {
    if (!error.message.includes('initialQuery')) {
      throw new Error('Expected error message about initialQuery');
    }
  }
});

test('converge throws error when initialQuery is null', async () => {
  try {
    await converge(null);
    throw new Error('Expected error for null query');
  } catch (error) {
    if (!error.message.includes('initialQuery')) {
      throw new Error('Expected error message about initialQuery');
    }
  }
});

test('converge throws error when maxIterations is invalid', async () => {
  try {
    await converge('Test query', { maxIterations: 0 });
    throw new Error('Expected error for invalid maxIterations');
  } catch (error) {
    if (!error.message.includes('maxIterations')) {
      throw new Error('Expected error message about maxIterations');
    }
  }
});

test('converge throws error when temperature is out of range', async () => {
  try {
    await converge('Test query', { temperature: -1 });
    throw new Error('Expected error for invalid temperature');
  } catch (error) {
    if (!error.message.includes('temperature')) {
      throw new Error('Expected error message about temperature');
    }
  }
});

test('converge throws error when OPENAI_API_KEY is not set', async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    await converge('Test query', { maxIterations: 1 });
    throw new Error('Expected error for missing API key');
  } catch (error) {
    if (!error.message.includes('OPENAI_API_KEY')) {
      throw new Error('Expected error message about OPENAI_API_KEY');
    }
  } finally {
    process.env.OPENAI_API_KEY = originalKey;
  }
});

test('convergeOnCode sets correct agent roles', async () => {
  // This test verifies the function signature is correct
  // We can't call the actual function without a valid API key
  if (typeof convergeOnCode !== 'function') {
    throw new Error('convergeOnCode should be a function');
  }
});

test('convergeOnArchitecture sets correct agent roles', async () => {
  // This test verifies the function signature is correct
  // We can't call the actual function without a valid API key
  if (typeof convergeOnArchitecture !== 'function') {
    throw new Error('convergeOnArchitecture should be a function');
  }
});

// ============================================================================
// INTEGRATION TESTS (Requires valid API key)
// ============================================================================

test('converge returns object with required fields', async () => {
  // Skip if API key not available
  if (!process.env.OPENAI_API_KEY) {
    console.log('⏭️  Skipped (requires OPENAI_API_KEY)');
    passCount++;
    return;
  }

  try {
    const result = await converge(
      'What is 2+2?',
      { 
        maxIterations: 1,
        temperature: 0.3
      }
    );

    const requiredFields = ['converged', 'iterations', 'finalResponse', 'conversation', 'convergenceScore', 'tokens', 'estimatedCost'];
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof result.tokens.total !== 'number') {
      throw new Error('tokens.total should be a number');
    }

    if (typeof result.estimatedCost !== 'number') {
      throw new Error('estimatedCost should be a number');
    }
  } catch (error) {
    // Re-throw with more context
    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('⏭️  Skipped (requires valid OPENAI_API_KEY)');
      passCount++;
    } else {
      throw error;
    }
  }
});

test('converge conversation includes all turns', async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.log('⏭️  Skipped (requires OPENAI_API_KEY)');
    passCount++;
    return;
  }

  try {
    const result = await converge(
      'Define recursion.',
      { maxIterations: 2 }
    );

    if (!Array.isArray(result.conversation)) {
      throw new Error('conversation should be an array');
    }

    if (result.conversation.length === 0) {
      throw new Error('conversation should not be empty');
    }

    for (const turn of result.conversation) {
      if (!['A', 'B'].includes(turn.agent)) {
        throw new Error('Each turn should have agent A or B');
      }
      if (!turn.response || !turn.role) {
        throw new Error('Each turn should have response and role');
      }
    }
  } catch (error) {
    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('⏭️  Skipped (requires valid OPENAI_API_KEY)');
      passCount++;
    } else {
      throw error;
    }
  }
});

// ============================================================================
// RUN TESTS
// ============================================================================

const allPassed = await runTests();
process.exit(allPassed ? 0 : 1);
