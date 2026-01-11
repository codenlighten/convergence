# Examples Organization Structure

## Overview

The `examples/` directory is now organized into **industry-specific** and **use-case-specific** folders, making it easy to find relevant examples for your problem domain.

## Directory Structure

```
examples/
├── list.js                          # Interactive examples explorer
├── README.md                        # Complete guide to all examples
├── industries/                      # Industry-specific examples
│   ├── healthcare-database.js       # EHR Database Design
│   ├── finance-payment-system.js    # Payment System Design
│   ├── cybersecurity-audit.js       # Threat Model & Audit
│   └── legal-compliance.js          # GDPR Policy Generation
├── use-cases/                       # Problem-type examples
│   ├── api-design.js                # REST API Design
│   ├── production-code.js           # Critical Code Generation
│   ├── microservices-architecture.js # Distributed Systems
│   └── technical-documentation.js   # Technical Docs
└── [legacy examples]                # Original examples maintained for reference
    ├── basic-convergence.js
    ├── code-generation.js
    ├── architecture.js
    └── language-design.js
```

## 🏥 Industry Examples (4 examples)

Each demonstrates Convergence solving a real business problem with high stakes.

| Industry | Example | File | Problem |
|----------|---------|------|---------|
| **Healthcare** | EHR Database | `healthcare-database.js` | Design patient database schema with compliance |
| **Finance** | Payment System | `finance-payment-system.js` | Design secure payment processing system |
| **Security** | Threat Model | `cybersecurity-audit.js` | Comprehensive security audit and threat modeling |
| **Legal** | Compliance Policy | `legal-compliance.js` | Generate GDPR-compliant privacy policy |

### Key Insight: Industry Examples
These show where Convergence provides **maximum value**: high-stakes domains where missing requirements = massive costs.

---

## 💼 Use Case Examples (4 examples)

Each demonstrates Convergence solving a specific technical problem type.

| Use Case | Example | File | Problem |
|----------|---------|------|---------|
| **API Design** | REST API | `api-design.js` | Design comprehensive REST API with docs |
| **Code Generation** | Production Code | `production-code.js` | Generate and review critical code |
| **Architecture** | Microservices | `microservices-architecture.js` | Design scalable distributed systems |
| **Documentation** | Technical Docs | `technical-documentation.js` | Create comprehensive technical documentation |

### Key Insight: Use Case Examples
These show how Convergence applies to **common technical problems** that every team faces.

---

## Quick Reference

### Run an Example

```bash
# Set your API key
export OPENAI_API_KEY='sk-...'

# Industry example
node examples/industries/healthcare-database.js

# Use case example
node examples/use-cases/api-design.js

# View examples list
node examples/list.js
```

### Read the Full Guide

```bash
cat examples/README.md
```

---

## What Each Example Shows

Every example includes:

1. **Problem Statement**: Clear description of what needs to be solved
2. **Agent Roles**: What perspective each agent brings
3. **Why Convergence Matters**: Why this problem benefits from dual-agent deliberation
4. **Output**: Formatted results showing convergence score, iterations, cost
5. **Comments**: Inline documentation of the approach

---

## Learning Path

1. **Start with**: `examples/list.js` - See all available examples
2. **Pick one**: Choose based on your domain or problem type
3. **Run it**: Execute with your OpenAI API key
4. **Study**: Read the code and understand the agent perspectives
5. **Adapt**: Modify the prompt for your specific problem

---

## Example Categories Explained

### Why Industries?
Industries have different compliance, security, and quality requirements. Healthcare examples show how Convergence handles regulatory complexity. Finance examples show security-critical design. This helps you understand industry-specific applications.

### Why Use Cases?
Different problem types benefit from different agent perspectives. API Design examples show architectural thinking. Code examples show quality assurance. This helps you see patterns you can apply to your own problems.

---

## Convergence Benefits by Category

### Industry Examples (High Regulatory Burden)
- **Healthcare**: Avoid patient safety gaps
- **Finance**: Prevent fraud/security breaches  
- **Security**: Find all attack vectors
- **Legal**: Ensure compliance coverage

### Use Case Examples (Technical Complexity)
- **API Design**: Ensure usability and consistency
- **Code**: Catch security/performance issues
- **Architecture**: Prevent costly redesigns
- **Documentation**: Ensure completeness

---

## Next Steps

1. **Explore**: Run examples matching your domain
2. **Understand**: Study how agents interact
3. **Adapt**: Create variations for your problems
4. **Measure**: Compare Convergence results to your normal approach
5. **Scale**: Integrate into your workflow

See [examples/README.md](README.md) for detailed documentation on each example.
