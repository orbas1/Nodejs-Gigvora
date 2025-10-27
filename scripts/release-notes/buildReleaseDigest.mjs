#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import releaseEngineeringService from '../../gigvora-backend-nodejs/src/services/releaseEngineeringService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

function toDateString(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toISOString().split('T')[0];
}

function toPercent(value) {
  if (typeof value !== 'number') {
    return '0%';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function createPipelineTable(pipelines) {
  const header = ['| Pipeline | Status | Coverage | Duration | Blockers |', '| --- | --- | --- | --- | --- |'];
  const rows = pipelines.map((pipeline) => {
    const coverage = pipeline.coverage ? toPercent(pipeline.coverage) : '—';
    const duration = pipeline.durationMs ? `${Math.round(pipeline.durationMs / 1000)}s` : '—';
    const blockers = pipeline.blockers?.length ? pipeline.blockers.join('; ') : '—';
    return `| ${pipeline.label} | ${pipeline.status} | ${coverage} | ${duration} | ${blockers} |`;
  });
  return [...header, ...rows].join('\n');
}

function createRolloutTable(cohorts) {
  const header = ['| Cohort | Stage | Adoption | Health | Guardrails | Next checkpoint |', '| --- | --- | --- | --- | --- | --- |'];
  const rows = cohorts.map((cohort) => {
    const adoption = toPercent(cohort.adoptionRate ?? 0);
    const health = cohort.healthScore ? toPercent(cohort.healthScore) : '—';
    const guardrails = cohort.guardrails
      ? Object.entries(cohort.guardrails)
          .map(([key, value]) => `${key}: ${toPercent(value)}`)
          .join(', ')
      : '—';
    return `| ${cohort.name} | ${cohort.stage} | ${adoption} | ${health} | ${guardrails} | ${toDateString(
      cohort.nextCheckpointAt ?? cohort.nextCheckpoint,
    )} |`;
  });
  return [...header, ...rows].join('\n');
}

function buildMarkdown(suite) {
  const lines = [];
  const release = suite.releases.latest ?? {};
  const pipelines = suite.pipelines.pipelines ?? [];
  const cohorts = suite.rollouts.cohorts ?? [];

  const versionLabel = release.version ? `${release.version}${release.codename ? ` – ${release.codename}` : ''}` : 'Draft release';

  lines.push(`# Gigvora Release Digest – ${versionLabel}`);
  lines.push('');
  lines.push(`- Generated: ${new Date(suite.generatedAt).toISOString()}`);
  lines.push(`- Pipeline status: ${suite.pipelines.stats.overallStatus.toUpperCase()}`);
  lines.push(`- Release approvals: ${release.approvalCount ?? 0}`);
  lines.push('');

  lines.push('## Release Summary');
  lines.push(release.summary ?? 'No release summary supplied.');
  lines.push('');

  if (Array.isArray(release.highlights) && release.highlights.length) {
    lines.push('### Highlights');
    release.highlights.forEach((highlight) => {
      lines.push(`- ${highlight}`);
    });
    lines.push('');
  }

  if (Array.isArray(release.qaApprovals) && release.qaApprovals.length) {
    lines.push('### QA & Compliance Approvals');
    release.qaApprovals.forEach((approval) => {
      const label = `${approval.team ?? 'Team'} – ${approval.approver ?? 'Approver'}`;
      lines.push(`- ${label} (${toDateString(approval.signedOffAt)})`);
    });
    lines.push('');
  }

  if (Array.isArray(release.communications) && release.communications.length) {
    lines.push('### Communications Timeline');
    release.communications.forEach((item) => {
      lines.push(`- ${item.channel ?? 'channel'} → ${toDateString(item.publishedAt)}`);
    });
    lines.push('');
  }

  lines.push('## Build Pipelines');
  lines.push(createPipelineTable(pipelines));
  lines.push('');

  lines.push('## Upgrade Cohorts');
  lines.push(createRolloutTable(cohorts));
  lines.push('');

  if (suite.health?.blockers?.length) {
    lines.push('## Action Items');
    suite.health.blockers.forEach((blocker) => {
      lines.push(`- ${blocker}`);
    });
    lines.push('');
  }

  lines.push('## Tooling');
  const toolchain = suite.pipelines.tooling ?? {};
  lines.push(`- Orchestrator: \`${toolchain.orchestratorScript ?? 'n/a'}\``);
  lines.push(`- Release digest script: \`${toolchain.releaseDigestScript ?? 'n/a'}\``);
  if (Array.isArray(toolchain.dashboards)) {
    toolchain.dashboards.forEach((dashboard) => {
      lines.push(`- Dashboard: [${dashboard.name}](${dashboard.url})`);
    });
  }

  return lines.join('\n');
}

async function main() {
  const suite = releaseEngineeringService.getOperationsSuite();
  const markdown = buildMarkdown(suite);
  const versionSlug = suite.releases.latest?.version
    ? suite.releases.latest.version.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    : 'draft';
  const fileName = `${toDateString(suite.generatedAt)}-${versionSlug}-release-digest.md`;
  const outputDir = path.resolve(rootDir, 'update_docs', 'release_notes');
  const outputPath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, `${markdown}\n`, 'utf8');

  console.log(`Release digest written to ${path.relative(rootDir, outputPath)}`);
}

main().catch((error) => {
  console.error('Failed to build release digest', error);
  process.exit(1);
});
