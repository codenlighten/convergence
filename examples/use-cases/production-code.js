/**
 * Production Code Review
 * 
 * Use Case: Generate and review critical production code
 * 
 * Why Convergence matters:
 * - Code review catches bugs, security issues, and performance problems
 * - Built-in peer review at generation time
 * - Critical systems benefit from adversarial code review
 */

import { convergeOnCode } from '../../index.js';

async function main() {
  const result = await convergeOnCode(
    `Write a production-ready authentication middleware for Express.js that:
    - Validates JWT tokens
    - Handles token refresh
    - Manages role-based access control (RBAC)
    - Logs security events
    - Handles token expiration and revocation
    - Protects against timing attacks
    
    Include proper error handling, security best practices, and comprehensive comments.`,
    {
      maxIterations: 6,
      temperature: 0.2
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTION CODE - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}\n`);
  console.log(result.finalResponse.response);
}

main().catch(console.error);
