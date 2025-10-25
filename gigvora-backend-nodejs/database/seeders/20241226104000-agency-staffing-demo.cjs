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
