/**
 * Cybersecurity Audit & Threat Model
 * 
 * Industry: Cybersecurity / Information Security
 * Use Case: Comprehensive security audit and threat modeling
 * 
 * Why Convergence matters:
 * - Incomplete threat models leave vulnerabilities undetected
 * - Adversarial thinking finds edge cases manual review misses
 * - High-stakes: breaches cause data loss and regulatory fines
 * - Industry standard: Security reviews require multiple perspectives
 * 
 * Agent A: Security Architect
 * Agent B: Penetration Tester / Red Team
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Conduct a comprehensive security audit and threat model for a SaaS web application.
    
    The application:
    - Handles user authentication and authorization
    - Stores sensitive customer data in a database
    - Communicates with third-party APIs
    - Uses cloud infrastructure (AWS)
    - Has a REST API and web dashboard
    - Processes payments
    
    Identify: All potential threat vectors, vulnerabilities, attack paths, 
    mitigation strategies, and detection mechanisms.`,
    {
      agentA: "Security Architect - Create comprehensive threat model and security architecture",
      agentB: "Red Team / Penetration Tester - Find attack vectors, bypasses, edge cases",
      maxIterations: 8,
      temperature: 0.4
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('CYBERSECURITY AUDIT - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}`);
  console.log(`Tokens Used: ${result.tokens.total}`);
  
  console.log('\n🔒 THREAT MODEL & AUDIT:\n');
  console.log(result.finalResponse.response);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log('\n⚠️  Additional threat vectors to investigate:');
    result.finalResponse.missingContext.forEach(gap => {
      console.log(`  - ${gap}`);
    });
  } else {
    console.log('\n✅ Threat model is comprehensive - all major attack vectors covered!');
  }
}

main().catch(console.error);
