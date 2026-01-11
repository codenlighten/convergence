#!/usr/bin/env node
/**
 * Wrapper for CLI with proper executable setup
 */
import('./cli.js').catch(err => {
  console.error(err);
  process.exit(1);
});
