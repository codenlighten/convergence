#!/usr/bin/env node
/**
 * Convergence Engine - Examples Explorer
 * 
 * Interactive guide to running examples by industry or use case
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const examples = {
  industries: {
    'healthcare': {
      file: 'industries/healthcare-database.js',
      title: 'Healthcare Database Schema Design',
      description: 'Design a complete EHR database with compliance requirements',
      agents: 'Database Architect vs. Compliance Expert'
    },
    'finance': {
      file: 'industries/finance-payment-system.js',
      title: 'Financial Payment System Design',
      description: 'Design a secure payment processing system',
      agents: 'Payment Architect vs. Security & Fraud Expert'
    },
    'security': {
      file: 'industries/cybersecurity-audit.js',
      title: 'Cybersecurity Threat Model & Audit',
      description: 'Comprehensive security audit and threat modeling',
      agents: 'Security Architect vs. Penetration Tester'
    },
    'legal': {
      file: 'industries/legal-compliance.js',
      title: 'Legal Compliance Documentation',
      description: 'Generate GDPR-compliant privacy policy',
      agents: 'Legal Expert vs. Privacy Auditor'
    }
  },
  usecases: {
    'api': {
      file: 'use-cases/api-design.js',
      title: 'REST API Design',
      description: 'Design a comprehensive REST API with documentation',
      agents: 'API Architect vs. API Reviewer'
    },
    'code': {
      file: 'use-cases/production-code.js',
      title: 'Production Code Generation & Review',
      description: 'Generate and thoroughly review critical code',
      agents: 'Software Engineer vs. Code Reviewer'
    },
    'architecture': {
      file: 'use-cases/microservices-architecture.js',
      title: 'Microservices Architecture Design',
      description: 'Design scalable distributed systems',
      agents: 'Architect vs. Technical Critic'
    },
    'docs': {
      file: 'use-cases/technical-documentation.js',
      title: 'Technical Documentation',
      description: 'Create comprehensive technical documentation',
      agents: 'Technical Writer vs. Reviewer'
    }
  }
};

function printHeader() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           CONVERGENCE ENGINE - EXAMPLES EXPLORER               ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

function printSection(title, items) {
  console.log(`\n${title}`);
  console.log('═'.repeat(60));
  
  Object.entries(items).forEach(([key, example]) => {
    console.log(`\n  ${key.toUpperCase()}: ${example.title}`);
    console.log(`  └─ ${example.description}`);
    console.log(`     Agents: ${example.agents}`);
  });
}

function printUsage() {
  console.log(`
USAGE:

  Industry Examples:
    node examples/industries/healthcare-database.js
    node examples/industries/finance-payment-system.js
    node examples/industries/cybersecurity-audit.js
    node examples/industries/legal-compliance.js

  Use Case Examples:
    node examples/use-cases/api-design.js
    node examples/use-cases/production-code.js
    node examples/use-cases/microservices-architecture.js
    node examples/use-cases/technical-documentation.js

  View full guide:
    cat examples/README.md

REQUIREMENTS:
  - Set OPENAI_API_KEY environment variable
  - Node.js >= 18.0.0
  `);
}

function main() {
  printHeader();
  
  printSection('🏥 INDUSTRY EXAMPLES', examples.industries);
  printSection('💼 USE CASE EXAMPLES', examples.usecases);
  
  printUsage();
  
  console.log('\n📖 For detailed explanations, see examples/README.md\n');
}

main();
