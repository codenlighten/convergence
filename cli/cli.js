/**
 * Convergence CLI - Local tool for interacting with the API
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const CONFIG_FILE = '.env.production';

class ConvergenceCLI {
  constructor() {
    this.apiKey = null;
    this.apiUrl = null;
    this.loadConfig();
  }

  loadConfig() {
    const configPath = path.resolve(CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      
      if (key.trim() === 'API_KEY') this.apiKey = value;
      if (key.trim() === 'API_URL') this.apiUrl = value;
    });

    if (!this.apiKey || !this.apiUrl) {
      throw new Error('Missing API_KEY or API_URL in config');
    }

    console.log(`✅ Loaded config: ${this.apiUrl}`);
  }

  async request(method, path, body = null) {
    const url = `${this.apiUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(`API error (${res.status}): ${data.error || 'Unknown error'}`);
    }

    return data;
  }

  async converge(prompt, async = false, webhookUrl = null) {
    const payload = { prompt };
    if (webhookUrl) payload.webhookUrl = webhookUrl;

    const result = await this.request('POST', '/api/v1/converge', payload);

    if (async) {
      console.log(`\n📝 Async task queued`);
      console.log(`   Task ID: ${result.taskId}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Check status with: converge-cli status ${result.taskId}`);
    } else {
      console.log(`\n✅ Convergence complete`);
      this.printResult(result.result);
    }

    return result;
  }

  async status(taskId) {
    const result = await this.request('GET', `/api/v1/status/${taskId}`);

    console.log(`\n📊 Task Status: ${result.status}`);
    if (result.result) {
      this.printResult(result.result);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  async usage() {
    const result = await this.request('GET', '/api/v1/usage');

    console.log(`\n📈 Usage Statistics`);
    console.log(`   Total Convergences: ${result.requests || 0}`);
    console.log(`   Total Cost: $${(result.totalCost || 0).toFixed(6)}`);
    console.log(`   Total Tokens: ${result.totalTokens?.total || 0}`);
  }

  async health() {
    const result = await this.request('GET', '/health');
    console.log(`\n🏥 Health Check`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Queue: ${result.queue}`);
  }

  printResult(result) {
    console.log(`   Converged: ${result.converged ? '✅ YES' : '❌ NO'}`);
    console.log(`   Score: ${result.convergenceScore || 0}%`);
    console.log(`   Iterations: ${result.iterations || 0}`);
    console.log(`   Tokens: ${result.tokens?.total || 0}`);
    console.log(`   Cost: $${(result.estimatedCost || 0).toFixed(6)}`);
    if (result.finalResponse) {
      console.log(`\n📄 Response (first 500 chars):`);
      const text = result.finalResponse.response || JSON.stringify(result.finalResponse).substring(0, 500);
      console.log(`   ${text.substring(0, 500)}...`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const cli = new ConvergenceCLI();

    if (command === 'converge') {
      const prompt = args.slice(1).join(' ');
      if (!prompt) throw new Error('Usage: converge-cli converge "your prompt"');
      await cli.converge(prompt);

    } else if (command === 'async') {
      const prompt = args[1];
      const webhook = args[2];
      if (!prompt) throw new Error('Usage: converge-cli async "prompt" [webhookUrl]');
      await cli.converge(prompt, true, webhook);

    } else if (command === 'status') {
      const taskId = args[1];
      if (!taskId) throw new Error('Usage: converge-cli status <taskId>');
      await cli.status(taskId);

    } else if (command === 'usage') {
      await cli.usage();

    } else if (command === 'health') {
      await cli.health();

    } else {
      console.log(`Convergence CLI v1.0.0\n`);
      console.log('Commands:');
      console.log('  converge <prompt>          - Run sync convergence');
      console.log('  async <prompt> [webhook]   - Run async convergence');
      console.log('  status <taskId>            - Check task status');
      console.log('  usage                      - Show usage stats');
      console.log('  health                     - Health check');
      console.log('\nExamples:');
      console.log('  converge-cli converge "Design a payment system"');
      console.log('  converge-cli async "Design a payment system" https://webhook.site/id');
      console.log('  converge-cli status 3368a286-ec51-482b-81a1-19d655388ac6');
      console.log('  converge-cli usage');
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
