import { config as loadEnv } from 'dotenv';

let attempted = false;
let lastResult;

export function ensureEnvLoaded({ silent = false } = {}) {
  if (!attempted) {
    attempted = true;
    lastResult = loadEnv();
    if (lastResult.error && !silent) {
      console.warn(
        `Failed to load .env file: ${lastResult.error.message}. Falling back to process environment.`,
      );
    }
  }
  return process.env;
}

export function getLastEnvLoadResult() {
  return lastResult;
}

export default ensureEnvLoaded;
