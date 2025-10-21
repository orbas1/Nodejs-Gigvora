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
          location: 'Hybrid · Berlin, Germany',
          targetAudience: 'Seasoned product designers with marketplace experience',
          launchDate: new Date('2024-10-01T09:00:00Z'),
          publishedAt: new Date('2024-10-02T08:30:00Z'),
          imageUrl: 'https://cdn.gigvora.example.com/assets/design-lead.jpg',
          tags: ['design', 'product', 'leadership'],
          settings: { employmentType: 'full_time', hiringManager: 'Avery Chen' },
          budgetAmount: 165000,
          budgetCurrency: 'EUR',
          compensationMin: 150000,
          compensationMax: 180000,
          compensationCurrency: 'EUR',
          commitmentHours: 40,
          remoteEligible: true,
        },
        {
          type: 'project',
          title: creationTitles[1],
          headline: 'Launch a scoped automation project for HR teams adopting Gigvora.',
          summary: 'Six-week automation accelerator mapping onboarding signals to workflow orchestration.',
          status: 'scheduled',
          visibility: 'workspace',
          category: 'Automation',
          location: 'Remote · Global',
          targetAudience: 'Change enablement and RevOps champions',
          launchDate: new Date('2024-10-18T15:00:00Z'),
          publishedAt: new Date('2024-10-17T13:00:00Z'),
          imageUrl: 'https://cdn.gigvora.example.com/assets/automation-blueprint.png',
          tags: ['automation', 'workspace', 'launchpad'],
          settings: {
            deliverables: 'Automation workbook, enablement workshops, reporting pack',
            mentorLead: 'Zuri Patel',
          },
          budgetAmount: 24000,
          budgetCurrency: 'USD',
          durationWeeks: 6,
          commitmentHours: 10,
          remoteEligible: true,
        },
        {
          type: 'networking_session',
          title: creationTitles[2],
          headline: 'Match founders with recruiting leaders for rapid ideation.',
          summary: '45-minute networking session with rotating breakouts and digital business card swap.',
          status: 'draft',
          visibility: 'workspace',
          category: 'Community',
          location: 'Virtual',
          targetAudience: 'Founders and recruiting leaders',
          launchDate: new Date('2024-11-05T17:00:00Z'),
          imageUrl: 'https://cdn.gigvora.example.com/assets/networking-session.jpg',
          tags: ['networking', 'community', 'talent'],
          settings: { sessionFormat: 'virtual', capacity: 60, rotationMinutes: 8 },
          commitmentHours: 2,
          remoteEligible: true,
        },
      ];

      for (const item of items) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM creation_studio_items WHERE workspaceId = :workspaceId AND title = :title LIMIT 1',
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
              workspaceId,
              createdById: ownerId,
              ...item,
              metadata: { seed: 'creation-studio-demo' },
              createdAt: now,
              updatedAt: now,
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
        { workspaceId, title: { [Op.in]: creationTitles } },
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
