/**
 * Language Design Example
 * 
 * Shows how convergence was used to design the ForthBox language
 */

import { converge } from '../index.js';

async function main() {
  console.log('Programming Language Design with Convergence\n');
  
  const result = await converge(
    "Design a programming language that merges the best of Forth (stack-based) with Alan Kay's Smalltalk methods (black box message passing). It should be elegant, minimal, and suitable for systems programming.",
    {
      agentA: "Language Designer - Create elegant, minimal syntax with powerful abstractions",
      agentB: "Language Critic - Find edge cases, challenge design decisions, ensure implementability",
      maxIterations: 10,
      temperature: 0.3,
      onIteration: (state) => {
        console.log(`\n📊 Iteration ${state.iteration} Status:`);
        console.log(`   Agent A Continue: ${state.agentA.continue}`);
        console.log(`   Agent B Continue: ${state.agentB.continue}`);
        console.log(`   Agent A Missing: ${state.agentA.missingContext.length} items`);
        console.log(`   Agent B Missing: ${state.agentB.missingContext.length} items`);
      }
    }
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('LANGUAGE DESIGN RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged ? '✅ YES' : '❌ NO'}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Score: ${result.convergenceScore}%`);
  
  console.log(`\n📋 Design:\n`);
  console.log(result.finalResponse.response);
  
  // Extract key decisions
  console.log('\n' + '='.repeat(80));
  console.log('CONVERGENCE ANALYSIS');
  console.log('='.repeat(80));
  
  console.log(`\nTotal conversation turns: ${result.conversation.length}`);
  console.log(`Final confidence: ${result.finalResponse.confidence}%`);
  
  if (result.converged) {
    console.log('\n🎉 SINGULARITY ACHIEVED!');
    console.log('The design is complete, implementable, and optimal.');
  } else {
    console.log('\n⚠️  Partial convergence - may need refinement');
  }
}

main().catch(console.error);
