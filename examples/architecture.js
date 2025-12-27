/**
 * Architecture Design Example
 * 
 * Shows convergeOnArchitecture for system design
 */

import { convergeOnArchitecture } from '../index.js';

async function main() {
  console.log('System Architecture Design with Convergence\n');
  
  const result = await convergeOnArchitecture(
    "Design a distributed caching system that can handle 100K requests/second with sub-10ms latency. Include considerations for consistency, availability, partition tolerance, and failure recovery.",
    {
      maxIterations: 8,
      temperature: 0.4  // Slightly higher for creative design
    }
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('ARCHITECTURE DESIGN');
  console.log('='.repeat(80));
  console.log(`Status: ${result.converged ? '✅ Complete' : '🚧 In Progress'}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Convergence Score: ${result.convergenceScore}%`);
  console.log(`Design Confidence: ${result.finalResponse.confidence}%`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('DESIGN DOCUMENT');
  console.log('-'.repeat(80) + '\n');
  console.log(result.finalResponse.response);
  
  // Show evolution of design
  console.log('\n' + '='.repeat(80));
  console.log('DESIGN EVOLUTION');
  console.log('='.repeat(80));
  
  result.conversation.forEach(turn => {
    console.log(`\n[${turn.agent === 'A' ? '🏗️  Architect' : '🔍 Critic'}  - Iteration ${turn.iteration}]`);
    
    if (turn.response.missingContext.length > 0) {
      console.log('Issues identified:');
      turn.response.missingContext.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    } else {
      console.log('  ✅ No issues found');
    }
    
    console.log(`Continue needed: ${turn.response.continue ? 'Yes' : 'No'}`);
  });
  
  if (result.converged) {
    console.log('\n🎉 ARCHITECTURE VALIDATED!');
    console.log('Design is complete, scalable, and addresses all concerns.');
  }
}

main().catch(console.error);
