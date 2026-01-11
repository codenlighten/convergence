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

console.log('🚀 Using Convergence Engine to design its own API layer...\n');
console.log('⚡ Running dual-agent deliberation RIGHT NOW...\n');

const result = await converge(
  prompt,
  'Senior Backend Architect specializing in Node.js and API design',
  'Security Engineer and API Reviewer focusing on production readiness and scalability'
);

console.log('\n' + '='.repeat(80));
console.log('🎯 API DESIGN CONVERGENCE COMPLETE');
console.log('='.repeat(80));
console.log(`\n📊 Metrics:`);
console.log(`   Converged: ${result.converged ? '✅ YES' : '❌ NO'}`);
console.log(`   Iterations: ${result.iterations}`);
console.log(`   Confidence: ${result.convergenceScore}%`);
console.log(`   Tokens Used: ${result.totalTokens || 'N/A'}`);
console.log(`   Estimated Cost: $${result.totalCost ? result.totalCost.toFixed(6) : 'N/A'}`);
console.log(`\n💡 The design is ready to implement! Check result.finalResponse for complete architecture.`);
console.log(`\n📄 COMPLETE API ARCHITECTURE:\n`);
console.log(result.finalResponse);
console.log('\n' + '='.repeat(80));
