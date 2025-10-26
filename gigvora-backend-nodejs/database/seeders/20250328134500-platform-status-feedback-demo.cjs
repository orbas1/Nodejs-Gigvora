'use strict';

const { QueryTypes } = require('sequelize');

const STATUS_TABLE = 'platform_status_reports';
const INCIDENT_TABLE = 'platform_status_incidents';
const MAINTENANCE_TABLE = 'platform_status_maintenances';
const PROMPTS_TABLE = 'platform_feedback_prompts';
const RESPONSES_TABLE = 'platform_feedback_responses';
const STATES_TABLE = 'platform_feedback_prompt_states';

const SEED_SOURCE = 'seed:platform-status-feedback-demo';

function now() {
  return new Date();
}

function serialiseJson(value) {
  return JSON.stringify(value ?? null);
}

async function ensurePrompt(queryInterface, transaction) {
  const slug = 'global-platform-health';
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${PROMPTS_TABLE} WHERE slug = :slug LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { slug } },
  );

  const payload = {
    slug,
    question: 'How is your Gigvora experience going right now?',
    description:
      'Quick pulse that keeps our product, design, and engineering teams in sync with premium operator sentiment.',
    status: 'active',
    channel: 'web',
    audiences: serialiseJson(['founder', 'operator', 'talent']),
    response_options: serialiseJson([
      { value: 'delighted', label: 'Delighted', emoji: '😍' },
      { value: 'happy', label: 'Happy', emoji: '😊' },
      { value: 'neutral', label: 'Neutral', emoji: '😐' },
      { value: 'frustrated', label: 'Frustrated', emoji: '😕' },
      { value: 'blocked', label: 'Blocked', emoji: '😣' },
    ]),
    cooldown_hours: 168,
    snooze_minutes: 240,
    auto_open_delay_seconds: 8,
    metadata: serialiseJson({ origin: SEED_SOURCE, priority: 'platform-health' }),
    active_from: now(),
    active_until: null,
    created_at: now(),
    updated_at: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(PROMPTS_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(PROMPTS_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${PROMPTS_TABLE} WHERE slug = :slug LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { slug } },
  );
  return created ? created.id : null;
}

async function ensureStatusReport(queryInterface, transaction) {
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${STATUS_TABLE} WHERE source = :source LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { source: SEED_SOURCE } },
  );

  const occurredAt = new Date(Date.now() - 10 * 60 * 1000);
  const payload = {
    severity: 'degraded',
    headline: 'Delayed analytics refresh for workspace intelligence',
    summary:
      'Our analytics pipeline is catching up after a warehouse re-balance. Workspace health tiles may show stale numbers for ~25 minutes.',
    status_page_url: 'https://status.gigvora.com/incidents/workspace-analytics-delays',
    source: SEED_SOURCE,
    occurred_at: occurredAt,
    created_at: now(),
    updated_at: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(STATUS_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(STATUS_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${STATUS_TABLE} WHERE source = :source LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { source: SEED_SOURCE } },
  );
  return created ? created.id : null;
}

async function upsertIncident(queryInterface, transaction, reportId) {
  const externalId = 'analytics-latency-ops';
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${INCIDENT_TABLE} WHERE report_id = :reportId AND external_id = :externalId LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { reportId, externalId } },
  );

  const payload = {
    report_id: reportId,
    external_id: externalId,
    title: 'Analytics latency impacting workspace dashboards',
    status: 'investigating',
    severity: 'degraded',
    impact_summary:
      'Workspace insight tiles and executive scorecards are delayed. Core contracting flows remain operational.',
    services: serialiseJson(['Analytics API', 'Workspace intelligence', 'Executive scorecard']),
    started_at: new Date(Date.now() - 20 * 60 * 1000),
    resolved_at: null,
    last_notified_at: now(),
    created_at: now(),
    updated_at: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(INCIDENT_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(INCIDENT_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${INCIDENT_TABLE} WHERE report_id = :reportId AND external_id = :externalId LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { reportId, externalId } },
  );
  return created ? created.id : null;
}

async function upsertMaintenance(queryInterface, transaction, reportId) {
  const externalId = 'billing-window-q2-refresh';
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM ${MAINTENANCE_TABLE} WHERE report_id = :reportId AND external_id = :externalId LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { reportId, externalId } },
  );

  const startsAt = new Date(Date.now() + 60 * 60 * 1000);
  const payload = {
    report_id: reportId,
    external_id: externalId,
    title: 'Billing ledger reconciliation window',
    status: 'scheduled',
    impact: 'minor',
    services: serialiseJson(['Billing', 'Payouts dashboard']),
    starts_at: startsAt,
    ends_at: new Date(startsAt.getTime() + 45 * 60 * 1000),
    impact_summary:
      'Scheduled reconciliation for billing ledgers. Expect a brief pause in new payout generation while statements reconcile.',
    created_at: now(),
    updated_at: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate(MAINTENANCE_TABLE, payload, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert(MAINTENANCE_TABLE, [payload], { transaction });
  const [created] = await queryInterface.sequelize.query(
    `SELECT id FROM ${MAINTENANCE_TABLE} WHERE report_id = :reportId AND external_id = :externalId LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { reportId, externalId } },
  );
  return created ? created.id : null;
}

async function seedDemoResponse(queryInterface, transaction, promptId) {
  if (!promptId) return;

  const fingerprint = 'seed-demo-ops';
  const [existingState] = await queryInterface.sequelize.query(
    `SELECT id FROM ${STATES_TABLE} WHERE prompt_id = :promptId AND session_fingerprint = :fingerprint LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { promptId, fingerprint } },
  );

  const statePayload = {
    prompt_id: promptId,
    user_id: null,
    session_fingerprint: fingerprint,
    snoozed_until: new Date(Date.now() + 6 * 60 * 60 * 1000),
    responded_at: now(),
    total_responses: 1,
    last_rating: 'happy',
    metadata: serialiseJson({ origin: SEED_SOURCE }),
    created_at: now(),
    updated_at: now(),
  };

  if (existingState) {
    await queryInterface.bulkUpdate(STATES_TABLE, statePayload, { id: existingState.id }, { transaction });
  } else {
    await queryInterface.bulkInsert(STATES_TABLE, [statePayload], { transaction });
  }

  const [existingResponse] = await queryInterface.sequelize.query(
    `SELECT id FROM ${RESPONSES_TABLE} WHERE prompt_id = :promptId AND session_fingerprint = :fingerprint LIMIT 1`,
    { transaction, type: QueryTypes.SELECT, replacements: { promptId, fingerprint } },
  );

  const responsePayload = {
    prompt_id: promptId,
    user_id: null,
    session_fingerprint: fingerprint,
    rating: 'happy',
    comment: 'Appreciate the transparency on analytics delays—everything else is humming.',
    metadata: serialiseJson({ origin: SEED_SOURCE, cohort: 'operations-observer' }),
    submitted_at: now(),
    created_at: now(),
    updated_at: now(),
  };

  if (existingResponse) {
    await queryInterface.bulkUpdate(RESPONSES_TABLE, responsePayload, { id: existingResponse.id }, { transaction });
  } else {
    await queryInterface.bulkInsert(RESPONSES_TABLE, [responsePayload], { transaction });
  }
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const promptId = await ensurePrompt(queryInterface, transaction);
      const reportId = await ensureStatusReport(queryInterface, transaction);
      if (reportId) {
        await upsertIncident(queryInterface, transaction, reportId);
        await upsertMaintenance(queryInterface, transaction, reportId);
      }
      if (promptId) {
        await seedDemoResponse(queryInterface, transaction, promptId);
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
      await queryInterface.bulkDelete(RESPONSES_TABLE, { session_fingerprint: 'seed-demo-ops' }, { transaction });
      await queryInterface.bulkDelete(STATES_TABLE, { session_fingerprint: 'seed-demo-ops' }, { transaction });
      await queryInterface.bulkDelete(PROMPTS_TABLE, { slug: 'global-platform-health' }, { transaction });
      await queryInterface.bulkDelete(STATUS_TABLE, { source: SEED_SOURCE }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
