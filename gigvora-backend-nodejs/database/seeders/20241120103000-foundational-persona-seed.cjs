'use strict';

const { QueryTypes, Op } = require('sequelize');
const { randomUUID } = require('crypto');

const userSeeds = [
  {
    email: 'lara.ops.demo@gigvora.com',
    firstName: 'Lara',
    lastName: 'Nguyen',
    userType: 'admin',
    address: 'Operations HQ, Remote',
    age: 38,
  },
  {
    email: 'jonah.freelancer.demo@gigvora.com',
    firstName: 'Jonah',
    lastName: 'Barrett',
    userType: 'freelancer',
    address: 'San Diego, USA',
    age: 32,
  },
  {
    email: 'marisol.agency.demo@gigvora.com',
    firstName: 'Marisol',
    lastName: 'Khan',
    userType: 'agency',
    address: 'Austin, USA',
    age: 37,
  },
  {
    email: 'haruto.company.demo@gigvora.com',
    firstName: 'Haruto',
    lastName: 'Sato',
    userType: 'company',
    address: 'Tokyo, Japan',
    age: 45,
  },
];

const feedPostContent = '[demo] Ops weekly: runtime health is green and hiring backlog cleared.';

const hashedPassword = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

async function findExistingUsers(queryInterface, transaction, emails) {
  const rows = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  return new Map(rows.map((row) => [row.email, row.id]));
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const emails = userSeeds.map((seed) => seed.email);
      const existingUsers = await findExistingUsers(queryInterface, transaction, emails);

      const toInsert = userSeeds
        .filter((seed) => !existingUsers.has(seed.email))
        .map((seed) => ({
          ...seed,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        }));

      if (toInsert.length) {
        await queryInterface.bulkInsert('users', toInsert, { transaction });
      }

      const userIds = await findExistingUsers(queryInterface, transaction, emails);

      const profileRecords = [
        {
          email: 'jonah.freelancer.demo@gigvora.com',
          headline: 'Design systems architect for multi-brand teams',
          bio: 'Leads discovery and prototypes inclusive design systems for SaaS rollouts.',
          skills: 'Design Systems, Figma, Accessibility',
          experience: '10 years scaling design teams at remote-first companies.',
          education: 'BFA, Human-Centred Design',
        },
      ];

      for (const profile of profileRecords) {
        const userId = userIds.get(profile.email);
        if (!userId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'profiles',
          [
            {
              userId,
              headline: profile.headline,
              bio: profile.bio,
              skills: profile.skills,
              experience: profile.experience,
              education: profile.education,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [freelancerId] = [userIds.get('jonah.freelancer.demo@gigvora.com')];
      if (freelancerId) {
        const [existingFreelancer] = await queryInterface.sequelize.query(
          'SELECT id FROM freelancer_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: freelancerId },
          },
        );
        if (!existingFreelancer?.id) {
          await queryInterface.bulkInsert(
            'freelancer_profiles',
            [
              {
                userId: freelancerId,
                title: 'Principal Product Designer',
                hourlyRate: 145.5,
                availability: '25 hrs/week — fractional discovery & design leadership',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const companyUserId = userIds.get('haruto.company.demo@gigvora.com');
      if (companyUserId) {
        const [existingCompany] = await queryInterface.sequelize.query(
          'SELECT id FROM company_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: companyUserId },
          },
        );
        if (!existingCompany?.id) {
          await queryInterface.bulkInsert(
            'company_profiles',
            [
              {
                userId: companyUserId,
                companyName: 'Orbital Robotics (Demo)',
                description: 'Global robotics automation firm with 24/7 managed services.',
                website: 'https://orbital-robotics.demo',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const agencyUserId = userIds.get('marisol.agency.demo@gigvora.com');
      if (agencyUserId) {
        const [existingAgency] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: agencyUserId },
          },
        );
        if (!existingAgency?.id) {
          await queryInterface.bulkInsert(
            'agency_profiles',
            [
              {
                userId: agencyUserId,
                agencyName: 'Atlas Collective (Demo)',
                focusArea: 'Product, growth, and analytics pods for venture-backed startups.',
                website: 'https://atlas-collective.demo',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const adminUserId = userIds.get('lara.ops.demo@gigvora.com');
      if (adminUserId) {
        const [existingPost] = await queryInterface.sequelize.query(
          'SELECT id FROM feed_posts WHERE userId = :userId AND content = :content LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: adminUserId, content: feedPostContent },
          },
        );
        if (!existingPost?.id) {
          await queryInterface.bulkInsert(
            'feed_posts',
            [
              {
                userId: adminUserId,
                content: feedPostContent,
                visibility: 'public',
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      if (adminUserId) {
        const [profileRow] = await queryInterface.sequelize.query(
          'SELECT id FROM profiles WHERE userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId: adminUserId },
          },
        );

        if (profileRow?.id) {
          const treasuryBalance = 48250.75;
          const availableBalance = 46300.5;
          const pendingBalance = Number((treasuryBalance - availableBalance).toFixed(2));
          const reconciliationAt = new Date(now.getTime() - 1000 * 60 * 60 * 6);

          const [existingWallet] = await queryInterface.sequelize.query(
            'SELECT id FROM wallet_accounts WHERE userId = :userId AND accountType = :accountType LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, accountType: 'user' },
            },
          );

          let walletAccountId = existingWallet?.id ?? null;

          if (!walletAccountId) {
            await queryInterface.bulkInsert(
              'wallet_accounts',
              [
                {
                  userId: adminUserId,
                  profileId: profileRow.id,
                  accountType: 'user',
                  displayName: 'Operations treasury',
                  custodyProvider: 'stripe',
                  status: 'active',
                  currencyCode: 'USD',
                  currentBalance: treasuryBalance,
                  availableBalance,
                  pendingHoldBalance: pendingBalance,
                  lastReconciledAt: reconciliationAt,
                  metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                  createdAt: now,
                  updatedAt: now,
                },
              ],
              { transaction },
            );

            const [createdAccount] = await queryInterface.sequelize.query(
              'SELECT id FROM wallet_accounts WHERE userId = :userId AND accountType = :accountType ORDER BY id DESC LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { userId: adminUserId, accountType: 'user' },
              },
            );
            walletAccountId = createdAccount?.id ?? walletAccountId;
          } else {
            await queryInterface.bulkUpdate(
              'wallet_accounts',
              {
                displayName: 'Operations treasury',
                status: 'active',
                currencyCode: 'USD',
                currentBalance: treasuryBalance,
                availableBalance,
                pendingHoldBalance: pendingBalance,
                lastReconciledAt: reconciliationAt,
                updatedAt: now,
              },
              { id: walletAccountId },
              { transaction },
            );
          }

          let fundingSourceId = null;
          if (walletAccountId) {
            const [existingFunding] = await queryInterface.sequelize.query(
              'SELECT id, isPrimary FROM wallet_funding_sources WHERE walletAccountId = :walletAccountId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { walletAccountId },
              },
            );

            if (!existingFunding?.id) {
              await queryInterface.bulkInsert(
                'wallet_funding_sources',
                [
                  {
                    userId: adminUserId,
                    walletAccountId,
                    type: 'bank_account',
                    label: 'Ops Treasury Checking',
                    status: 'active',
                    provider: 'stripe',
                    externalReference: `seed-funding-${randomUUID()}`,
                    lastFour: '1234',
                    currencyCode: 'USD',
                    isPrimary: true,
                    connectedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                { transaction },
              );

              const [createdFunding] = await queryInterface.sequelize.query(
                'SELECT id FROM wallet_funding_sources WHERE walletAccountId = :walletAccountId AND label = :label ORDER BY id DESC LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { walletAccountId, label: 'Ops Treasury Checking' },
                },
              );
              fundingSourceId = createdFunding?.id ?? null;
            } else {
              fundingSourceId = existingFunding.id;
              if (!existingFunding.isPrimary) {
                await queryInterface.bulkUpdate(
                  'wallet_funding_sources',
                  { isPrimary: true, status: 'active', updatedAt: now },
                  { id: existingFunding.id },
                  { transaction },
                );
              }
            }

            const [{ count: seededLedgerCount = 0 }] = await queryInterface.sequelize.query(
              "SELECT COUNT(*)::int AS count FROM wallet_ledger_entries WHERE walletAccountId = :walletAccountId AND reference LIKE 'seed-ledger-%'",
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { walletAccountId },
              },
            );

            if (Number(seededLedgerCount) === 0) {
              const ledgerTimeline = [
                {
                  entryType: 'credit',
                  amount: 50000,
                  balanceAfter: 50000,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45),
                  description: 'Seed capital deposit',
                },
                {
                  entryType: 'debit',
                  amount: 3200,
                  balanceAfter: 46800,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
                  description: 'Mentor programme payouts',
                },
                {
                  entryType: 'debit',
                  amount: 1500,
                  balanceAfter: 45300,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4),
                  description: 'Operations tooling spend',
                },
                {
                  entryType: 'credit',
                  amount: 2950.75,
                  balanceAfter: treasuryBalance,
                  occurredAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
                  description: 'Escrow release for gig delivery',
                },
              ];

              const ledgerRows = ledgerTimeline.map((entry) => ({
                walletAccountId,
                entryType: entry.entryType,
                amount: entry.amount,
                currencyCode: 'USD',
                reference: `seed-ledger-${randomUUID()}`,
                description: entry.description,
                initiatedById: adminUserId,
                occurredAt: entry.occurredAt,
                balanceAfter: entry.balanceAfter,
                metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                createdAt: now,
                updatedAt: now,
              }));

              await queryInterface.bulkInsert('wallet_ledger_entries', ledgerRows, { transaction });
            }

            if (fundingSourceId) {
              const [existingTransfer] = await queryInterface.sequelize.query(
                "SELECT id FROM wallet_transfer_requests WHERE walletAccountId = :walletAccountId AND reference LIKE 'seed-transfer-%' LIMIT 1",
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { walletAccountId },
                },
              );

              if (!existingTransfer?.id) {
                await queryInterface.bulkInsert(
                  'wallet_transfer_requests',
                  [
                    {
                      walletAccountId,
                      fundingSourceId,
                      transferType: 'payout',
                      status: 'scheduled',
                      amount: 1800.5,
                      currencyCode: 'USD',
                      reference: `seed-transfer-${randomUUID()}`,
                      requestedById: adminUserId,
                      approvedById: adminUserId,
                      scheduledAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
                      notes: 'Scheduled mentor and vendor payouts',
                      metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                      createdAt: now,
                      updatedAt: now,
                    },
                  ],
                  { transaction },
                );
              }
            }
          }

          let escrowAccountId = null;
          if (walletAccountId) {
            const [existingEscrow] = await queryInterface.sequelize.query(
              'SELECT id FROM escrow_accounts WHERE userId = :userId AND externalId = :externalId LIMIT 1',
              {
                type: QueryTypes.SELECT,
                transaction,
                replacements: { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
              },
            );

            const escrowBalance = 21500.5;
            const escrowPending = 6800.25;

            if (!existingEscrow?.id) {
              await queryInterface.bulkInsert(
                'escrow_accounts',
                [
                  {
                    userId: adminUserId,
                    provider: 'stripe',
                    externalId: 'seed-ops-escrow-account',
                    status: 'active',
                    currencyCode: 'USD',
                    currentBalance: escrowBalance,
                    pendingReleaseTotal: escrowPending,
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    lastReconciledAt: now,
                    walletAccountId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                { transaction },
              );

              const [createdEscrow] = await queryInterface.sequelize.query(
                'SELECT id FROM escrow_accounts WHERE externalId = :externalId LIMIT 1',
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { externalId: 'seed-ops-escrow-account' },
                },
              );
              escrowAccountId = createdEscrow?.id ?? null;
            } else {
              escrowAccountId = existingEscrow.id;
              await queryInterface.bulkUpdate(
                'escrow_accounts',
                {
                  status: 'active',
                  currentBalance: escrowBalance,
                  pendingReleaseTotal: escrowPending,
                  walletAccountId,
                  updatedAt: now,
                },
                { id: escrowAccountId },
                { transaction },
              );
            }

            if (escrowAccountId) {
              const [{ count: seededEscrowCount = 0 }] = await queryInterface.sequelize.query(
                "SELECT COUNT(*)::int AS count FROM escrow_transactions WHERE accountId = :accountId AND reference LIKE 'seed-escrow-%'",
                {
                  type: QueryTypes.SELECT,
                  transaction,
                  replacements: { accountId: escrowAccountId },
                },
              );

              if (Number(seededEscrowCount) === 0) {
                const escrowTransactionsRows = [
                  {
                    accountId: escrowAccountId,
                    reference: `seed-escrow-${randomUUID()}`,
                    type: 'project',
                    status: 'in_escrow',
                    amount: 4500,
                    currencyCode: 'USD',
                    feeAmount: 105,
                    netAmount: 4395,
                    initiatedById: adminUserId,
                    counterpartyId: null,
                    projectId: null,
                    milestoneLabel: 'Automation sprint kickoff',
                    scheduledReleaseAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    auditTrail: JSON.stringify({ events: ['seeded'] }),
                    createdAt: now,
                    updatedAt: now,
                  },
                  {
                    accountId: escrowAccountId,
                    reference: `seed-escrow-${randomUUID()}`,
                    type: 'gig',
                    status: 'released',
                    amount: 3200.25,
                    currencyCode: 'USD',
                    feeAmount: 82.5,
                    netAmount: 3117.75,
                    initiatedById: adminUserId,
                    counterpartyId: null,
                    projectId: null,
                    milestoneLabel: 'Mentor cohort completion',
                    releasedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
                    metadata: JSON.stringify({ source: 'foundational-persona-seed' }),
                    auditTrail: JSON.stringify({ events: ['seeded'] }),
                    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
                    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
                  },
                ];

                await queryInterface.bulkInsert('escrow_transactions', escrowTransactionsRows, { transaction });
              }
            }
          }
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const emails = userSeeds.map((seed) => seed.email);
      const users = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email IN (:emails)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { emails },
        },
      );
      const userIds = users.map((user) => user.id);

      if (userIds.length) {
        const adminUser = users.find((user) => user.email === 'lara.ops.demo@gigvora.com');
        if (adminUser) {
          const adminUserId = adminUser.id;

          const walletAccounts = await queryInterface.sequelize.query(
            'SELECT id FROM wallet_accounts WHERE userId = :userId AND displayName = :displayName',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, displayName: 'Operations treasury' },
            },
          );

          for (const account of walletAccounts) {
            await queryInterface.bulkDelete(
              'wallet_transfer_requests',
              { walletAccountId: account.id, reference: { [Op.like]: 'seed-transfer-%' } },
              { transaction },
            );
            await queryInterface.bulkDelete(
              'wallet_ledger_entries',
              { walletAccountId: account.id, reference: { [Op.like]: 'seed-ledger-%' } },
              { transaction },
            );
          }

          await queryInterface.bulkDelete(
            'wallet_funding_sources',
            { userId: adminUserId, label: 'Ops Treasury Checking' },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'wallet_accounts',
            { userId: adminUserId, displayName: 'Operations treasury' },
            { transaction },
          );

          const escrowAccounts = await queryInterface.sequelize.query(
            'SELECT id FROM escrow_accounts WHERE userId = :userId AND externalId = :externalId',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
            },
          );

          for (const escrow of escrowAccounts) {
            await queryInterface.bulkDelete(
              'escrow_transactions',
              { accountId: escrow.id, reference: { [Op.like]: 'seed-escrow-%' } },
              { transaction },
            );
          }

          await queryInterface.bulkDelete(
            'escrow_accounts',
            { userId: adminUserId, externalId: 'seed-ops-escrow-account' },
            { transaction },
          );
        }

        await queryInterface.bulkDelete('feed_posts', { userId: { [Op.in]: userIds }, content: feedPostContent }, { transaction });
        await queryInterface.bulkDelete('freelancer_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('agency_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('company_profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('profiles', { userId: { [Op.in]: userIds } }, { transaction });
        await queryInterface.bulkDelete('users', { id: { [Op.in]: userIds } }, { transaction });
      }
    });
  },
};
