'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'release_pipelines',
        [
          {
            key: '2025-q2-network-elevation',
            name: 'Q2 Network Elevation',
            version: '2025.05',
            summary:
              'Incrementally graduate networking, messaging, and observability upgrades across pilot, canary, and global cohorts.',
            owner_name: 'Avery Collins',
            owner_email: 'avery.collins@gigvora.com',
            status: 'in_progress',
            is_active: true,
            active_phase_key: 'canary',
            started_at: new Date('2025-04-10T09:00:00Z'),
            target_release_at: new Date('2025-05-20T17:00:00Z'),
            release_notes_url: 'https://status.gigvora.com/releases/2025-q2-network-elevation',
            release_notes_ref: 'release-notes/2025-q2-network-elevation',
            metadata: {
              slackChannel: '#launch-q2-network',
              jiraEpic: 'OPS-4521',
            },
            created_at: new Date('2025-04-10T09:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
        ],
        { transaction },
      );

      const targetReleaseId = await queryInterface.rawSelect(
        'release_pipelines',
        {
          where: { key: '2025-q2-network-elevation' },
          transaction,
        },
        ['id'],
      );

      if (!targetReleaseId) {
        throw new Error('Failed to resolve seeded release pipeline identifier.');
      }

      await queryInterface.bulkInsert(
        'release_phases',
        [
          {
            release_id: targetReleaseId,
            key: 'plan',
            name: 'Planning & Approvals',
            summary: 'Finalize persona impact, runbooks, and sign-offs for change freeze.',
            owner_name: 'Jordan Patel',
            status: 'complete',
            coverage_percent: 100,
            order_index: 0,
            started_at: new Date('2025-03-28T15:00:00Z'),
            completed_at: new Date('2025-04-07T18:30:00Z'),
            created_at: new Date('2025-04-07T19:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'enablement',
            name: 'Enablement & Pilot',
            summary: 'Pilot training, support scripts, and stakeholder enablement sessions.',
            owner_name: 'Kai Mitchell',
            status: 'complete',
            coverage_percent: 100,
            order_index: 1,
            started_at: new Date('2025-04-08T10:00:00Z'),
            completed_at: new Date('2025-04-15T16:15:00Z'),
            created_at: new Date('2025-04-08T10:30:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'canary',
            name: 'Canary Cohorts',
            summary: 'Gradually expand to canary customers with expanded telemetry coverage.',
            owner_name: 'Morgan Liu',
            status: 'in_progress',
            coverage_percent: 42.5,
            order_index: 2,
            started_at: new Date('2025-04-16T09:00:00Z'),
            created_at: new Date('2025-04-16T09:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'global',
            name: 'Global Rollout',
            summary: 'Full rollout once canary stability and adoption targets land above thresholds.',
            owner_name: 'Avery Collins',
            status: 'pending',
            coverage_percent: 0,
            order_index: 3,
            created_at: new Date('2025-04-16T09:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'release_segments',
        [
          {
            release_id: targetReleaseId,
            key: 'operations',
            name: 'Operations Staff',
            summary: 'Internal operations teams validating workflow parity and uptime.',
            owner_name: 'Jordan Patel',
            status: 'complete',
            coverage_percent: 100,
            created_at: new Date('2025-04-12T09:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'enterprise',
            name: 'Enterprise Customers',
            summary: 'Enterprise canary accounts validating analytics and engagement flows.',
            owner_name: 'Morgan Liu',
            status: 'rolling_out',
            coverage_percent: 48.5,
            created_at: new Date('2025-04-16T09:30:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'freelancer',
            name: 'Freelancer Network',
            summary: 'Independent talent marketplace once support and playbooks are ready.',
            owner_name: 'Avery Collins',
            status: 'pending',
            coverage_percent: 12.5,
            created_at: new Date('2025-04-16T09:30:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'release_checklist_items',
        [
          {
            release_id: targetReleaseId,
            key: 'ux-approvals',
            name: 'Design & UX approvals',
            description: 'Design review sign-off including microcopy and accessibility validation.',
            owner_name: 'Naomi Rivera',
            status: 'complete',
            completed_at: new Date('2025-04-12T14:00:00Z'),
            created_at: new Date('2025-04-10T08:00:00Z'),
            updated_at: new Date('2025-04-12T14:30:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'support-playbooks',
            name: 'Support playbooks',
            description: 'Enable frontline support with updated investigation and escalation guides.',
            owner_name: 'Jordan Patel',
            status: 'in_progress',
            created_at: new Date('2025-04-15T10:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            key: 'ci-signed-off',
            name: 'CI signed off',
            description: 'Full stack CI orchestrator executes lint, test, build, and schema checks.',
            owner_name: 'Morgan Liu',
            status: 'attention',
            created_at: new Date('2025-04-18T07:30:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'release_monitors',
        [
          {
            release_id: targetReleaseId,
            monitor_key: 'api-latency',
            name: 'Platform API latency',
            description: 'Tracks p95 latency for messaging, feed, and profile APIs.',
            environment: 'production',
            status: 'passing',
            coverage_percent: 88.5,
            metrics: { p95Ms: 285, p99Ms: 490 },
            metadata: { datasource: 'prometheus', slo: 'p95 < 320ms' },
            last_sampled_at: new Date('2025-04-20T11:45:00Z'),
            created_at: new Date('2025-04-15T12:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
          {
            release_id: targetReleaseId,
            monitor_key: 'ci-full-stack',
            name: 'Full stack CI orchestrator',
            description: 'Aggregated status for lint/test/build/schema orchestration.',
            environment: 'ci',
            status: 'warning',
            coverage_percent: 62.5,
            metrics: {
              lastDurationMs: 182000,
              lastExitCode: 1,
            },
            metadata: { pipeline: 'full-stack-ci' },
            last_sampled_at: new Date('2025-04-20T11:50:00Z'),
            created_at: new Date('2025-04-18T11:00:00Z'),
            updated_at: new Date('2025-04-20T12:00:00Z'),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'release_pipeline_runs',
        [
          {
            release_id: targetReleaseId,
            pipeline_key: 'full-stack-ci',
            status: 'failed',
            started_at: new Date('2025-04-20T10:00:00Z'),
            completed_at: new Date('2025-04-20T10:03:02Z'),
            duration_ms: 182000,
            tasks: [
              { name: 'frontend:lint', title: 'Frontend lint', status: 'passed', durationMs: 22000, exitCode: 0 },
              { name: 'frontend:test', title: 'Frontend tests', status: 'failed', durationMs: 68000, exitCode: 1 },
              { name: 'backend:lint', title: 'Backend lint', status: 'passed', durationMs: 18000, exitCode: 0 },
              { name: 'backend:test', title: 'Backend tests', status: 'passed', durationMs: 54000, exitCode: 0 },
            ],
            metadata: { triggeredBy: 'ci@scheduler', commit: 'c5f6a2e' },
            created_at: new Date('2025-04-20T10:03:02Z'),
            updated_at: new Date('2025-04-20T10:03:02Z'),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'release_events',
        [
          {
            id: '5bf4f6ae-5141-4cf2-8f21-6ccf2e3342c3',
            release_id: targetReleaseId,
            event_type: 'phase_status',
            resource_key: 'canary',
            status: 'in_progress',
            summary: 'Canary cohorts enabled for enterprise accounts.',
            actor_name: 'Morgan Liu',
            actor_role: 'Release Captain',
            payload: { coverage: 0.35 },
            occurred_at: new Date('2025-04-16T09:05:00Z'),
            created_at: new Date('2025-04-16T09:05:00Z'),
            updated_at: new Date('2025-04-16T09:05:00Z'),
          },
          {
            id: '9a8bd3d0-b19a-4f8b-8a3d-1f1cc78f7c56',
            release_id: targetReleaseId,
            event_type: 'pipeline_run',
            resource_key: 'full-stack-ci',
            status: 'failed',
            summary: 'Full stack CI orchestrator flagged frontend tests.',
            actor_name: 'CI Scheduler',
            actor_role: 'automation',
            payload: { failingTasks: ['frontend:test'] },
            occurred_at: new Date('2025-04-20T10:03:02Z'),
            created_at: new Date('2025-04-20T10:03:02Z'),
            updated_at: new Date('2025-04-20T10:03:02Z'),
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('release_events', null, { transaction });
      await queryInterface.bulkDelete('release_pipeline_runs', null, { transaction });
      await queryInterface.bulkDelete('release_monitors', null, { transaction });
      await queryInterface.bulkDelete('release_checklist_items', null, { transaction });
      await queryInterface.bulkDelete('release_segments', null, { transaction });
      await queryInterface.bulkDelete('release_phases', null, { transaction });
      await queryInterface.bulkDelete('release_pipelines', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
