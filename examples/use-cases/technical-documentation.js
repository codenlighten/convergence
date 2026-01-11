/**
 * Technical Documentation
 * 
 * Use Case: Create comprehensive technical documentation
 * 
 * Why Convergence matters:
 * - Missing documentation sections = user confusion
 * - Edge cases in docs prevent support tickets
 * - Adversarial review ensures completeness
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Create comprehensive technical documentation for a Python web framework.
    
    Topics to cover:
    - Installation and setup
    - Quick start guide
    - Core concepts and architecture
    - Request/response handling
    - Routing and middleware
    - Database integration
    - Authentication and authorization
    - Error handling
    - Testing best practices
    - Deployment guide
    - Performance optimization
    - Common pitfalls and troubleshooting
    
    Write for intermediate developers. Include code examples and explanations.`,
    {
      agentA: "Technical Writer - Create clear, comprehensive documentation with examples",
      agentB: "Documentation Reviewer - Find missing topics, unclear sections, edge cases",
      maxIterations: 6,
      temperature: 0.3
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('TECHNICAL DOCUMENTATION - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%\n`);
  console.log(result.finalResponse.response);
}

main().catch(console.error);
