#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const nodeProjects = [
  {
    name: 'Backend',
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
  },
  {
    name: 'Frontend',
    cwd: path.join(repoRoot, 'gigvora-frontend-reactjs'),
  },
];

const frontendTestTargets = [
  'src/pages/__tests__/Group103Pages.test.jsx',
  'src/components/__tests__/WorkspaceManagersModal.test.jsx',
  'src/components/__tests__/WorkspaceBudgetManager.test.jsx',
];

const tasks = [
  {
    name: 'Backend lint',
    command: 'npm',
    args: ['run', 'lint'],
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
    tags: ['backend', 'lint'],
  },
  {
    name: 'Backend tests',
    command: 'npm',
    args: ['test', '--', '--runInBand', '--bail'],
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
    tags: ['backend', 'tests'],
  },
  {
    name: 'Backend config validation',
    command: 'npm',
    args: ['run', 'config:validate'],
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
    tags: ['backend', 'env'],
  },
  {
    name: 'Backend database verification',
    command: 'npm',
    args: ['run', 'db:verify'],
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
    tags: ['backend', 'database'],
  },
  {
    name: 'Backend schema CI',
    command: 'npm',
    args: ['run', 'schemas:ci'],
    cwd: path.join(repoRoot, 'gigvora-backend-nodejs'),
    tags: ['backend', 'bootstrap'],
  },
  {
    name: 'Frontend lint',
    command: 'npm',
    args: ['run', 'lint'],
    cwd: path.join(repoRoot, 'gigvora-frontend-reactjs'),
    tags: ['frontend', 'lint'],
  },
  ...frontendTestTargets.map((target) => ({
    name: `Frontend test: ${target}`,
    command: 'npm',
    args: ['run', 'test', '--', '--run', '--bail=1', '--threads=false', '--include', target],
    cwd: path.join(repoRoot, 'gigvora-frontend-reactjs'),
    tags: ['frontend', 'tests'],
  })),
  {
    name: 'Frontend build',
    command: 'npm',
    args: ['run', 'build'],
    cwd: path.join(repoRoot, 'gigvora-frontend-reactjs'),
    tags: ['frontend', 'build'],
  },
  {
    name: 'Calendar stub tests',
    command: 'node',
    args: ['--test', 'server.test.mjs'],
    cwd: path.join(repoRoot, 'calendar_stub'),
    tags: ['backend', 'calendar', 'tests'],
  },
  {
    name: 'Flutter melos verify',
    command: 'melos',
    args: ['run', 'ci:verify'],
    cwd: path.join(repoRoot, 'gigvora-flutter-phoneapp'),
    tags: ['mobile', 'tests'],
  },
];

const errorRegex = /\b(error|failed|failure|exception|traceback|unhandled|undefined|missing|TypeError|ReferenceError|SyntaxError|ENOENT|EADDRINUSE|warning)\b/i;
const limitPerTask = 120;

async function ensureNodeModules(cwd) {
  try {
    await fs.access(path.join(cwd, 'node_modules'));
    return;
  } catch (accessError) {
    // fall through and install dependencies
  }

  await runCommand({
    name: `${path.basename(cwd)} install`,
    command: 'npm',
    args: ['install', '--no-audit', '--progress=false'],
    cwd,
    tags: ['bootstrap'],
    captureForReport: false,
  });
}

async function runCommand(task) {
  const capture = task.captureForReport !== false;

  return new Promise((resolve) => {
    const child = spawn(task.command, task.args, {
      cwd: task.cwd,
      shell: process.platform === 'win32',
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (capture) stdout += text;
      else process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      if (capture) stderr += text;
      else process.stderr.write(text);
    });

    child.on('error', (error) => {
      if (capture) {
        const message = error && error.message ? error.message : String(error);
        stderr += (stderr ? '\n' : '') + message;
      }
      finish({
        task,
        code: null,
        signal: null,
        stdout,
        stderr,
      });
    });

    child.on('close', (code, signal) => {
      finish({
        task,
        code,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

async function prepareWorkspaces() {
  for (const project of nodeProjects) {
    await ensureNodeModules(project.cwd);
  }
}

function canonicalise(line) {
  return line.replace(/\d+/g, '#');
}

function normaliseOutput(result) {
  const lines = [];
  const outputs = [result.stdout, result.stderr].filter(Boolean);
  for (const output of outputs) {
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      if (!errorRegex.test(line)) continue;
      lines.push({
        task: result.task.name,
        line,
        canonical: canonicalise(line),
      });
    }
  }

  if (typeof result.code === 'number' && result.code !== 0) {
    lines.push({
      task: result.task.name,
      line: `Command exited with code ${result.code}`,
      canonical: 'exit-code',
    });
  }

  if (result.signal) {
    lines.push({
      task: result.task.name,
      line: `Command terminated with signal ${result.signal}`,
      canonical: `signal-${result.signal}`,
    });
  }

  if (typeof result.code !== 'number' && !result.signal && !outputs.join('').trim()) {
    lines.push({
      task: result.task.name,
      line: 'Command failed to start (likely missing binary)',
      canonical: 'spawn-failure',
    });
  }

  return lines;
}

function dedupeFindings(findings) {
  const perTaskCounts = new Map();
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = `${finding.task}::${finding.canonical}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const count = perTaskCounts.get(finding.task) ?? 0;
    if (count >= limitPerTask) continue;
    perTaskCounts.set(finding.task, count + 1);
    unique.push(finding);
  }
  return unique;
}

function formatFindings(findings) {
  if (!findings.length) {
    return 'No errors detected.';
  }

  const groups = [];
  for (let i = 0; i < findings.length; i += 30) {
    const slice = findings.slice(i, i + 30);
    const groupNumber = Math.floor(i / 30) + 1;
    const groupLines = slice
      .map((finding, index) => {
        const globalIndex = i + index + 1;
        return `${globalIndex}. [${finding.task}] ${finding.line}`;
      })
      .join('\n');
    groups.push(`## Group ${groupNumber} (Entries ${i + 1}-${i + slice.length})\n${groupLines}`);
  }

  return ['# Error Sweep Report', ...groups].join('\n\n');
}

async function main() {
  await prepareWorkspaces();

  const results = [];
  for (const task of tasks) {
    console.error(`\n>>> Running: ${task.name}`);
    const result = await runCommand(task);
    results.push(result);
  }

  const findings = dedupeFindings(results.flatMap(normaliseOutput));
  findings.sort((a, b) => a.task.localeCompare(b.task) || a.line.localeCompare(b.line));

  const report = formatFindings(findings);
  console.log(report);
}

main().catch((error) => {
  console.error('Unexpected failure during error sweep');
  console.error(error);
  process.exitCode = 1;
});
