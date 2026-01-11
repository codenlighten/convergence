/**
 * Healthcare Database Schema Design
 * 
 * Industry: Healthcare / Medical Systems
 * Use Case: Design a patient database schema for an EHR (Electronic Health Record)
 * 
 * Why Convergence matters:
 * - Missing fields could impact patient safety
 * - Regulatory compliance (HIPAA) requires completeness
 * - Database structure is expensive to change
 * - Security implications are critical
 * 
 * Agent A: Database Architect
 * Agent B: Compliance & Security Expert
 */

import { converge } from '../../index.js';

async function main() {
  const result = await converge(
    `Design a comprehensive patient database schema for an Electronic Health Record (EHR) system.
    
    Include: patient demographics, medical history, medications, allergies, lab results, 
    clinical notes, appointments, billing information, insurance, consent records.
    
    Consider: HIPAA compliance, data privacy, audit trails, data integrity constraints.`,
    {
      agentA: "Healthcare Database Architect - Design a robust, normalized schema for EHR",
      agentB: "Compliance & Security Expert - Find gaps in data privacy, HIPAA requirements, security",
      maxIterations: 8,
      temperature: 0.3
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('HEALTHCARE DATABASE DESIGN - CONVERGENCE RESULT');
  console.log('='.repeat(80));
  console.log(`Converged: ${result.converged}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Confidence Score: ${result.convergenceScore}%`);
  console.log(`Estimated Cost: $${result.estimatedCost}`);
  console.log(`Tokens Used: ${result.tokens.total}`);
  
  console.log('\n📋 FINAL DESIGN:\n');
  console.log(result.finalResponse.response);
  
  if (result.finalResponse.missingContext.length > 0) {
    console.log('\n⚠️  Remaining gaps (if any):');
    result.finalResponse.missingContext.forEach(gap => {
      console.log(`  - ${gap}`);
    });
  } else {
    console.log('\n✅ No gaps identified - design is complete!');
  }
}

main().catch(console.error);
