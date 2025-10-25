import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { spawn, execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const execFileAsync = promisify(execFile);

function runStep(name, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: backendRoot,
      stdio: 'inherit',
      env: { ...process.env, ...options.env },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} failed with exit code ${code}`));
      }
    });
  });
}

function isTruthy(value) {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseCliOptions(argv) {
  const options = {
    skipBackup: false,
    forceBackup: false,
    backupOutput: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--skip-backup') {
      options.skipBackup = true;
    } else if (arg === '--force-backup') {
      options.forceBackup = true;
    } else if (arg === '--backup-output') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('--backup-output requires a directory argument');
      }
      options.backupOutput = next;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }

  return options;
}

function printUsage() {
  console.info(`Usage: node scripts/operationalToolingCheck.js [options]\n\n` +
    'Options:\n' +
    '  --skip-backup         Skip the backup dry-run step even if CI_SKIP_TOOLING_BACKUP is unset.\n' +
    '  --force-backup        Run the backup dry-run step even when CI_SKIP_TOOLING_BACKUP=1.\n' +
    '  --backup-output <dir> Override the temporary directory used for backup dry-runs.\n' +
    '  -h, --help            Show this message.\n');
}

async function ensureClean(paths) {
  const statusArgs = ['status', '--porcelain', ...paths];
  const { stdout } = await execFileAsync('git', statusArgs, { cwd: repoRoot });
  if (stdout.trim().length > 0) {
    await execFileAsync('git', ['checkout', '--', ...paths], { cwd: repoRoot });
    throw new Error(
      'Operational tooling produced unstaged changes. Commit the regenerated shared-contracts artefacts before continuing.',
    );
  }
}

async function main() {
  let options;
  try {
    options = parseCliOptions(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printUsage();
    return;
  }

  const steps = [
    {
      name: 'Validate runtime config',
      command: 'node',
      args: ['scripts/validateRuntimeConfig.js', '.env.example'],
    },
    {
      name: 'Sync JSON domain schemas',
      command: 'node',
      args: ['scripts/syncDomainSchemas.js', '--skip-registry', '--check'],
    },
    {
      name: 'Generate TypeScript domain clients',
      command: 'node',
      args: ['scripts/generateDomainClients.js', '--check'],
    },
  ];

  const envSkipBackup = isTruthy(process.env.CI_SKIP_TOOLING_BACKUP);
  const shouldSkipBackup = !options.forceBackup && (options.skipBackup || envSkipBackup);

  if (shouldSkipBackup) {
    console.info('Skipping backup dry-run step (controlled by flags or CI_SKIP_TOOLING_BACKUP).');
  } else {
    let backupOutput = options.backupOutput;
    let cleanup;
    if (backupOutput) {
      backupOutput = path.resolve(backupOutput);
      await fs.mkdir(backupOutput, { recursive: true });
    } else {
      backupOutput = await fs.mkdtemp(path.join(os.tmpdir(), 'gigvora-backup-'));
      cleanup = async () => {
        await fs.rm(backupOutput, { recursive: true, force: true });
      };
    }

    steps.push({
      name: 'Dry-run database backup',
      command: 'node',
      args: ['scripts/databaseBackup.js', 'backup', '--dry-run', '--output', backupOutput],
      cleanup,
    });
  }

  for (const step of steps) {
    console.info(`\n[tooling] ${step.name}`);
    try {
      await runStep(step.name, step.command, step.args, step);
    } finally {
      if (typeof step.cleanup === 'function') {
        await step.cleanup().catch((error) => {
          console.warn(`Cleanup for ${step.name} failed: ${error.message}`);
        });
      }
    }
  }

  await ensureClean(['shared-contracts/domain', 'shared-contracts/clients/typescript']);

  console.info('\nOperational tooling check completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
