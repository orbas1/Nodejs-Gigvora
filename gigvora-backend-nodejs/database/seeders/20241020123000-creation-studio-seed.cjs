'use strict';

const { QueryTypes, Op } = require('sequelize');

const workspaceSlug = 'creation-studio-demo';
const creationTitles = [
  'Demo: Senior Product Designer',
  'Demo: Workspace Automation Blueprint',
  'Demo: Founders & Talent Speed Networking',
];

async function findUserId(queryInterface, transaction, email) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return row?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const ownerId = await findUserId(queryInterface, transaction, 'mia@gigvora.com');
      if (!ownerId) {
        throw new Error('Creation studio seed requires mia@gigvora.com to exist.');
      }

      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: workspaceSlug },
        },
      );
      let workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) {
        await queryInterface.bulkInsert(
          'provider_workspaces',
          [
            {
              ownerId,
              name: 'Creation Studio Demo',
              slug: workspaceSlug,
              type: 'company',
              timezone: 'America/New_York',
              defaultCurrency: 'USD',
              intakeEmail: 'creation-studio-demo@gigvora.example',
              isActive: true,
              settings: { seed: 'creation-studio-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedWorkspace] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: workspaceSlug },
          },
        );
        workspaceId = insertedWorkspace?.id ?? null;
      }

      if (!workspaceId) {
        throw new Error('Unable to resolve creation studio workspace.');
      }

      const items = [
        {
          type: 'job',
          title: creationTitles[0],
          headline: 'Lead cross-functional squads to reimagine Gigvora dashboards.',
          summary: 'Own discovery to delivery for dashboard experiences with product, research, and analytics.',
          status: 'published',
          visibility: 'public',
          category: 'Design',
          location_label: 'Hybrid · Berlin, Germany',
          location_mode: 'hybrid',
          target_audience: 'Seasoned product designers with marketplace experience',
          launch_at: new Date('2024-10-01T09:00:00Z'),
          published_at: new Date('2024-10-02T08:30:00Z'),
          hero_image_url: 'https://cdn.gigvora.example.com/assets/design-lead.jpg',
          tags: ['design', 'product', 'leadership'],
          settings: { employmentType: 'full_time', hiringManager: 'Avery Chen' },
          budget_amount: 165000,
          budget_currency: 'EUR',
          compensation_min: 150000,
          compensation_max: 180000,
          compensation_currency: 'EUR',
          commitment_hours: 40,
          remote_eligible: true,
        },
        {
          type: 'project',
          title: creationTitles[1],
          headline: 'Launch a scoped automation project for HR teams adopting Gigvora.',
          summary: 'Six-week automation accelerator mapping onboarding signals to workflow orchestration.',
          status: 'scheduled',
          visibility: 'workspace',
          category: 'Automation',
          location_label: 'Remote · Global',
          location_mode: 'remote',
          target_audience: 'Change enablement and RevOps champions',
          launch_at: new Date('2024-10-18T15:00:00Z'),
          publish_at: new Date('2024-10-17T13:00:00Z'),
          hero_image_url: 'https://cdn.gigvora.example.com/assets/automation-blueprint.png',
          tags: ['automation', 'workspace', 'launchpad'],
          settings: {
            deliverables: 'Automation workbook, enablement workshops, reporting pack',
            mentorLead: 'Zuri Patel',
          },
          budget_amount: 24000,
          budget_currency: 'USD',
          duration_weeks: 6,
          commitment_hours: 10,
          remote_eligible: true,
        },
        {
          type: 'networking_session',
          title: creationTitles[2],
          headline: 'Match founders with recruiting leaders for rapid ideation.',
          summary: '45-minute networking session with rotating breakouts and digital business card swap.',
          status: 'draft',
          visibility: 'workspace',
          category: 'Community',
          location_label: 'Virtual',
          location_mode: 'remote',
          target_audience: 'Founders and recruiting leaders',
          launch_at: new Date('2024-11-05T17:00:00Z'),
          hero_image_url: 'https://cdn.gigvora.example.com/assets/networking-session.jpg',
          tags: ['networking', 'community', 'talent'],
          settings: { sessionFormat: 'virtual', capacity: 60, rotationMinutes: 8 },
          commitment_hours: 2,
          remote_eligible: true,
        },
      ];

      for (const item of items) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM creation_studio_items WHERE workspace_id = :workspaceId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, title: item.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'creation_studio_items',
          [
            {
              workspace_id: workspaceId,
              owner_id: ownerId,
              created_by_id: ownerId,
              updated_by_id: ownerId,
              ...item,
              metadata: { seed: 'creation-studio-demo' },
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: workspaceSlug },
        },
      );
      const workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) return;

      await queryInterface.bulkDelete(
        'creation_studio_items',
        { workspace_id: workspaceId, title: { [Op.in]: creationTitles } },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'provider_workspaces',
        { id: workspaceId, slug: workspaceSlug },
        { transaction },
      );
    });
  },
};
