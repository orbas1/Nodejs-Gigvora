'use strict';

const { QueryTypes } = require('sequelize');

const seedTag = 'agency_alliance_demo_v2';
const allianceSlug = 'enterprise-launch-alliance';
const workspaceSlug = 'alliance-studio-hq';

async function findUserByEmail(queryInterface, transaction, email) {
  const [rows] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return rows?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      const ownerId = await findUserByEmail(queryInterface, transaction, 'noah@gigvora.com');
      const leadId = await findUserByEmail(queryInterface, transaction, 'leo@gigvora.com');
      const operatorId = await findUserByEmail(queryInterface, transaction, 'mia@gigvora.com');

      if (!ownerId || !leadId) {
        throw new Error('Required demo users are missing. Ensure base seed has been executed.');
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
              name: 'Alliance Studio HQ',
              slug: workspaceSlug,
              type: 'agency',
              timezone: 'America/New_York',
              defaultCurrency: 'USD',
              intakeEmail: 'alliances@example.gigvora',
              isActive: true,
              settings: { seedTag, defaultRevenueSplit: { agency: 60, partners: 40 } },
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
        throw new Error('Failed to create or resolve the alliance workspace.');
      }

      const ensureWorkspaceMember = async (userId, role) => {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, userId },
          },
        );
        if (existing?.id) {
          return existing.id;
        }
        await queryInterface.bulkInsert(
          'provider_workspace_members',
          [
            {
              workspaceId,
              userId,
              role,
              status: 'active',
              invitedById: ownerId,
              joinedAt: new Date(now.getTime() - oneWeekMs * 4),
              lastActiveAt: now,
              removedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, userId },
          },
        );
        return inserted?.id ?? null;
      };

      const ownerMemberId = await ensureWorkspaceMember(ownerId, 'owner');
      const leadMemberId = await ensureWorkspaceMember(leadId, 'staff');
      const operatorMemberId = operatorId ? await ensureWorkspaceMember(operatorId, 'manager') : null;

      const [allianceRow] = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliances WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: allianceSlug },
        },
      );

      let allianceId = allianceRow?.id ?? null;
      if (!allianceId) {
        await queryInterface.bulkInsert(
          'agency_alliances',
          [
            {
              workspaceId,
              name: 'Enterprise Launch Alliance',
              slug: allianceSlug,
              status: 'active',
              allianceType: 'delivery_pod',
              description:
                'High-trust alliance focused on shipping marketplace launches with embedded analytics and compliance.',
              focusAreas: ['Product engineering', 'Growth analytics'],
              defaultRevenueSplit: { agency: 60, partners: 40, seedTag },
              startDate: new Date(now.getTime() - oneWeekMs * 12),
              endDate: null,
              nextReviewAt: new Date(now.getTime() + oneWeekMs * 4),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedAlliance] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliances WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: allianceSlug },
          },
        );
        allianceId = insertedAlliance?.id ?? null;
      }

      if (!allianceId) {
        throw new Error('Failed to create or resolve alliance.');
      }

      const membersToEnsure = [
        {
          workspaceMemberId: ownerMemberId,
          userId: ownerId,
          role: 'lead',
          status: 'active',
          commitmentHours: 18,
          revenueSharePercent: 60,
          objectives: { focus: 'Alliance governance and enterprise relationships', seedTag },
        },
        {
          workspaceMemberId: leadMemberId,
          userId: leadId,
          role: 'specialist',
          status: 'active',
          commitmentHours: 24,
          revenueSharePercent: 35,
          objectives: { focus: 'Lead delivery pods and automation', seedTag },
        },
      ];

      if (operatorMemberId && operatorId) {
        membersToEnsure.push({
          workspaceMemberId: operatorMemberId,
          userId: operatorId,
          role: 'contributor',
          status: 'active',
          commitmentHours: 12,
          revenueSharePercent: 5,
          objectives: { focus: 'Operational cadence and reporting', seedTag },
        });
      }

      const allianceMemberIds = new Map();
      for (const member of membersToEnsure) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_members WHERE allianceId = :allianceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId, userId: member.userId },
          },
        );
        if (existing?.id) {
          allianceMemberIds.set(member.userId, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'agency_alliance_members',
          [
            {
              allianceId,
              workspaceId,
              workspaceMemberId: member.workspaceMemberId,
              userId: member.userId,
              role: member.role,
              status: member.status,
              joinDate: new Date(now.getTime() - oneWeekMs * 8),
              exitDate: null,
              commitmentHours: member.commitmentHours,
              revenueSharePercent: member.revenueSharePercent,
              objectives: member.objectives,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedMember] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_members WHERE allianceId = :allianceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId, userId: member.userId },
          },
        );
        if (insertedMember?.id) {
          allianceMemberIds.set(member.userId, insertedMember.id);
        }
      }

      const leadAllianceMemberId = allianceMemberIds.get(ownerId);
      const specialistAllianceMemberId = allianceMemberIds.get(leadId);

      const [podRow] = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliance_pods WHERE allianceId = :allianceId AND name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { allianceId, name: 'Launch Readiness Pod' },
        },
      );

      let podId = podRow?.id ?? null;
      if (!podId) {
        await queryInterface.bulkInsert(
          'agency_alliance_pods',
          [
            {
              allianceId,
              leadMemberId: leadAllianceMemberId,
              name: 'Launch Readiness Pod',
              focusArea: 'Product launch engineering',
              podType: 'delivery',
              status: 'active',
              backlogValue: 125000,
              capacityTarget: 3,
              externalNotes: 'Handles enterprise launch squads and QA rituals.',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedPod] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_pods WHERE allianceId = :allianceId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId, name: 'Launch Readiness Pod' },
          },
        );
        podId = insertedPod?.id ?? null;
      }

      if (podId && specialistAllianceMemberId) {
        const [existingPodMember] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_pod_members WHERE podId = :podId AND allianceMemberId = :memberId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { podId, memberId: specialistAllianceMemberId },
          },
        );
        if (!existingPodMember?.id) {
          await queryInterface.bulkInsert(
            'agency_alliance_pod_members',
            [
              {
                podId,
                allianceMemberId: specialistAllianceMemberId,
                role: 'Lead engineer',
                weeklyCommitmentHours: 22,
                utilizationTarget: 80,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const resourceWeeks = [0, 1];
      for (const offset of resourceWeeks) {
        const weekStart = new Date(now.getTime() - offset * oneWeekMs);
        const isoMonday = new Date(weekStart);
        const diffToMonday = (isoMonday.getUTCDay() + 6) % 7;
        isoMonday.setUTCDate(isoMonday.getUTCDate() - diffToMonday);
        isoMonday.setUTCHours(0, 0, 0, 0);

        const [existingSlot] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_resource_slots WHERE allianceId = :allianceId AND allianceMemberId = :memberId AND weekStartDate = :week LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: {
              allianceId,
              memberId: specialistAllianceMemberId,
              week: isoMonday.toISOString().slice(0, 10),
            },
          },
        );

        if (!existingSlot?.id) {
          await queryInterface.bulkInsert(
            'agency_alliance_resource_slots',
            [
              {
                allianceId,
                allianceMemberId: specialistAllianceMemberId,
                weekStartDate: isoMonday,
                plannedHours: 26,
                bookedHours: offset === 0 ? 24 : 20,
                engagementType: 'launch_sprint',
                notes: offset === 0 ? 'Buffer reserved for analytics QA.' : null,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const [rateCardRow] = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliance_rate_cards WHERE allianceId = :allianceId AND serviceLine = :serviceLine AND version = :version LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { allianceId, serviceLine: 'Launch readiness sprint', version: 1 },
        },
      );

      let rateCardId = rateCardRow?.id ?? null;
      if (!rateCardId) {
        await queryInterface.bulkInsert(
          'agency_alliance_rate_cards',
          [
            {
              allianceId,
              version: 1,
              serviceLine: 'Launch readiness sprint',
              deliveryModel: 'pod_fixed',
              currency: 'USD',
              unit: 'sprint',
              rate: 18500,
              status: 'active',
              effectiveFrom: new Date(now.getTime() - oneWeekMs * 4),
              effectiveTo: null,
              changeSummary: 'Baseline sprint covering discovery, QA, and analytics instrumentation.',
              createdById: ownerId,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedRateCard] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_rate_cards WHERE allianceId = :allianceId AND serviceLine = :serviceLine AND version = :version LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId, serviceLine: 'Launch readiness sprint', version: 1 },
          },
        );
        rateCardId = insertedRateCard?.id ?? null;
      }

      if (rateCardId) {
        const [existingApproval] = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_rate_card_approvals WHERE rateCardId = :rateCardId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { rateCardId },
          },
        );
        if (!existingApproval?.id) {
          await queryInterface.bulkInsert(
            'agency_alliance_rate_card_approvals',
            [
              {
                rateCardId,
                approverId: operatorId ?? ownerId,
                status: 'approved',
                comment: 'Validated utilisation targets and compliance guardrails.',
                decidedAt: new Date(now.getTime() - oneWeekMs * 2),
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const [splitRow] = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliance_revenue_splits WHERE allianceId = :allianceId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { allianceId },
        },
      );

      if (!splitRow?.id) {
        await queryInterface.bulkInsert(
          'agency_alliance_revenue_splits',
          [
            {
              allianceId,
              splitType: 'tiered',
              terms: { tiers: [{ threshold: 0, agency: 60, partners: 40 }, { threshold: 150000, agency: 55, partners: 45 }], seedTag },
              status: 'active',
              effectiveFrom: new Date(now.getTime() - oneWeekMs * 4),
              effectiveTo: null,
              createdById: ownerId,
              approvedById: operatorId ?? ownerId,
              approvedAt: new Date(now.getTime() - oneWeekMs * 3),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [alliance] = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliances WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: allianceSlug },
        },
      );

      const allianceId = alliance?.id ?? null;
      if (allianceId) {
        await queryInterface.bulkDelete('agency_alliance_resource_slots', { allianceId }, { transaction });

        const pods = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_pods WHERE allianceId = :allianceId',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId },
          },
        );
        const podIds = pods.map((pod) => pod.id);
        if (podIds.length) {
          await queryInterface.bulkDelete(
            'agency_alliance_pod_members',
            { podId: { [Sequelize.Op.in]: podIds } },
            { transaction },
          );
        }
        await queryInterface.bulkDelete('agency_alliance_pods', { allianceId }, { transaction });

        const rateCards = await queryInterface.sequelize.query(
          'SELECT id FROM agency_alliance_rate_cards WHERE allianceId = :allianceId',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { allianceId },
          },
        );
        const rateCardIds = rateCards.map((row) => row.id);
        if (rateCardIds.length) {
          await queryInterface.bulkDelete(
            'agency_alliance_rate_card_approvals',
            { rateCardId: { [Sequelize.Op.in]: rateCardIds } },
            { transaction },
          );
        }
        await queryInterface.bulkDelete('agency_alliance_rate_cards', { allianceId }, { transaction });
        await queryInterface.bulkDelete('agency_alliance_revenue_splits', { allianceId }, { transaction });
        await queryInterface.bulkDelete('agency_alliance_members', { allianceId }, { transaction });
        await queryInterface.bulkDelete('agency_alliances', { id: allianceId }, { transaction });
      }

      const [workspace] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: workspaceSlug },
        },
      );
      const workspaceId = workspace?.id ?? null;

      if (workspaceId) {
        const users = await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email IN (:emails)',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { emails: ['noah@gigvora.com', 'leo@gigvora.com', 'mia@gigvora.com'] },
          },
        );
        const userIds = users.map((row) => row.id);
        if (userIds.length) {
          await queryInterface.bulkDelete(
            'provider_workspace_members',
            {
              workspaceId,
              userId: { [Sequelize.Op.in]: userIds },
            },
            { transaction },
          );
        }
        await queryInterface.bulkDelete(
          'provider_workspaces',
          { id: workspaceId, intakeEmail: 'alliances@example.gigvora' },
          { transaction },
        );
      }
    });
  },
};
