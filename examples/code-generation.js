/**
 * Code Generation Example
 * 
 * Shows convergeOnCode for production-ready code
 */

import { convergeOnCode } from '../index.js';

async function main() {
  console.log('Code Generation with Convergence\n');
  
  const result = await convergeOnCode(
    "Write a Python function to implement quicksort with proper documentation, error handling, and type hints. Include unit tests.",
    {
      maxIterations: 6,
      onIteration: (state) => {
        const score = Math.max(
          60 * (!state.agentA.continue ? 1 : 0) + 40 * (state.agentA.missingContext.length === 0 ? 1 : 0),
          60 * (!state.agentB.continue ? 1 : 0) + 40 * (state.agentB.missingContext.length === 0 ? 1 : 0)
        );
        console.log(`📊 Iteration ${state.iteration}: Score ${score}%`);
      }
    }
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('GENERATED CODE');
  console.log('='.repeat(80));
  
  if (result.converged) {
    console.log('✅ Code review passed - production ready!\n');
  } else {
    console.log('⚠️  Code may need additional review\n');
  }
  
  console.log(result.finalResponse.response);
  
  console.log('\n' + '='.repeat(80));
  console.log('CODE REVIEW SUMMARY');
  console.log('='.repeat(80));
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Convergence: ${result.convergenceScore}%`);
  console.log(`Confidence: ${result.finalResponse.confidence}%`);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log(`\nRemaining issues:`);
    result.finalResponse.missingContext.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  } else {
    console.log('\n✅ No issues found - code is complete!');
  }
}

main().catch(console.error);
