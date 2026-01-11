/**
 * Convergence Client for Tenant Environments
 * Use this inside your tenant app to call parent convergence API
 */

export class ConvergenceClient {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.CONVERGENCE_API_URL || 'http://convergence-api:3000';
    this.orgId = options.orgId || process.env.CONVERGENCE_ORG_ID;
    this.envId = options.envId || process.env.CONVERGENCE_ENV_ID;
    this.apiKey = options.apiKey || process.env.CONVERGENCE_API_KEY;

    if (!this.apiKey && !this.orgId) {
      console.warn('⚠️  ConvergenceClient: No API key or org ID provided. Some features may not work.');
    }
  }

  async converge(prompt, options = {}) {
    const {
      agentARole = 'Expert Analyst - Provide comprehensive analysis',
      agentBRole = 'Critical Reviewer - Find gaps and improvements',
      maxIterations = 8,
      temperature = 0.3,
      async = false,
      webhookUrl = null
    } = options;

    const body = {
      prompt,
      agentARole,
      agentBRole,
      maxIterations,
      temperature
    };

    if (webhookUrl) {
      body.webhookUrl = webhookUrl;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.apiUrl}/api/v1/converge`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Convergence error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  async status(taskId) {
    const headers = {};
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.apiUrl}/api/v1/status/${taskId}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Status error: ${response.statusText}`);
    }

    return response.json();
  }

  async usage() {
    const headers = {};
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.apiUrl}/api/v1/usage`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Usage error: ${response.statusText}`);
    }

    return response.json();
  }

  async health() {
    const headers = {};
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${this.apiUrl}/health`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Convenience methods
  async design(topic, context = '') {
    return this.converge(
      `Design the following: ${topic}\n\nContext: ${context}`,
      {
        agentARole: 'Architecture Designer - Design with detail and clarity',
        agentBRole: 'Design Critic - Challenge design decisions and suggest improvements'
      }
    );
  }

  async review(code) {
    return this.converge(
      `Review this code for quality, security, and best practices:\n\n${code}`,
      {
        agentARole: 'Senior Code Reviewer - Identify issues and improvements',
        agentBRole: 'Security Expert - Focus on security vulnerabilities and edge cases'
      }
    );
  }

  async decide(decision, context = '') {
    return this.converge(
      `Help me make this decision: ${decision}\n\nContext: ${context}`,
      {
        agentARole: 'Strategic Advisor - Analyze the decision thoroughly',
        agentBRole: 'Risk Analyst - Identify risks and alternative approaches'
      }
    );
  }
}

export default ConvergenceClient;
