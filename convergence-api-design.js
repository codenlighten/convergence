import { converge } from './index.js';

const prompt = `Design a production-ready Express.js API layer for the Convergence Engine with the following requirements:

1. REST API endpoints:
   - POST /api/v1/converge - Main convergence endpoint
   - GET /api/v1/status/:taskId - Check convergence status
   - POST /api/v1/webhook - Configure webhook for async results
   - GET /api/v1/usage - Get usage statistics and costs

2. Request format for /api/v1/converge:
   {
     "prompt": "string",
     "agentARole": "string (optional)",
     "agentBRole": "string (optional)", 
     "maxIterations": "number (optional, default 10)",
     "webhookUrl": "string (optional for async)"
   }

3. Security requirements:
   - API key authentication (X-API-Key header)
   - Rate limiting (100 requests/minute per key)
   - Input validation and sanitization
   - CORS configuration for web clients
   - Request logging and audit trail

4. Architecture requirements:
   - Async processing with task queue (for long convergences)
   - Redis for task status tracking
   - PostgreSQL for storing convergence history
   - Webhook delivery with retry logic (exponential backoff)
   - Error handling with proper HTTP status codes

5. Response format:
   - Sync: immediate convergence result
   - Async: taskId for status checking
   - Include convergence score, iterations, tokens, cost

Design the complete Express.js application structure including:
- Route handlers
- Middleware stack
- Database schema
- Queue architecture
- Error handling
- OpenAPI/Swagger documentation

Provide production-ready, secure, scalable code.`;

console.log('Ì∫Ä Using Convergence Engine to design its own API layer...\n');
console.log('This is running on your LOCAL machine but could run on the server too!\n');

const result = await converge(
  prompt,
  'Senior Backend Architect specializing in Node.js and API design',
  'Security Engineer and API Reviewer focusing on production readiness and scalability'
);

console.log('\n' + '='.repeat(80));
console.log('ÌæØ API DESIGN CONVERGENCE COMPLETE');
console.log('='.repeat(80));
console.log(`\nÌ≥ä Metrics:`);
console.log(`   Converged: ${result.converged ? '‚úÖ YES' : '‚ùå NO'}`);
console.log(`   Iterations: ${result.iterations}`);
console.log(`   Confidence: ${result.convergenceScore}%`);
console.log(`   Tokens Used: ${result.totalTokens}`);
console.log(`   Estimated Cost: $${result.totalCost.toFixed(6)}`);
console.log(`\nÌ≤° The convergence reasoning is in the result - ready to implement!`);
console.log('\n' + '='.repeat(80));
