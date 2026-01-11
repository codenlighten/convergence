/**
 * Financial Payment System Design
 * 
 * Industry: Finance / FinTech
 * Use Case: Design a secure payment processing system architecture
 * 
 * Why Convergence matters:
 * - Security flaws = massive fraud losses
 * - PCI-DSS compliance is mandatory
 * - Transaction integrity is non-negotiable
 * - Financial regulations are complex
 * 
 * Agent A: Payment System Architect
 * Agent B: Security & Fraud Prevention Expert
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Design a secure payment processing system for a fintech platform.
    
    Requirements:
    - Process credit/debit card transactions
    - Support multiple payment methods (cards, wallets, bank transfers)
    - Real-time fraud detection
    - PCI-DSS compliance
    - Settlement and reconciliation
    - Dispute handling
    - Audit logging
    
    Consider: Security threats, data encryption, rate limiting, idempotency, 
    failure recovery, regulatory requirements, monitoring and alerting.`,
    {
      agentA: "Payment System Architect - Design scalable, reliable payment processing",
      agentB: "Security & Fraud Expert - Identify vulnerabilities, compliance gaps, attack vectors",
      maxIterations: 8,
      temperature: 0.2
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('PAYMENT SYSTEM DESIGN - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}`);
  console.log(`Tokens Used: ${result.tokens.total}`);
  
  console.log('\n💰 FINAL SYSTEM DESIGN:\n');
  console.log(result.finalResponse.response);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log('\n⚠️  Security considerations remaining:');
    result.finalResponse.missingContext.forEach(gap => {
      console.log(`  - ${gap}`);
    });
  } else {
    console.log('\n✅ Design thoroughly vetted - ready for implementation!');
  }
}

main().catch(console.error);
