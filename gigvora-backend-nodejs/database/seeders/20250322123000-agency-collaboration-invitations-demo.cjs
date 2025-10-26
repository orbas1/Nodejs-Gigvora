'use strict';

const { QueryTypes, Op } = require('sequelize');

const AGENCY_WORKSPACE_SLUG = 'networking-agency-concierge';
const AGENCY_OWNER_EMAIL = 'agent.sloane@gigvora.example';
const HASHED_PASSWORD = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

const FREELANCERS = [
  { email: 'ops.mira@gigvora.example', firstName: 'Mira', lastName: 'Takeda', userType: 'freelancer' },
  { email: 'product.lucas@gigvora.example', firstName: 'Lucas', lastName: 'Nguyen', userType: 'freelancer' },
  { email: 'growth.elena@gigvora.example', firstName: 'Elena', lastName: 'Campos', userType: 'freelancer' },
];

async function ensureUser(queryInterface, transaction, { email, firstName, lastName, userType }) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );
  if (existing?.id) {
    return existing.id;
  }
  const now = new Date();
  await queryInterface.bulkInsert(
    'users',
    [
      {
        firstName,
        lastName,
        email,
        password: HASHED_PASSWORD,
        userType: userType ?? 'freelancer',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { type: QueryTypes.SELECT, transaction, replacements: { email } },
  );
  return inserted?.id;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      let ownerId = null;
      const [ownerRow] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: AGENCY_OWNER_EMAIL } },
      );
      ownerId = ownerRow?.id ?? null;
      if (!ownerId) {
        ownerId = await ensureUser(queryInterface, transaction, {
          email: AGENCY_OWNER_EMAIL,
          firstName: 'Sloane',
          lastName: 'Parker',
          userType: 'agency',
        });
      }
      if (!ownerId) {
        throw new Error('Unable to seed agency invitations demo: owner account missing.');
      }

      let workspaceId = null;
      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: AGENCY_WORKSPACE_SLUG } },
      );
      workspaceId = workspaceRow?.id ?? null;
      if (!workspaceId) {
        await queryInterface.bulkInsert(
          'provider_workspaces',
          [
            {
              ownerId,
              name: 'Networking Agency Concierge',
              slug: AGENCY_WORKSPACE_SLUG,
              type: 'agency',
              timezone: 'America/New_York',
              defaultCurrency: 'USD',
              intakeEmail: 'concierge@gigvora.example',
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedWorkspace] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements: { slug: AGENCY_WORKSPACE_SLUG } },
        );
        workspaceId = insertedWorkspace?.id ?? null;
      }
      if (!workspaceId) {
        throw new Error('Unable to seed agency invitations demo: workspace missing.');
      }

      const freelancerIds = [];
      for (const freelancer of FREELANCERS) {
        const id = await ensureUser(queryInterface, transaction, freelancer);
        if (!id) {
          throw new Error(`Failed to create demo freelancer ${freelancer.email}`);
        }
        freelancerIds.push(id);
      }

      await queryInterface.bulkDelete(
        'agency_collaboration_invitations',
        {
          agencyWorkspaceId: workspaceId,
          message: { [Op.like]: 'Networking invitations demo%' },
        },
        { transaction },
      );

      const invitations = [
        {
          freelancerId: freelancerIds[0],
          agencyWorkspaceId: workspaceId,
          sentById: ownerId,
          status: 'pending',
          roleTitle: 'Fractional COO',
          engagementType: 'retainer',
          proposedRetainer: 6500,
          currency: 'USD',
          responseDueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
          message: 'Networking invitations demo • Lead the venture studio ops pod and stabilise sponsor hand-offs.',
        },
        {
          freelancerId: freelancerIds[1],
          agencyWorkspaceId: workspaceId,
          sentById: ownerId,
          status: 'accepted',
          roleTitle: 'Principal Product Advisor',
          engagementType: 'project',
          proposedRetainer: 4200,
          currency: 'USD',
          responseDueAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
          respondedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
          message: 'Networking invitations demo • Guide roadmap for our corporate innovation lab pilot.',
        },
        {
          freelancerId: freelancerIds[2],
          agencyWorkspaceId: workspaceId,
          sentById: ownerId,
          status: 'withdrawn',
          roleTitle: 'Growth Strategist',
          engagementType: 'embedded',
          proposedRetainer: 5100,
          currency: 'USD',
          responseDueAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
          respondedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
          message: 'Networking invitations demo • Hold weekly demand-gen reviews while we staff permanent lead.',
        },
      ].map((invitation) => ({
        ...invitation,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('agency_collaboration_invitations', invitations, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'agency_collaboration_invitations',
        { message: { [Op.like]: 'Networking invitations demo%' } },
        { transaction },
      );
    });
  },
};
