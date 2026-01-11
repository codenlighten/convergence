# Convergence Engine Examples

Complete, industry-specific examples demonstrating the power of dual-agent deliberation.

## 📁 Structure

```
examples/
├── industries/          # Industry-specific use cases
│   ├── healthcare-database.js         - EHR database schema design
│   ├── finance-payment-system.js      - Payment processing system design
│   ├── cybersecurity-audit.js         - Security threat modeling
│   └── legal-compliance.js            - GDPR/Compliance policy generation
├── use-cases/           # Problem-type examples
│   ├── api-design.js                  - REST API design
│   ├── production-code.js             - Critical code generation & review
│   ├── microservices-architecture.js  - Distributed system design
│   └── technical-documentation.js     - Comprehensive documentation
├── original/            # Legacy examples
│   ├── basic-convergence.js
│   ├── code-generation.js
│   ├── architecture.js
│   └── language-design.js
└── README.md
```

## 🏥 Industry Examples

### Healthcare: `healthcare-database.js`
**Problem:** Design a complete EHR database schema
- **Agent A:** Database Architect
- **Agent B:** Compliance & Security Expert
- **Why Convergence Matters:** Missing fields could impact patient safety; HIPAA compliance is non-negotiable
- **Run:** `node examples/industries/healthcare-database.js`

### Finance: `finance-payment-system.js`
**Problem:** Design a secure payment processing system
- **Agent A:** Payment System Architect
- **Agent B:** Security & Fraud Prevention Expert
- **Why Convergence Matters:** Security flaws = fraud losses; PCI-DSS compliance required
- **Run:** `node examples/industries/finance-payment-system.js`

### Cybersecurity: `cybersecurity-audit.js`
**Problem:** Conduct security audit and threat modeling
- **Agent A:** Security Architect
- **Agent B:** Penetration Tester / Red Team
- **Why Convergence Matters:** Incomplete threat models miss vulnerabilities; breaches are expensive
- **Run:** `node examples/industries/cybersecurity-audit.js`

### Legal: `legal-compliance.js`
**Problem:** Generate GDPR-compliant privacy policy
- **Agent A:** Legal & Compliance Expert
- **Agent B:** Data Privacy Auditor
- **Why Convergence Matters:** Non-compliance = heavy fines; requirements are complex
- **Run:** `node examples/industries/legal-compliance.js`

---

## 💼 Use Case Examples

### API Design: `api-design.js`
**Problem:** Design a comprehensive REST API
- **Convergence Benefit:** Poor API design locks in debt; peer review ensures usability
- **Run:** `node examples/use-cases/api-design.js`

### Production Code: `production-code.js`
**Problem:** Generate and review critical code
- **Convergence Benefit:** Built-in peer review catches bugs, security issues, performance problems
- **Run:** `node examples/use-cases/production-code.js`

### Microservices Architecture: `microservices-architecture.js`
**Problem:** Design scalable microservices system
- **Convergence Benefit:** Architectural decisions are expensive to change; needs careful thought
- **Run:** `node examples/use-cases/microservices-architecture.js`

### Technical Documentation: `technical-documentation.js`
**Problem:** Create comprehensive technical docs
- **Convergence Benefit:** Missing sections = user confusion; adversarial review ensures completeness
- **Run:** `node examples/use-cases/technical-documentation.js`

---

## 🚀 Quick Start

### Run an Industry Example
```bash
# Set your OpenAI API key first
export OPENAI_API_KEY='your-key-here'

# Healthcare example
node examples/industries/healthcare-database.js

# Finance example
node examples/industries/finance-payment-system.js

# Cybersecurity example
node examples/industries/cybersecurity-audit.js
```

### Run a Use Case Example
```bash
# API design
node examples/use-cases/api-design.js

# Production code generation
node examples/use-cases/production-code.js

# Microservices architecture
node examples/use-cases/microservices-architecture.js
```

---

## 📊 What You'll See

Each example outputs:

```
═════════════════════════════════════════════════════════════
RESULT TYPE - CONVERGENCE RESULT
═════════════════════════════════════════════════════════════
Converged: true/false
Iterations: N
Confidence Score: X%
Estimated Cost: $Y

[Full deliberation result with both agents' perspectives]

✅ Design is thorough and complete!
```

---

## 🎯 Why These Patterns Work

| Characteristic | Benefit | Examples |
|---|---|---|
| **High Stakes** | Convergence ensures thoroughness | Healthcare, Finance, Security |
| **Complex Domains** | Multiple perspectives needed | Architecture, Compliance |
| **Peer Review Standard** | Mirrors industry practice | Code, Security, Legal |
| **Edge Cases Matter** | Adversarial thinking finds gaps | API Design, Database Schema |
| **Expensive to Change** | Better upfront design | Architecture, Documentation |

---

## 💡 Creating Your Own Example

1. **Identify the problem:** What needs thorough analysis?
2. **Design agents:** What perspectives are needed?
3. **Write the convergence call:**

```javascript
import { converge } from '../index.js';

const result = await converge(
  'Your detailed problem statement',
  {
    agentA: 'Agent A role and perspective',
    agentB: 'Agent B role and perspective',
    maxIterations: 8,
    temperature: 0.3
  }
);
```

4. **Analyze results:** Review convergence score and missing context

---

## 📈 Expected Results

| Problem Complexity | Avg Iterations | Convergence Rate |
|---|---|---|
| Simple (API design) | 2-3 | 95%+ |
| Moderate (Architecture) | 4-6 | 90%+ |
| Complex (Security audit) | 6-8 | 85%+ |

---

## 🔗 Related

- [Main README](../README.md) - Full API documentation
- [TECHNICAL.md](../TECHNICAL.md) - Architecture and scoring
- [QUICKSTART.md](../QUICKSTART.md) - Installation guide

---

## Questions?

Each example includes comments explaining:
- Why convergence matters for that problem
- What each agent brings to the table
- How to interpret the results

Study the examples, then adapt them to your use cases!
