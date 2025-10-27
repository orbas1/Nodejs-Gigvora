#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { performance } from 'node:perf_hooks';

import {
  recordMonitorSample,
  markChecklistItemStatus,
  recordPipelineRunResult,
} from '../gigvora-backend-nodejs/src/services/releaseManagementService.js';

const PIPELINE_REPORT_PATH = resolve(process.cwd(), 'update_docs/release-management/build-pipeline-report.json');

const TASKS = [
  {
    name: 'frontend:lint',
    title: 'Frontend lint',
    cwd: 'gigvora-frontend-reactjs',
    command: ['npm', 'run', 'lint'],
  },
  {
    name: 'frontend:test',
    title: 'Frontend tests',
    cwd: 'gigvora-frontend-reactjs',
    command: ['npm', 'run', 'test', '--', '--run'],
  },
  {
    name: 'frontend:build',
    title: 'Frontend build',
    cwd: 'gigvora-frontend-reactjs',
    command: ['npm', 'run', 'build'],
  },
  {
    name: 'backend:lint',
    title: 'Backend lint',
    cwd: 'gigvora-backend-nodejs',
    command: ['npm', 'run', 'lint'],
  },
  {
    name: 'backend:test',
    title: 'Backend tests',
    cwd: 'gigvora-backend-nodejs',
    command: ['npm', 'test', '--', '--runInBand'],
  },
  {
    name: 'backend:schemas',
    title: 'Contract generation',
    cwd: 'gigvora-backend-nodejs',
    command: ['npm', 'run', 'schemas:ci'],
  },
];

function runCommand({ command, cwd, title }) {
  return new Promise((resolvePromise) => {
    const startedAt = performance.now();
    const child = spawn(command[0], command.slice(1), {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });

    child.on('exit', (code) => {
      const finishedAt = performance.now();
      resolvePromise({
        title,
        exitCode: code ?? 1,
        status: code === 0 ? 'passed' : 'failed',
        durationMs: Math.round(finishedAt - startedAt),
        stdout,
        stderr,
      });
    });

    child.on('error', (error) => {
      const finishedAt = performance.now();
      resolvePromise({
        title,
        exitCode: 1,
        status: 'failed',
        durationMs: Math.round(finishedAt - startedAt),
        stdout,
        stderr: `${stderr}\n${error.stack ?? error.message ?? String(error)}`.trim(),
      });
    });
  });
}

function toMonitorStatus(taskStatus) {
  if (taskStatus === 'passed') {
    return 'passing';
  }
  return 'failing';
}

async function persistReport(summary) {
  await mkdir(dirname(PIPELINE_REPORT_PATH), { recursive: true });
  await writeFile(PIPELINE_REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

async function syncMonitor(taskName, taskResult) {
  const monitorId = `ci-${taskName}`;
  await recordMonitorSample(monitorId, {
    name: `CI ${taskResult.title}`,
    environment: 'ci',
    status: toMonitorStatus(taskResult.status),
    metrics: {
      durationMs: taskResult.durationMs,
      exitCode: taskResult.exitCode,
    },
  });
}

async function syncChecklist(status) {
  await markChecklistItemStatus('ci-signed-off', status === 'passed' ? 'complete' : 'attention', {
    summary: status === 'passed' ? 'All CI stages passed in the orchestrated pipeline.' : 'CI pipeline failures require attention before release.',
  });
}

async function run() {
  const results = [];
  const pipelineStartedAt = new Date();
  for (const task of TASKS) {
    console.log(`\n▶️  Running ${task.title} (${task.command.join(' ')})`);
    const result = await runCommand(task);
    await syncMonitor(task.name, result);
    results.push({
      name: task.name,
      title: task.title,
      status: result.status,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
    });
    if (result.status === 'failed') {
      console.error(`❌ ${task.title} failed with exit code ${result.exitCode}.`);
    } else {
      console.log(`✅ ${task.title} completed in ${result.durationMs}ms.`);
    }
  }

  const overallStatus = results.every((task) => task.status === 'passed') ? 'passed' : 'failed';
  const summary = {
    generatedAt: new Date().toISOString(),
    status: overallStatus,
    tasks: results,
  };

  await persistReport(summary);
  await syncChecklist(overallStatus);

  const pipelineCompletedAt = new Date();
  await recordPipelineRunResult(
    'full-stack-ci',
    {
      status: overallStatus,
      startedAt: pipelineStartedAt.toISOString(),
      completedAt: pipelineCompletedAt.toISOString(),
      durationMs: pipelineCompletedAt.getTime() - pipelineStartedAt.getTime(),
      tasks: results,
      metadata: {
        triggeredBy: process.env.CI_TRIGGERED_BY ?? 'local-operator',
        commit: process.env.GIT_COMMIT ?? process.env.CI_COMMIT_SHA ?? null,
      },
    },
  );

  if (overallStatus === 'failed') {
    console.error('\nCI pipeline completed with failures. See task logs for details.');
    process.exitCode = 1;
  } else {
    console.log('\nAll CI tasks completed successfully.');
  }
}

run().catch((error) => {
  console.error('Failed to orchestrate CI pipeline:', error);
  process.exitCode = 1;
});
