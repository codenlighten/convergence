/**
 * Microservices Architecture Design
 * 
 * Use Case: Design scalable microservices architecture
 * 
 * Why Convergence matters:
 * - Architectural decisions are expensive to change
 * - Missing service boundaries cause problems later
 * - Communication patterns must be well-thought-out
 * - Edge cases in distributed systems are complex
 */

import { convergeOnArchitecture } from '../../index.js';

async function main() {
  const result = await convergeOnArchitecture(
    `Design a scalable microservices architecture for an e-commerce platform handling:
    - User management and authentication
    - Product catalog and search
    - Shopping cart and orders
    - Payment processing
    - Inventory management
    - Shipping and logistics
    - Reviews and recommendations
    - Analytics and reporting
    
    Consider: Service boundaries, communication patterns (sync/async), 
    data consistency, failure scenarios, scalability, deployment strategy.`,
    {
      maxIterations: 8
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('MICROSERVICES ARCHITECTURE - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}\n`);
  console.log(result.finalResponse.response);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log('\n⚠️  Architecture considerations:');
    result.finalResponse.missingContext.forEach(item => {
      console.log(`  - ${item}`);
    });
  }
}

main().catch(console.error);
