#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import releaseEngineeringDataset from '../../gigvora-backend-nodejs/src/data/releaseEngineeringDataset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

function resolveWorkingDirectory(relativePath) {
  if (!relativePath) {
    return rootDir;
  }
  return path.resolve(rootDir, relativePath);
}

function runTask(task) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(task.command, task.args, {
      cwd: resolveWorkingDirectory(task.cwd),
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    let settled = false;

    const finalize = ({ status, exitCode = 0, error = null }) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({
        pipelineId: task.pipelineId,
        pipelineLabel: task.pipelineLabel,
        display: task.display,
        command: `${task.command} ${task.args.join(' ')}`.trim(),
        cwd: resolveWorkingDirectory(task.cwd),
        optional: Boolean(task.optional),
        status,
        exitCode,
        error,
        durationMs: Date.now() - startedAt,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
      });
    };

    child.once('error', (error) => {
      const missingExecutable = error.code === 'ENOENT';
      if (missingExecutable && task.optional) {
        console.warn(`\n[pipeline] Skipping optional task "${task.display}" – command not found.`);
        finalize({ status: 'skipped', exitCode: 0, error: error.message });
        return;
      }
      finalize({ status: 'failed', exitCode: error.code ?? 1, error: error.message });
    });

    child.once('exit', (code) => {
      if (code === 0) {
        finalize({ status: 'passed', exitCode: 0 });
        return;
      }
      const status = task.optional ? 'partial' : 'failed';
      finalize({ status, exitCode: code ?? 1, error: code === null ? 'Process exited abnormally.' : null });
    });
  });
}

function createTaskList(dataset) {
  return dataset.pipelines.flatMap((pipeline) => {
    const commands = Array.isArray(pipeline.commands) ? pipeline.commands : [];
    return commands.map((command) => ({
      pipelineId: pipeline.id,
      pipelineLabel: pipeline.label,
      display: command.display ?? `${command.command} ${command.args?.join(' ') ?? ''}`.trim(),
      command: command.command,
      args: Array.isArray(command.args) ? command.args : [],
      cwd: command.cwd,
      optional: Boolean(command.optional),
    }));
  });
}

function summarisePipelineResults(dataset, taskResults) {
  return dataset.pipelines.map((pipeline) => {
    const pipelineTasks = taskResults.filter((result) => result.pipelineId === pipeline.id);
    const failures = pipelineTasks.filter((result) => result.status === 'failed');
    const partials = pipelineTasks.filter((result) => result.status === 'partial');
    const skipped = pipelineTasks.filter((result) => result.status === 'skipped');
    const status = failures.length
      ? 'failed'
      : partials.length
      ? 'attention'
      : skipped.length
      ? 'attention'
      : 'passed';

    return {
      id: pipeline.id,
      label: pipeline.label,
      status,
      executed: pipelineTasks.length,
      commandCount: Array.isArray(pipeline.commands) ? pipeline.commands.length : 0,
      skipped: skipped.length,
      failures: failures.length,
      partials: partials.length,
      durationMs: pipelineTasks.reduce((total, result) => total + result.durationMs, 0),
      blockers: pipeline.blockers ?? [],
    };
  });
}

async function writeSummary(summary, dataset) {
  const artifactPath = dataset.tooling?.artifactPath
    ? path.resolve(rootDir, dataset.tooling.artifactPath)
    : path.resolve(rootDir, 'pipeline-latest.json');

  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, JSON.stringify(summary, null, 2), 'utf8');
  return artifactPath;
}

async function main() {
  const tasks = createTaskList(releaseEngineeringDataset);
  const startedAt = new Date();
  const taskResults = [];

  for (const task of tasks) {
    console.log(`\n[pipeline] ${task.pipelineLabel} – ${task.display}`);
    const result = await runTask(task);
    taskResults.push(result);
    if (result.status === 'failed') {
      console.error(`[pipeline] Task failed: ${result.display}`);
      process.exitCode = 1;
      break;
    }
  }

  const finishedAt = new Date();
  const pipelines = summarisePipelineResults(releaseEngineeringDataset, taskResults);
  const hasFailure = pipelines.some((pipeline) => pipeline.status === 'failed');
  const hasAttention = pipelines.some((pipeline) => pipeline.status === 'attention');
  const overallStatus = hasFailure ? 'failed' : hasAttention ? 'attention' : 'passed';

  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    status: overallStatus,
    pipelines,
    tasks: taskResults,
  };

  const artifactPath = await writeSummary(summary, releaseEngineeringDataset);

  console.log(`\n[pipeline] Overall status: ${overallStatus.toUpperCase()}`);
  pipelines.forEach((pipeline) => {
    console.log(
      `[pipeline] ${pipeline.label}: ${pipeline.status.toUpperCase()} (${pipeline.executed}/${pipeline.commandCount} commands, ${pipeline.durationMs}ms)`,
    );
  });
  console.log(`[pipeline] Summary written to ${path.relative(rootDir, artifactPath)}`);

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error('[pipeline] Unexpected failure', error);
  process.exit(1);
});
