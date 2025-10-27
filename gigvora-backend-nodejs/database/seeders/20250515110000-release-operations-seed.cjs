'use strict';

const { randomUUID } = require('node:crypto');
const { QueryTypes, Op } = require('sequelize');

const VERSION = '2025.04.15';

const PIPELINE_STEPS = [
  {
    id: 'frontend-quality',
    name: 'Frontend quality gates',
    status: 'passed',
    durationMs: 315000,
    commands: [
      {
        id: 'frontend-lint',
        label: 'npm run lint',
        command: 'npm run lint',
        workingDirectory: 'gigvora-frontend-reactjs',
        status: 'passed',
        durationMs: 64000,
      },
      {
        id: 'frontend-test',
        label: 'npm run test -- --runInBand',
        command: 'npm run test -- --runInBand',
        workingDirectory: 'gigvora-frontend-reactjs',
        status: 'passed',
        durationMs: 156000,
      },
      {
        id: 'frontend-build',
        label: 'npm run build',
        command: 'npm run build',
        workingDirectory: 'gigvora-frontend-reactjs',
        status: 'passed',
        durationMs: 95000,
      },
    ],
  },
  {
    id: 'backend-quality',
    name: 'Backend quality gates',
    status: 'passed',
    durationMs: 246000,
    commands: [
      {
        id: 'backend-lint',
        label: 'npm run lint',
        command: 'npm run lint',
        workingDirectory: 'gigvora-backend-nodejs',
        status: 'passed',
        durationMs: 52000,
      },
      {
        id: 'backend-test',
        label: 'npm test -- --runInBand',
        command: 'npm test -- --runInBand',
        workingDirectory: 'gigvora-backend-nodejs',
        status: 'passed',
        durationMs: 194000,
      },
    ],
  },
  {
    id: 'shared-contracts',
    name: 'Shared contracts verification',
    status: 'passed',
    durationMs: 82000,
    commands: [
      {
        id: 'shared-test',
        label: 'npm run test',
        command: 'npm run test',
        workingDirectory: 'shared-contracts',
        status: 'passed',
        durationMs: 82000,
      },
    ],
  },
  {
    id: 'calendar-stub',
    name: 'Calendar stub verification',
    status: 'passed',
    durationMs: 56000,
    commands: [
      {
        id: 'calendar-test',
        label: 'npm run test',
        command: 'npm run test',
        workingDirectory: 'calendar_stub',
        status: 'passed',
        durationMs: 56000,
      },
    ],
  },
];

const QUALITY_GATES = [
  { name: 'Frontend quality', status: 'pass', evidence: 'lint, unit, and build pipelines cleared for premium shell' },
  { name: 'Backend reliability', status: 'pass', evidence: 'lint + Jest suite across reliability and services modules' },
  { name: 'Shared contracts', status: 'pass', evidence: 'shared-contracts schema diffed and tests passed' },
  { name: 'Calendar parity', status: 'pass', evidence: 'calendar stub sync verified for release' },
];

const COHORTS = [
  {
    name: 'Internal champions',
    targetPercentage: 0.05,
    currentPercentage: 0.05,
    errorBudgetRemaining: 0.99,
    health: 'healthy',
    notes: ['Feature toggled for platform leads and reliability guild.'],
  },
  {
    name: 'Mentor beta',
    targetPercentage: 0.25,
    currentPercentage: 0.21,
    errorBudgetRemaining: 0.97,
    health: 'healthy',
    notes: ['Monitoring mentorship activation funnels and release sentiment.'],
  },
  {
    name: 'Agency rollout',
    targetPercentage: 0.6,
    currentPercentage: 0.46,
    errorBudgetRemaining: 0.94,
    health: 'healthy',
    notes: ['Tracking high-volume agencies and partner workflows.'],
  },
  {
    name: 'Global enablement',
    targetPercentage: 1,
    currentPercentage: 0.62,
    errorBudgetRemaining: 0.9,
    health: 'watch',
    notes: ['Held until telemetry clears guardrails for all personas.'],
  },
];

const SNAPSHOT = {
  version: VERSION,
  status: 'monitoring',
  generatedAt: new Date('2025-04-15T10:05:00.000Z'),
  releaseNotesPath: 'update_docs/release-notes/2025.04.15.md',
  pipeline: {
    id: 'web-release',
    name: 'Web Release Pipeline',
    status: 'passed',
    finishedAt: new Date('2025-04-15T10:05:00.000Z'),
    durationMs: 699000,
    steps: PIPELINE_STEPS,
  },
  quality: { status: 'pass', gates: QUALITY_GATES },
  telemetry: {
    errorBudgetRemaining: 0.96,
    p0Incidents: 0,
    latencyP99Ms: 138,
    regressionAlerts: [],
  },
  cohorts: COHORTS,
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM release_rollouts WHERE version = :version LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { version: SNAPSHOT.version } },
      );
      if (existing?.id) {
        return;
      }

      const now = new Date();
      const rolloutId = randomUUID();

      await queryInterface.bulkInsert(
        'release_rollouts',
        [
          {
            id: rolloutId,
            version: SNAPSHOT.version,
            status: SNAPSHOT.status,
            generated_at: SNAPSHOT.generatedAt,
            release_notes_path: SNAPSHOT.releaseNotesPath,
            pipeline_id: SNAPSHOT.pipeline.id,
            pipeline_name: SNAPSHOT.pipeline.name,
            pipeline_status: SNAPSHOT.pipeline.status,
            pipeline_finished_at: SNAPSHOT.pipeline.finishedAt,
            pipeline_duration_ms: SNAPSHOT.pipeline.durationMs,
            quality_status: SNAPSHOT.quality.status,
            telemetry_error_budget_remaining: SNAPSHOT.telemetry.errorBudgetRemaining,
            telemetry_p0_incidents: SNAPSHOT.telemetry.p0Incidents,
            telemetry_latency_p99_ms: SNAPSHOT.telemetry.latencyP99Ms,
            telemetry_regression_alerts: JSON.stringify(SNAPSHOT.telemetry.regressionAlerts ?? []),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      if (SNAPSHOT.pipeline.steps.length) {
        await queryInterface.bulkInsert(
          'release_rollout_pipeline_steps',
          SNAPSHOT.pipeline.steps.map((step, index) => ({
            id: randomUUID(),
            rollout_id: rolloutId,
            sequence: index,
            step_id: step.id,
            name: step.name,
            status: step.status,
            duration_ms: step.durationMs,
            commands: JSON.stringify(step.commands ?? []),
            createdAt: now,
            updatedAt: now,
          })),
          { transaction },
        );
      }

      if (SNAPSHOT.quality.gates.length) {
        await queryInterface.bulkInsert(
          'release_rollout_quality_gates',
          SNAPSHOT.quality.gates.map((gate, index) => ({
            id: randomUUID(),
            rollout_id: rolloutId,
            sequence: index,
            name: gate.name,
            status: gate.status,
            evidence: gate.evidence,
            createdAt: now,
            updatedAt: now,
          })),
          { transaction },
        );
      }

      if (SNAPSHOT.cohorts.length) {
        await queryInterface.bulkInsert(
          'release_rollout_cohorts',
          SNAPSHOT.cohorts.map((cohort, index) => ({
            id: randomUUID(),
            rollout_id: rolloutId,
            sequence: index,
            name: cohort.name,
            target_percentage: cohort.targetPercentage,
            current_percentage: cohort.currentPercentage,
            error_budget_remaining: cohort.errorBudgetRemaining,
            health: cohort.health,
            notes: JSON.stringify(cohort.notes ?? []),
            createdAt: now,
            updatedAt: now,
          })),
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('release_rollouts', { version: { [Op.eq]: VERSION } }, {});
  },
};
