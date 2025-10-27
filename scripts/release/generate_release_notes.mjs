#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  getReleaseRolloutSnapshot,
  getPipelineRunHistory,
} from '../../gigvora-backend-nodejs/src/services/releaseManagementService.js';

const execFileAsync = promisify(execFile);

const exec = async (file, args, options = {}) => {
  try {
    const { stdout } = await execFileAsync(file, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, ...options });
    return stdout.trim();
  } catch (error) {
    if (options.ignoreErrors) {
      return '';
    }
    throw error;
  }
};

function parseArgs(argv) {
  const options = { to: 'HEAD' };
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      // Ignore positional arguments for now.
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1];
    if (value && !value.startsWith('--')) {
      options[key] = value;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

function normaliseSectionName(name) {
  return name.replace(/(^|\s)([a-z])/g, (match, space, letter) => `${space}${letter.toUpperCase()}`);
}

function toShortHash(hash) {
  return hash ? hash.slice(0, 7) : '';
}

function classifyCommit(subject) {
  const lower = subject.toLowerCase();
  if (lower.startsWith('feat') || lower.includes('feature')) {
    return 'features';
  }
  if (lower.startsWith('fix') || lower.includes('bug')) {
    return 'fixes';
  }
  if (lower.startsWith('docs') || lower.includes('docs') || lower.includes('documentation')) {
    return 'docs';
  }
  if (lower.startsWith('perf')) {
    return 'performance';
  }
  if (lower.startsWith('refactor')) {
    return 'refactors';
  }
  if (lower.startsWith('test')) {
    return 'tests';
  }
  if (lower.startsWith('build') || lower.startsWith('ci')) {
    return 'build';
  }
  if (lower.startsWith('chore')) {
    return 'chores';
  }
  return 'other';
}

function parseGitLog(raw) {
  const entries = raw
    .split('\u001e')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [hash, author, subject, body = ''] = chunk.split('\u001f');
      return { hash, author, subject, body: body.trim() };
    });

  const sections = new Map();
  for (const entry of entries) {
    const section = classifyCommit(entry.subject ?? '');
    const bucket = sections.get(section) ?? [];
    bucket.push(entry);
    sections.set(section, bucket);
  }

  return sections;
}

async function resolveBaselineRef(target) {
  const describe = await exec('git', ['describe', '--tags', '--abbrev=0', `${target}^`], { ignoreErrors: true });
  if (describe) {
    return describe;
  }
  const firstCommit = await exec('git', ['rev-list', '--max-parents=0', target]);
  return firstCommit.split('\n').pop();
}

async function readJson(path) {
  try {
    const content = await readFile(path, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function formatList(entries) {
  return entries
    .map((entry) => {
      const details = entry.body ? entry.body.replace(/\s+/g, ' ').slice(0, 240) : '';
      const parts = [`- ${entry.subject.trim()} (${toShortHash(entry.hash)})`];
      if (details) {
        parts.push(`  - ${details}`);
      }
      return parts.join('\n');
    })
    .join('\n');
}

function buildSections(sections) {
  const order = ['features', 'fixes', 'performance', 'refactors', 'docs', 'tests', 'build', 'chores', 'other'];
  const markdown = [];
  for (const key of order) {
    const entries = sections.get(key);
    if (!entries || !entries.length) {
      continue;
    }
    markdown.push(`### ${normaliseSectionName(key)}`);
    markdown.push(formatList(entries));
    markdown.push('');
  }
  return markdown;
}

function summarisePipeline(report) {
  if (!report) {
    return ['- Pipeline report unavailable.'];
  }
  const lines = report.tasks.map((task) => `- ${task.title}: **${task.status.toUpperCase()}** (${task.durationMs}ms)`);
  lines.unshift(`- Overall status: **${report.status.toUpperCase()}**`);
  return lines;
}

function summarisePhases(phases = []) {
  return phases.map((phase, index) => {
    const status = phase.status?.toUpperCase() ?? 'PENDING';
    const coverage = phase.coverage != null ? ` — ${phase.coverage}% coverage` : '';
    return `- ${index + 1}. ${phase.name ?? phase.key} — **${status}**${coverage}`;
  });
}

function summariseSegments(segments = []) {
  return segments.map((segment) => {
    const coverage = segment.coverage != null ? `${segment.coverage}%` : 'n/a';
    return `- ${segment.name ?? segment.key}: ${coverage} coverage (${segment.status ?? 'pending'})`;
  });
}

function summariseChecklist(checklist) {
  if (!checklist || !checklist.items) {
    return ['- No checklist configured.'];
  }
  return checklist.items.map((item) => {
    const status = item.status?.toUpperCase() ?? 'PENDING';
    const owner = item.owner ? ` — owner: ${item.owner}` : '';
    return `- ${item.name ?? item.key}: **${status}**${owner}`;
  });
}

async function writeReleaseNote(content, tag) {
  const releaseDir = resolve(process.cwd(), 'update_docs/release-notes');
  await mkdir(releaseDir, { recursive: true });

  const fileName = tag ? `${tag}.md` : `${Date.now()}-release.md`;
  const filePath = resolve(releaseDir, fileName);
  await writeFile(filePath, `${content}\n`);
  await writeFile(resolve(releaseDir, 'latest.md'), `${content}\n`);

  const indexPath = resolve(releaseDir, 'index.json');
  const existingIndex = (await readJson(indexPath)) ?? { releases: [] };
  const entry = { tag: tag ?? fileName.replace(/\.md$/, ''), path: fileName, generatedAt: new Date().toISOString() };
  const filtered = existingIndex.releases.filter((item) => item.tag !== entry.tag);
  filtered.unshift(entry);
  existingIndex.releases = filtered.slice(0, 20);
  await writeFile(indexPath, `${JSON.stringify(existingIndex, null, 2)}\n`);

  return filePath;
}

async function buildReleaseNotes(options) {
  const toRef = options.to ?? 'HEAD';
  const fromRef = options.from ?? (await resolveBaselineRef(toRef));

  const range = fromRef ? `${fromRef}..${toRef}` : toRef;
  const rawLog = await exec('git', ['log', range, '--pretty=format:%H%x1f%an%x1f%s%x1f%b%x1e']);
  const sections = parseGitLog(rawLog);

  const [latestPipelineRun] = await getPipelineRunHistory({ pipelineKey: 'full-stack-ci', limit: 1 });
  const pipelineReport = latestPipelineRun
    ? {
        status: latestPipelineRun.status,
        tasks: latestPipelineRun.tasks ?? [],
        startedAt: latestPipelineRun.startedAt,
        completedAt: latestPipelineRun.completedAt,
        durationMs: latestPipelineRun.durationMs,
      }
    : await readJson(resolve(process.cwd(), 'update_docs/release-management/build-pipeline-report.json'));

  const releaseSnapshot = await getReleaseRolloutSnapshot();

  const release = releaseSnapshot.active ? releaseSnapshot.release : null;
  const checklist = releaseSnapshot.checklist ?? { items: [], total: 0, completed: 0 };

  const releaseHeader = release
    ? `${release.name ?? 'Release'} (${release.version ?? release.id ?? 'unversioned'})`
    : `Gigvora Release (${new Date().toISOString().slice(0, 10)})`;

  const lines = [`# ${releaseHeader}`, '', `Generated on ${new Date().toISOString()}.`, ''];

  const sectionBlocks = buildSections(sections);
  if (sectionBlocks.length) {
    lines.push('## Highlights');
    lines.push(...sectionBlocks);
  } else {
    lines.push('## Highlights');
    lines.push('- No commits detected in the selected range.');
    lines.push('');
  }

  lines.push('## Build & Quality Gates');
  lines.push(...summarisePipeline(pipelineReport));
  lines.push('');

  lines.push('## Rollout Readiness');
  if (release) {
    lines.push(`- Current phase: **${(release.phase ?? '').toUpperCase() || 'PENDING'}**`);
    lines.push('- Phases:');
    lines.push(...summarisePhases(release.phases ?? []));
    lines.push('- Segments:');
    lines.push(...summariseSegments(release.segments ?? []));
  } else {
    lines.push('- No active release configured.');
  }
  lines.push('');

  lines.push('## Checklist Status');
  lines.push(...summariseChecklist(checklist));
  lines.push('');

  lines.push('## Observability Monitors');
  const monitors = Array.isArray(releaseSnapshot.monitors) ? releaseSnapshot.monitors : [];
  if (monitors.length) {
    for (const monitor of monitors) {
      const status = monitor.status?.toUpperCase() ?? 'UNKNOWN';
      const duration = monitor.metrics?.durationMs != null ? `${monitor.metrics.durationMs}ms` : 'n/a';
      const coverage = monitor.coverage != null ? `${monitor.coverage}%` : 'n/a';
      lines.push(
        `- ${monitor.name ?? monitor.key ?? monitor.id}: **${status}** — coverage ${coverage}, last sample ${monitor.lastSampleAt ?? 'n/a'} (duration ${duration})`,
      );
    }
  } else {
    lines.push('- No monitors recorded.');
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv);
  const content = await buildReleaseNotes(options);
  const filePath = await writeReleaseNote(content, options.tag ?? options.version ?? null);
  console.log(`Release notes written to ${filePath}`);
}

main().catch((error) => {
  console.error('Failed to generate release notes:', error);
  process.exitCode = 1;
});
