/**
 * Basic Convergence Example
 * 
 * Shows simple usage of the convergence engine
 */

import { converge } from '../index.js';

async function main() {
  console.log('Basic Convergence Example\n');
  
  // Simple query
  const result = await converge(
    "Explain how a binary search tree works, including insertion, deletion, and search operations",
    {
      maxIterations: 5,
      temperature: 0.3
    }
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('FINAL RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Score: ${result.convergenceScore}%`);
  console.log(`\nFinal Response:\n${result.finalResponse.response}`);
  
  // Show conversation history
  console.log('\n' + '='.repeat(80));
  console.log('CONVERSATION HISTORY');
  console.log('='.repeat(80));
  
  result.conversation.forEach(turn => {
    console.log(`\n[Agent ${turn.agent} - Iteration ${turn.iteration}]`);
    console.log(`Continue: ${turn.response.continue}`);
    console.log(`Missing: [${turn.response.missingContext.join(', ')}]`);
    console.log(`Confidence: ${turn.response.confidence}%`);
  });
}

main().catch(console.error);
