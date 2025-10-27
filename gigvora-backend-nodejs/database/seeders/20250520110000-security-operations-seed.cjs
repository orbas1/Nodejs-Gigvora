'use strict';

const POSTURE_TABLE = 'security_posture_snapshots';
const ALERTS_TABLE = 'security_alerts';
const INCIDENTS_TABLE = 'security_incidents';
const PLAYBOOKS_TABLE = 'security_playbooks';
const PLAYBOOK_RUNS_TABLE = 'security_playbook_runs';
const THREAT_SWEEPS_TABLE = 'security_threat_sweeps';

function withTimestamps(row, date = new Date()) {
  return {
    ...row,
    created_at: date,
    updated_at: date,
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const [existingPosture] = await queryInterface.sequelize.query(
        `SELECT id FROM ${POSTURE_TABLE} ORDER BY captured_at DESC LIMIT 1`,
        { transaction },
      );

      if (!existingPosture.length) {
        await queryInterface.bulkInsert(
          POSTURE_TABLE,
          [
            withTimestamps(
              {
                captured_at: now,
                attack_surface_score: 82.4,
                attack_surface_delta: -4.1,
                signals: [
                  'Zero-trust segmentation enforced across production workloads.',
                  'Endpoint patch compliance maintained above 98% for 14 consecutive days.',
                  'No privileged access escalations detected in the last 48 hours.',
                ],
                blocked_intrusions: 1284,
                quarantined_assets: 4,
                high_risk_vulnerabilities: 2,
                mean_time_to_respond_minutes: 7,
                patch_backlog: 7,
                patch_backlog_delta: -3,
                next_patch_window: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                notes: {
                  authoredBy: 'security-ops',
                  runbook: 'zero-day-containment',
                },
              },
              now,
            ),
          ],
          { transaction },
        );
      }

      const [existingAlerts] = await queryInterface.sequelize.query(
        `SELECT alert_key FROM ${ALERTS_TABLE}`,
        { transaction },
      );
      const knownAlertKeys = new Set(existingAlerts.map((row) => row.alert_key));

      const alertRows = [
        withTimestamps({
          alert_key: 'alert-critical-203',
          severity: 'critical',
          category: 'Runtime anomaly',
          source: 'Container EDR',
          asset: 'api-gateway-prod-02',
          location: 'us-east-1',
          recommended_action: 'Isolate pod and trigger credential rotation.',
          status: 'open',
          detected_at: new Date(now.getTime() - 45 * 60 * 1000),
          metadata: { runbook: 'runtime-anomaly-response', playbook: 'identity-takeover-response' },
        }, now),
        withTimestamps({
          alert_key: 'alert-high-587',
          severity: 'high',
          category: 'Credential stuffing',
          source: 'Login telemetry',
          asset: 'consumer-identity-edge',
          location: 'global',
          recommended_action: 'Throttle offending IP ranges and enforce step-up MFA.',
          status: 'investigating',
          detected_at: new Date(now.getTime() - 90 * 60 * 1000),
          metadata: { ipRanges: ['203.0.113.0/24', '198.51.100.0/25'] },
        }, now),
        withTimestamps({
          alert_key: 'alert-medium-912',
          severity: 'medium',
          category: 'Supply chain',
          source: 'Software composition analysis',
          asset: 'payments-service',
          location: 'eu-central-1',
          recommended_action: 'Apply patched dependency release and monitor rollout gates.',
          status: 'acknowledged',
          detected_at: new Date(now.getTime() - 18 * 60 * 60 * 1000),
          resolved_at: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          metadata: { component: 'openssl', advisory: 'CVE-2024-1217' },
        }, now),
      ].filter((row) => !knownAlertKeys.has(row.alert_key));

      if (alertRows.length) {
        await queryInterface.bulkInsert(ALERTS_TABLE, alertRows, { transaction });
      }

      const [existingIncidents] = await queryInterface.sequelize.query(
        `SELECT incident_key FROM ${INCIDENTS_TABLE}`,
        { transaction },
      );
      const knownIncidentKeys = new Set(existingIncidents.map((row) => row.incident_key));

      const incidentRows = [
        withTimestamps({
          incident_key: 'incident-441',
          title: 'Automated credential stuffing attempt blocked',
          severity: 'high',
          status: 'mitigated',
          owner: 'Security on-call',
          summary:
            'Adaptive MFA and edge rate limiting neutralised a burst targeting 2,431 accounts; no compromise detected.',
          opened_at: new Date(now.getTime() - 26 * 60 * 60 * 1000),
          resolved_at: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          metadata: { runbooks: ['identity-takeover-response'], impact: 'no customer impact' },
        }, now),
        withTimestamps({
          incident_key: 'incident-442',
          title: 'Endpoint malware quarantine',
          severity: 'medium',
          status: 'contained',
          owner: 'Endpoint response',
          summary: 'Gigvora Sentinel quarantined a compromised contractor laptop before lateral movement.',
          opened_at: new Date(now.getTime() - 36 * 60 * 60 * 1000),
          resolved_at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          metadata: { device: 'laptop-217', mitigations: ['credential reset', 'disk scan'] },
        }, now),
      ].filter((row) => !knownIncidentKeys.has(row.incident_key));

      if (incidentRows.length) {
        await queryInterface.bulkInsert(INCIDENTS_TABLE, incidentRows, { transaction });
      }

      const [existingPlaybooks] = await queryInterface.sequelize.query(
        `SELECT slug FROM ${PLAYBOOKS_TABLE}`,
        { transaction },
      );
      const knownPlaybookSlugs = new Set(existingPlaybooks.map((row) => row.slug));

      const playbookRows = [
        withTimestamps({
          slug: 'zero-day-containment',
          name: 'Zero-day containment',
          owner: 'Blue team',
          category: 'runtime',
          summary: 'Contains emerging zero-day exploits across runtime services within 15 minutes.',
          status: 'active',
          last_run_at: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          metadata: { slaMinutes: 15, tooling: ['snyk-monitor', 'sentinel'] },
        }, now),
        withTimestamps({
          slug: 'identity-takeover-response',
          name: 'Identity takeover response',
          owner: 'Identity ops',
          category: 'identity',
          summary: 'Responds to compromised identities with credential rotation and comms workflow.',
          status: 'active',
          last_run_at: new Date(now.getTime() - 9 * 60 * 60 * 1000),
          metadata: { slaMinutes: 20, notificationChannels: ['pager', 'slack'] },
        }, now),
      ].filter((row) => !knownPlaybookSlugs.has(row.slug));

      if (playbookRows.length) {
        await queryInterface.bulkInsert(PLAYBOOKS_TABLE, playbookRows, { transaction });
      }

      const [playbooks] = await queryInterface.sequelize.query(
        `SELECT id, slug FROM ${PLAYBOOKS_TABLE}`,
        { transaction },
      );
      const playbookIdBySlug = new Map(playbooks.map((row) => [row.slug, row.id]));

      const [existingRuns] = await queryInterface.sequelize.query(
        `SELECT playbook_id, executed_at FROM ${PLAYBOOK_RUNS_TABLE} WHERE executed_at >= :since`,
        {
          transaction,
          replacements: { since: new Date(now.getTime() - 72 * 60 * 60 * 1000) },
        },
      );

      const runSignature = new Set(
        existingRuns.map((row) => `${row.playbook_id}:${new Date(row.executed_at).toISOString()}`),
      );

      const runRows = [
        {
          playbookSlug: 'zero-day-containment',
          executedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
          executor: 'pager-duty:security-blue',
          result: 'completed',
          notes: 'Automated isolation completed, manual verification pending.',
        },
        {
          playbookSlug: 'identity-takeover-response',
          executedAt: new Date(now.getTime() - 13 * 60 * 60 * 1000),
          executor: 'oncall-identity',
          result: 'completed',
          notes: 'Targeted campaign neutralised via adaptive MFA escalation.',
        },
        {
          playbookSlug: 'identity-takeover-response',
          executedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          executor: 'automation',
          result: 'completed',
          notes: 'Triggered as part of credential stuffing mitigation.',
        },
      ]
        .map((run) => {
          const playbookId = playbookIdBySlug.get(run.playbookSlug);
          if (!playbookId) {
            return null;
          }
          const signature = `${playbookId}:${run.executedAt.toISOString()}`;
          if (runSignature.has(signature)) {
            return null;
          }
          runSignature.add(signature);
          return withTimestamps(
            {
              playbook_id: playbookId,
              executed_at: run.executedAt,
              executor: run.executor,
              result: run.result,
              notes: run.notes,
              metadata: { source: 'seed:init', playbook: run.playbookSlug },
            },
            now,
          );
        })
        .filter(Boolean);

      if (runRows.length) {
        await queryInterface.bulkInsert(PLAYBOOK_RUNS_TABLE, runRows, { transaction });
      }

      const [sweeps] = await queryInterface.sequelize.query(
        `SELECT id FROM ${THREAT_SWEEPS_TABLE} WHERE status IN ('queued','running')`,
        { transaction },
      );

      if (!sweeps.length) {
        await queryInterface.bulkInsert(
          THREAT_SWEEPS_TABLE,
          [
            withTimestamps(
              {
                requested_by: 1,
                sweep_type: 'runtime-anomaly',
                status: 'queued',
                payload: { reason: 'Initial seed sweep', scope: 'critical-services' },
              },
              now,
            ),
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(PLAYBOOK_RUNS_TABLE, null, { transaction });
      await queryInterface.bulkDelete(PLAYBOOKS_TABLE, null, { transaction });
      await queryInterface.bulkDelete(INCIDENTS_TABLE, null, { transaction });
      await queryInterface.bulkDelete(ALERTS_TABLE, null, { transaction });
      await queryInterface.bulkDelete(POSTURE_TABLE, null, { transaction });
      await queryInterface.bulkDelete(THREAT_SWEEPS_TABLE, null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
