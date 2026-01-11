/**
 * Legal Compliance Documentation
 * 
 * Industry: Legal / Compliance
 * Use Case: Generate comprehensive data privacy policy for GDPR compliance
 * 
 * Why Convergence matters:
 * - Missing compliance requirements = legal liability
 * - Regulatory requirements are complex and interconnected
 * - Non-compliance results in heavy fines
 * - Requires thorough coverage of all scenarios
 * 
 * Agent A: Legal/Compliance Expert
 * Agent B: Data Privacy Auditor
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Draft a comprehensive GDPR-compliant data privacy policy for a web-based SaaS platform.
    
    The company:
    - Collects user personal data (name, email, payment info)
    - Operates in Europe (requires GDPR compliance)
    - Uses third-party service providers (email, analytics, payments)
    - Stores data in cloud servers
    - Processes customer support inquiries
    - Uses AI/ML for recommendations
    
    Must address: Data collection, processing, storage, sharing, user rights, 
    data retention, breach notification, international transfers, and compliance mechanisms.`,
    {
      agentA: "Legal & Compliance Expert - Draft comprehensive privacy policy",
      agentB: "Data Privacy Auditor - Identify gaps in GDPR, CCPA, and regulatory compliance",
      maxIterations: 8,
      temperature: 0.3
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('LEGAL COMPLIANCE - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}`);
  console.log(`Tokens Used: ${result.tokens.total}`);
  
  console.log('\n⚖️  PRIVACY POLICY:\n');
  console.log(result.finalResponse.response);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log('\n⚠️  Compliance items requiring attention:');
    result.finalResponse.missingContext.forEach(gap => {
      console.log(`  - ${gap}`);
    });
  } else {
    console.log('\n✅ Policy is comprehensive and compliant - ready for legal review!');
  }
}

main().catch(console.error);
