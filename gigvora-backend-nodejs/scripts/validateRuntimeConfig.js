#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parse as parseEnv } from 'dotenv';
import {
  runtimeConfigSchema,
  buildRuntimeConfigFromEnv,
} from '../src/config/runtimeConfig.js';

async function loadEnvFile(filePath) {
  try {
    const absolute = path.resolve(filePath);
    const content = await readFile(absolute, 'utf8');
    return parseEnv(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Environment file not found: ${filePath}`);
    }
    throw error;
  }
}

async function main() {
  const envFile = process.argv[2] ?? '.env';
  let overrides = {};
  if (envFile) {
    overrides = await loadEnvFile(envFile);
  }

  const mergedEnv = {
    ...process.env,
    ...overrides,
  };

  try {
    const rawConfig = buildRuntimeConfigFromEnv(mergedEnv);
    runtimeConfigSchema.parse(rawConfig);
    console.log(`Runtime configuration validated successfully using ${envFile}`);
    process.exit(0);
  } catch (error) {
    console.error('Runtime configuration validation failed.');
    if (error.errors) {
      for (const issue of error.errors) {
        console.error(` - ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error while validating runtime configuration:', error);
  process.exit(1);
});
