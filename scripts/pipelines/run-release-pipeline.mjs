#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const configPath = path.resolve(__dirname, 'pipeline.config.json');

const exitCodes = {
  PASSED: 0,
  FAILED: 1,
};

const toMs = (hrTime) => Number(hrTime[0]) * 1_000 + Number(hrTime[1]) / 1_000_000;

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (current.startsWith('--')) {
      const key = current.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    } else {
      args._.push(current);
    }
  }
  return args;
};

const loadConfig = async () => {
  const raw = await readFile(configPath, 'utf8');
  return JSON.parse(raw);
};

const runCommand = ({ run, args = [], cwd }) =>
  new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const child = spawn(run, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
    });

    child.on('close', (code) => {
      const end = process.hrtime.bigint();
      resolve({
        code,
        durationMs: Number(end - start) / 1_000_000,
      });
    });
  });

const ensureReportDir = async (reportPath) => {
  const directory = path.dirname(reportPath);
  await mkdir(directory, { recursive: true });
};

const enrichCommand = (command, context) => {
  const cwd = path.resolve(repoRoot, context.workingDirectory ?? '.');
  return {
    id: command.id,
    display: command.display ?? `${command.run} ${command.args?.join(' ') ?? ''}`.trim(),
    run: command.run,
    args: command.args ?? [],
    cwd,
    workingDirectory: cwd,
  };
};

const determineReportPath = (pipelineId, providedPath) => {
  if (providedPath) {
    return path.resolve(repoRoot, providedPath);
  }
  return path.resolve(repoRoot, 'build', 'pipeline', `${pipelineId}-report.json`);
};

const collectStepResult = async (stepConfig) => {
  const commands = stepConfig.commands.map((command) => enrichCommand(command, stepConfig));
  const stepStart = process.hrtime();
  const results = [];
  let status = 'passed';

  for (const command of commands) {
    const commandStart = process.hrtime();
    const { code, durationMs } = await runCommand(command);
    const commandStatus = code === exitCodes.PASSED ? 'passed' : 'failed';
    results.push({
      id: command.id,
      label: command.display,
      command: `${command.run} ${command.args.join(' ')}`.trim(),
      workingDirectory: command.workingDirectory,
      status: commandStatus,
      durationMs,
    });

    if (commandStatus === 'failed') {
      status = 'failed';
      break;
    }
  }

  const durationMs = toMs(process.hrtime(stepStart));

  return {
    id: stepConfig.id,
    name: stepConfig.name,
    workingDirectory: path.resolve(repoRoot, stepConfig.workingDirectory ?? '.'),
    status,
    durationMs,
    commands: results,
  };
};

const buildPipelineSummary = (pipelineConfig, stepResults, startedAt, finishedAt) => {
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const status = stepResults.every((step) => step.status === 'passed') ? 'passed' : 'failed';

  return {
    id: pipelineConfig.id,
    name: pipelineConfig.name,
    description: pipelineConfig.description,
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    steps: stepResults,
  };
};

const runPipeline = async (pipelineConfig) => {
  const stepResults = [];
  const startedAt = new Date();

  for (const step of pipelineConfig.steps) {
    process.stdout.write(`\n▶︎ ${step.name}\n`);
    const result = await collectStepResult(step);
    stepResults.push(result);
    if (result.status === 'failed') {
      process.stdout.write(`✖ ${step.name} failed\n`);
      break;
    }
    process.stdout.write(`✔ ${step.name} completed\n`);
  }

  const finishedAt = new Date();
  return buildPipelineSummary(pipelineConfig, stepResults, startedAt, finishedAt);
};

const main = async () => {
  const args = parseArgs(process.argv);
  const config = await loadConfig();
  const requestedPipeline = args.pipeline ?? args._[0] ?? config.defaultPipeline;
  const pipelineConfig = config.pipelines.find((pipeline) => pipeline.id === requestedPipeline);

  if (!pipelineConfig) {
    const available = config.pipelines.map((pipeline) => pipeline.id).join(', ');
    throw new Error(`Unknown pipeline '${requestedPipeline}'. Available pipelines: ${available}`);
  }

  const reportPath = determineReportPath(pipelineConfig.id, args.report);
  const summary = await runPipeline(pipelineConfig);
  await ensureReportDir(reportPath);
  await writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  process.stdout.write(`\nPipeline summary written to ${path.relative(repoRoot, reportPath)}\n`);

  if (summary.status === 'failed') {
    process.exit(exitCodes.FAILED);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(exitCodes.FAILED);
});
