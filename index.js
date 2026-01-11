/**
 * Convergence Engine - Dual Agent Recursive Deliberation
 * 
 * Two agents engage in structured dialogue until they reach singularity:
 * - continue: false (both agents agree work is complete)
 * - missingContext: [] (no gaps in understanding)
 * 
 * This creates emergent intelligence through recursive refinement.
 * 
 * @module convergence-engine
 */

import OpenAI from 'openai';

// Agent response schema for structured output
const baseAgentResponseSchema = {
  type: "object",
  properties: {
    response: {
      type: "string",
      description: "Your comprehensive response to the query"
    },
    continue: {
      type: "boolean",
      description: "Should the deliberation continue? false = work is complete"
    },
    missingContext: {
      type: "array",
      items: { type: "string" },
      description: "List any missing information or gaps in understanding"
    },
    confidence: {
      type: "number",
      description: "Your confidence level (0-100)"
    }
  },
  required: ["response", "continue", "missingContext", "confidence"],
  additionalProperties: false
};

/**
 * Query OpenAI with structured output, including retry logic and error handling
 */
async function queryOpenAI(prompt, options = {}) {
  const {
    context = {},
    schema = baseAgentResponseSchema,
    temperature = 0.3,
    apiKey = process.env.OPENAI_API_KEY,
    model = 'gpt-4o-2024-08-06',
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set. Please set the OPENAI_API_KEY environment variable.');
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Invalid prompt: must be a non-empty string');
  }

  const openai = new OpenAI({ apiKey });
  let lastError;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are participating in a convergence deliberation. Provide thorough analysis and clearly indicate if more work is needed.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nContext: ${JSON.stringify(context, null, 2)}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'agent_response',
            strict: true,
            schema
          }
        },
        temperature
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse = JSON.parse(response.choices[0].message.content);
      
      // Validate response structure
      if (!parsedResponse.response || typeof parsedResponse.continue !== 'boolean' || !Array.isArray(parsedResponse.missingContext)) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Return response with token usage
      return {
        ...parsedResponse,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      lastError = error;
      const isRetryable = error.status === 429 || error.status === 500 || error.status === 503;
      
      if (isRetryable && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // exponential backoff
        console.warn(`⚠️  API error (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (!isRetryable || attempt === maxRetries) {
        throw new Error(`OpenAI API failed after ${attempt} attempt(s): ${error.message}`);
      }
    }
  }

  throw lastError;
}

/**
 * Check if agents have reached convergence (singularity)
 * 
 * @param {Object} agentResponse - Agent response object
 * @returns {boolean} True if converged
 */
export function hasConverged(agentResponse) {
  return !agentResponse.continue && agentResponse.missingContext.length === 0;
}

/**
 * Calculate convergence score (0-100)
 * 
 * @param {Object} agentResponse - Agent response object
 * @returns {number} Score from 0-100
 */
export function getConvergenceScore(agentResponse) {
  let score = 0;
  
  // Not wanting to continue = 60 points
  if (!agentResponse.continue) score += 60;
  
  // No missing context = 40 points
  if (agentResponse.missingContext.length === 0) score += 40;
  
  // Partial credit for fewer missing items
  else {
    const missingPenalty = Math.min(agentResponse.missingContext.length * 10, 40);
    score += (40 - missingPenalty);
  }
  
  return Math.max(0, score);
}

/**
 * Token pricing for GPT-4o models (as of 2024)
 * Update these if pricing changes
 */
const TOKEN_PRICING = {
  'gpt-4o-2024-08-06': {
    prompt: 0.0025,    // $2.50 per 1M tokens
    completion: 0.010  // $10.00 per 1M tokens
  },
  'gpt-4o': {
    prompt: 0.0025,
    completion: 0.010
  },
  'gpt-4-turbo': {
    prompt: 0.01,
    completion: 0.03
  },
  'gpt-4': {
    prompt: 0.03,
    completion: 0.06
  }
};

/**
 * Calculate estimated cost for tokens
 * 
 * @param {number} promptTokens - Number of prompt tokens
 * @param {number} completionTokens - Number of completion tokens
 * @param {string} model - Model name
 * @returns {number} Estimated cost in dollars
 */
export function calculateTokenCost(promptTokens, completionTokens, model = 'gpt-4o-2024-08-06') {
  const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4o-2024-08-06'];
  return (promptTokens * pricing.prompt + completionTokens * pricing.completion) / 1000000;
}

/**
 * Run convergence loop between two agents
 * 
 * @param {string} initialQuery - The question/problem to converge on
 * @param {Object} options - Configuration options
 * @param {string} [options.agentA] - Role/persona for Agent A
 * @param {string} [options.agentB] - Role/persona for Agent B
 * @param {number} [options.maxIterations=8] - Max iterations before giving up
 * @param {Function} [options.onIteration] - Callback for each iteration
 * @param {number} [options.temperature=0.3] - Temperature for queries
 * @param {string} [options.openaiApiKey] - OpenAI API key
 * @param {string} [options.model] - OpenAI model to use
 * @returns {Promise<Object>} Final converged result with full conversation history and cost tracking
 */
export async function converge(initialQuery, options = {}) {
  if (!initialQuery || typeof initialQuery !== 'string' || initialQuery.trim().length === 0) {
    throw new Error('Invalid initialQuery: must be a non-empty string');
  }

  const {
    agentA = "Expert Researcher - Provide comprehensive analysis with depth",
    agentB = "Critical Reviewer - Find gaps, challenge assumptions, suggest improvements",
    maxIterations = 8,
    onIteration = null,
    temperature = 0.3,
    openaiApiKey = process.env.OPENAI_API_KEY,
    model = 'gpt-4o-2024-08-06'
  } = options;

  if (maxIterations < 1 || !Number.isInteger(maxIterations)) {
    throw new Error('maxIterations must be a positive integer');
  }

  if (temperature < 0 || temperature > 2) {
    throw new Error('temperature must be between 0 and 2');
  }
  
  const conversation = [];
  let totalTokens = { prompt: 0, completion: 0, total: 0 };
  let currentContext = {
    originalQuery: initialQuery,
    iteration: 0
  };
  
  let agentAResponse = null;
  let agentBResponse = null;
  
  console.log(`\n🎯 Starting convergence on: "${initialQuery}"\n`);
  console.log(`Agent A: ${agentA}`);
  console.log(`Agent B: ${agentB}`);
  console.log(`Max iterations: ${maxIterations}\n`);
  console.log('═'.repeat(80));
  
  for (let i = 0; i < maxIterations; i++) {
    currentContext.iteration = i + 1;
    
    // Agent A's turn
    console.log(`\n🔵 Agent A - Iteration ${i + 1}`);
    console.log('─'.repeat(80));
    
    const agentAPrompt = i === 0 
      ? initialQuery
      : `Build upon and refine the previous discussion:\n\nPrevious response: ${agentBResponse.response}\n\nMissing context identified: ${agentBResponse.missingContext.join(', ') || 'None'}\n\nProvide deeper analysis.`;
    
    agentAResponse = await queryOpenAI(agentAPrompt, {
      context: currentContext,
      schema: baseAgentResponseSchema,
      temperature,
      apiKey: openaiApiKey,
      model
    });
    
    // Track tokens
    if (agentAResponse.tokens) {
      totalTokens.prompt += agentAResponse.tokens.prompt;
      totalTokens.completion += agentAResponse.tokens.completion;
      totalTokens.total += agentAResponse.tokens.total;
    }
    
    const scoreA = getConvergenceScore(agentAResponse);
    console.log(`Response: ${agentAResponse.response.substring(0, 200)}...`);
    console.log(`Continue: ${agentAResponse.continue} | Missing: [${agentAResponse.missingContext.join(', ')}]`);
    console.log(`Convergence Score: ${scoreA}%`);
    
    conversation.push({
      iteration: i + 1,
      agent: 'A',
      role: agentA,
      response: agentAResponse
    });
    
    // Check convergence
    if (hasConverged(agentAResponse)) {
      console.log('\n🎉 SINGULARITY REACHED by Agent A!');
      const estCost = calculateTokenCost(totalTokens.prompt, totalTokens.completion, model);
      return {
        converged: true,
        iterations: i + 1,
        finalResponse: agentAResponse,
        conversation,
        convergenceScore: 100,
        tokens: totalTokens,
        estimatedCost: parseFloat(estCost.toFixed(6))
      };
    }
    
    currentContext.agentAResponse = agentAResponse;
    
    // Agent B's turn
    console.log(`\n🟢 Agent B - Iteration ${i + 1}`);
    console.log('─'.repeat(80));
    
    const agentBPrompt = `Review and critique this response. Find gaps, challenge assumptions, and suggest what's missing:\n\n${agentAResponse.response}`;
    
    agentBResponse = await queryOpenAI(agentBPrompt, {
      context: currentContext,
      schema: baseAgentResponseSchema,
      temperature,
      apiKey: openaiApiKey,
      model
    });
    
    // Track tokens
    if (agentBResponse.tokens) {
      totalTokens.prompt += agentBResponse.tokens.prompt;
      totalTokens.completion += agentBResponse.tokens.completion;
      totalTokens.total += agentBResponse.tokens.total;
    }
    
    const scoreB = getConvergenceScore(agentBResponse);
    console.log(`Response: ${agentBResponse.response.substring(0, 200)}...`);
    console.log(`Continue: ${agentBResponse.continue} | Missing: [${agentBResponse.missingContext.join(', ')}]`);
    console.log(`Convergence Score: ${scoreB}%`);
    
    conversation.push({
      iteration: i + 1,
      agent: 'B',
      role: agentB,
      response: agentBResponse
    });
    
    // Check convergence
    if (hasConverged(agentBResponse)) {
      console.log('\n🎉 SINGULARITY REACHED by Agent B!');
      const estCost = calculateTokenCost(totalTokens.prompt, totalTokens.completion, model);
      return {
        converged: true,
        iterations: i + 1,
        finalResponse: agentBResponse,
        conversation,
        convergenceScore: 100,
        tokens: totalTokens,
        estimatedCost: parseFloat(estCost.toFixed(6))
      };
    }
    
    currentContext.agentBResponse = agentBResponse;
    
    // Callback for monitoring
    if (onIteration) {
      onIteration({
        iteration: i + 1,
        agentA: agentAResponse,
        agentB: agentBResponse,
        converged: false
      });
    }
    
    console.log('═'.repeat(80));
  }
  
  // Max iterations reached without full convergence
  const finalScore = Math.max(
    getConvergenceScore(agentAResponse),
    getConvergenceScore(agentBResponse)
  );
  
  const estCost = calculateTokenCost(totalTokens.prompt, totalTokens.completion, model);
  console.log(`\n⚠️  Max iterations reached. Best convergence: ${finalScore}%`);
  console.log(`💰 Tokens used: ${totalTokens.total} | Estimated cost: $${estCost.toFixed(6)}`);
  
  return {
    converged: false,
    iterations: maxIterations,
    finalResponse: finalScore === getConvergenceScore(agentAResponse) ? agentAResponse : agentBResponse,
    conversation,
    convergenceScore: finalScore,
    tokens: totalTokens,
    estimatedCost: parseFloat(estCost.toFixed(6))
  };
}

/**
 * Specialized convergence for code generation
 * 
 * @param {string} codeRequest - What code to generate
 * @param {Object} options - Same as converge options
 * @returns {Promise<Object>} Convergence result
 */
export async function convergeOnCode(codeRequest, options = {}) {
  return converge(codeRequest, {
    ...options,
    agentA: "Senior Software Engineer - Write clean, documented, production-ready code",
    agentB: "Code Reviewer - Find bugs, security issues, performance problems, and style violations",
    temperature: 0.2  // Lower temp for code
  });
}

/**
 * Specialized convergence for architecture/design
 * 
 * @param {string} architectureQuestion - What to design
 * @param {Object} options - Same as converge options
 * @returns {Promise<Object>} Convergence result
 */
export async function convergeOnArchitecture(architectureQuestion, options = {}) {
  return converge(architectureQuestion, {
    ...options,
    agentA: "Solutions Architect - Design scalable, maintainable systems",
    agentB: "Technical Critic - Challenge design decisions, find edge cases, suggest alternatives",
    temperature: 0.4
  });
}

export default {
  converge,
  convergeOnCode,
  convergeOnArchitecture,
  hasConverged,
  getConvergenceScore
};
