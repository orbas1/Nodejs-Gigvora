'use strict';

const { randomUUID } = require('node:crypto');

const PROJECT_OWNER_ID = 9001;

const ensureProject = async (queryInterface, payload, transaction) => {
  const { title } = payload;
  const where = { owner_id: payload.owner_id, title };
  const existingId = await queryInterface.rawSelect(
    'pgm_projects',
    { where, transaction },
    ['id'],
  );

  if (existingId) {
    return existingId;
  }

  await queryInterface.bulkInsert('pgm_projects', [payload], { transaction });
  return await queryInterface.rawSelect('pgm_projects', { where, transaction }, ['id']);
};

const ensureAutoMatch = async (queryInterface, payload, transaction) => {
  const where = { project_id: payload.project_id, freelancer_id: payload.freelancer_id };
  const existingId = await queryInterface.rawSelect(
    'pgm_project_automatch_freelancers',
    { where, transaction },
    ['id'],
  );

  if (existingId) {
    return existingId;
  }

  await queryInterface.bulkInsert('pgm_project_automatch_freelancers', [payload], { transaction });
  return await queryInterface.rawSelect('pgm_project_automatch_freelancers', { where, transaction }, ['id']);
};

const ensureWorkspace = async (queryInterface, payload, transaction) => {
  const where = { project_id: payload.project_id };
  const existingId = await queryInterface.rawSelect('pgm_project_workspaces', { where, transaction }, ['id']);

  if (existingId) {
    await queryInterface.bulkUpdate('pgm_project_workspaces', payload, where, { transaction });
    return existingId;
  }

  await queryInterface.bulkInsert('pgm_project_workspaces', [payload], { transaction });
  return await queryInterface.rawSelect('pgm_project_workspaces', { where, transaction }, ['id']);
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();

      const openProjectMetadata = {
        staffingAudit: [
          {
            id: randomUUID(),
            action: 'project_created',
            actorId: 1201,
            occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            metadata: { title: 'Global Creative Retainer' },
          },
          {
            id: randomUUID(),
            action: 'auto_match_settings_updated',
            actorId: 1202,
            occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            metadata: { enabled: true, budgetMin: 5000, skillsCount: 3 },
          },
        ],
      };

      const openProjectId = await ensureProject(
        queryInterface,
        {
          owner_id: PROJECT_OWNER_ID,
          title: 'Global Creative Retainer',
          description: 'Coordinate creative production across regions with weekly performance checkpoints.',
          category: 'Marketing Operations',
          skills: JSON.stringify(['brand strategy', 'campaign ops', 'analytics']),
          duration_weeks: 12,
          status: 'in_progress',
          lifecycle_state: 'open',
          start_date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          due_date: new Date(now.getFullYear(), now.getMonth() + 2, 15),
          budget_currency: 'USD',
          budget_allocated: 24000,
          budget_spent: 8200,
          auto_match_enabled: true,
          auto_match_accept_enabled: true,
          auto_match_reject_enabled: false,
          auto_match_budget_min: 5000,
          auto_match_budget_max: 15000,
          auto_match_weekly_hours_min: 20,
          auto_match_weekly_hours_max: 40,
          auto_match_duration_weeks_min: 8,
          auto_match_duration_weeks_max: 16,
          auto_match_skills: JSON.stringify(['brand strategy', 'creative direction', 'analytics']),
          auto_match_notes: 'Prioritise storytellers with global campaign experience.',
          auto_match_updated_by: 1202,
          metadata: JSON.stringify(openProjectMetadata),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      await ensureWorkspace(
        queryInterface,
        {
          project_id: openProjectId,
          status: 'active',
          progress_percent: 42.5,
          risk_level: 'medium',
          health_score: 84.5,
          velocity_score: 76.8,
          client_satisfaction: 4.2,
          automation_coverage: 68.4,
          billing_status: 'on_track',
          next_milestone: 'Regional launch playbooks published',
          next_milestone_due_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
          last_activity_at: now,
          updated_by_id: 1202,
          notes: 'Automation rollout pacing reviewed weekly by program office.',
          metrics_snapshot: JSON.stringify({
            budget: { allocated: 24000, spent: 8200, forecast: 21800 },
            automation: { enabledFlows: 8, backlog: 3 },
            staffing: { confirmed: 4, openRoles: 1 },
            quality: { nps: 53, qaFindings: 2 },
          }),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      const closedProjectMetadata = {
        staffingAudit: [
          {
            id: randomUUID(),
            action: 'project_created',
            actorId: 1310,
            occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90).toISOString(),
            metadata: { title: 'Design System Upgrade' },
          },
          {
            id: randomUUID(),
            action: 'project_completed',
            actorId: 1310,
            occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            metadata: { deliveryNotes: 'Shipped ahead of schedule' },
          },
        ],
      };

      const closedProjectId = await ensureProject(
        queryInterface,
        {
          owner_id: PROJECT_OWNER_ID,
          title: 'Design System Upgrade',
          description: 'Refresh enterprise design system tokens and component documentation.',
          category: 'Product Design',
          skills: JSON.stringify(['design systems', 'documentation']),
          duration_weeks: 10,
          status: 'completed',
          lifecycle_state: 'closed',
          start_date: new Date(now.getFullYear(), now.getMonth() - 4, 1),
          due_date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
          budget_currency: 'USD',
          budget_allocated: 18000,
          budget_spent: 17950,
          auto_match_enabled: false,
          auto_match_accept_enabled: false,
          auto_match_reject_enabled: false,
          auto_match_skills: JSON.stringify(['design systems', 'ui libraries']),
          metadata: JSON.stringify(closedProjectMetadata),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      await ensureWorkspace(
        queryInterface,
        {
          project_id: closedProjectId,
          status: 'completed',
          progress_percent: 100,
          risk_level: 'low',
          health_score: 91.2,
          velocity_score: 88.4,
          client_satisfaction: 4.7,
          automation_coverage: 72.1,
          billing_status: 'closed',
          next_milestone: 'Post-launch retrospective',
          next_milestone_due_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          last_activity_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          updated_by_id: 1310,
          notes: 'Retrospective completed with stakeholder approvals archived.',
          metrics_snapshot: JSON.stringify({
            budget: { allocated: 18000, spent: 17950, forecast: 18000 },
            automation: { enabledFlows: 5, backlog: 0 },
            staffing: { confirmed: 5, openRoles: 0 },
            quality: { nps: 64, qaFindings: 0 },
          }),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      await ensureAutoMatch(
        queryInterface,
        {
          project_id: openProjectId,
          freelancer_id: 4101,
          freelancer_name: 'Jamie Fox',
          freelancer_role: 'Art Director',
          score: 94.5,
          auto_match_enabled: true,
          status: 'accepted',
          notes: 'Leading campaign rollouts for EMEA markets.',
          metadata: JSON.stringify({ sourcedBy: 'auto-match', portfolio: 'behance/jamie-fox' }),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      await ensureAutoMatch(
        queryInterface,
        {
          project_id: openProjectId,
          freelancer_id: 4102,
          freelancer_name: 'Priya Desai',
          freelancer_role: 'Growth Strategist',
          score: 88.1,
          auto_match_enabled: true,
          status: 'pending',
          notes: 'Awaiting availability confirmation for APAC market expansion.',
          metadata: JSON.stringify({ sourcedBy: 'talent pool' }),
          created_at: now,
          updated_at: now,
        },
        transaction,
      );

      await ensureAutoMatch(
        queryInterface,
        {
          project_id: closedProjectId,
          freelancer_id: 4201,
          freelancer_name: 'Luis Moreno',
          freelancer_role: 'Design Systems Lead',
          score: 92.7,
          auto_match_enabled: false,
          status: 'accepted',
          notes: 'Completed all deliverables and handed off documentation.',
          metadata: JSON.stringify({ completionScore: 9.6 }),
          created_at: now,
          updated_at: now,
        },
        transaction,
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
      const projectTitles = ['Global Creative Retainer', 'Design System Upgrade'];

      const projectIds = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_projects WHERE owner_id = :ownerId AND title IN (:titles)',
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { ownerId: PROJECT_OWNER_ID, titles: projectTitles },
        },
      );

      if (projectIds.length) {
        const ids = projectIds.map((row) => row.id);
        await queryInterface.bulkDelete('pgm_project_workspaces', { project_id: ids }, { transaction });
        await queryInterface.bulkDelete('pgm_project_automatch_freelancers', { project_id: ids }, { transaction });
        await queryInterface.bulkDelete('pgm_projects', { id: ids }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
