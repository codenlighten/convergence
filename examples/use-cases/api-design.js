/**
 * API Design & Documentation
 * 
 * Use Case: Design a REST API with comprehensive documentation
 * 
 * Why Convergence matters:
 * - Poor API design locks in technical debt
 * - Missing endpoints discovered later are expensive to add
 * - Breaking changes cause downstream issues
 * - Peer review ensures usability
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Design a comprehensive REST API for a project management SaaS platform.
    
    Core features:
    - User authentication and authorization
    - Project creation and management
    - Task/issue tracking
    - Team collaboration and sharing
    - Comments and activity feeds
    - File attachments
    - Reporting and analytics
    
    Include: Endpoint design, request/response schemas, authentication methods, 
    error handling, rate limiting, pagination, filtering, versioning strategy.`,
    {
      agentA: "API Architect - Design elegant, consistent REST API with clear contracts",
      agentB: "API User & Security Reviewer - Identify usability issues, security gaps, edge cases",
      maxIterations: 6,
      temperature: 0.3
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('API DESIGN - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%\n`);
  console.log(result.finalResponse.response);
}

main().catch(console.error);
