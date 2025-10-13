'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      const [[freelancerUser]] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = 'leo@gigvora.com' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      const [[agencyOwner]] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = 'noah@gigvora.com' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      const [[opsManager]] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = 'mia@gigvora.com' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );

      if (!freelancerUser || !agencyOwner) {
        throw new Error('Required seed users missing for agency alliance demo.');
      }

      await queryInterface.bulkInsert(
        'provider_workspaces',
        [
          {
            ownerId: agencyOwner.id,
            name: 'Alliance Studio HQ',
            slug: 'alliance-studio-hq',
            type: 'agency',
            timezone: 'America/New_York',
            defaultCurrency: 'USD',
            intakeEmail: 'alliances@alliancestudio.example.com',
            isActive: true,
            settings: {
              alliancePlaybooksEnabled: true,
              defaultRevenueSplit: { agency: 60, partners: 40 },
            },
            createdAt: new Date(now.getTime() - oneWeek * 6),
            updatedAt: now,
          },
        ],
        { transaction, ignoreDuplicates: true },
      );

      const [[workspaceRecord]] = await queryInterface.sequelize.query(
        "SELECT id FROM provider_workspaces WHERE slug = 'alliance-studio-hq' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      const allianceWorkspaceId = workspaceRecord?.id;
      if (!allianceWorkspaceId) {
        throw new Error('Failed to seed alliance workspace.');
      }

      const existingMembers = await queryInterface.sequelize.query(
        'SELECT id, userId FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId IN (:userIds)',
        {
          replacements: { workspaceId: allianceWorkspaceId, userIds: [agencyOwner.id, freelancerUser.id, opsManager?.id].filter(Boolean) },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const membersToInsert = [];
      const existingMemberIdsByUser = new Map(existingMembers.map((member) => [member.userId, member.id]));

      const ensureMember = (userId, role, status = 'active') => {
        if (!userId) return;
        if (!existingMemberIdsByUser.has(userId)) {
          membersToInsert.push({
            workspaceId: allianceWorkspaceId,
            userId,
            role,
            status,
            invitedById: agencyOwner.id,
            joinedAt: new Date(now.getTime() - oneWeek * 5),
            lastActiveAt: now,
            removedAt: null,
            createdAt: new Date(now.getTime() - oneWeek * 5),
            updatedAt: now,
          });
        }
      };

      ensureMember(agencyOwner.id, 'owner');
      ensureMember(freelancerUser.id, 'staff');
      ensureMember(opsManager?.id, 'manager');

      if (membersToInsert.length) {
        await queryInterface.bulkInsert('provider_workspace_members', membersToInsert, {
          transaction,
          ignoreDuplicates: true,
        });
      }

      const workspaceMembers = await queryInterface.sequelize.query(
        'SELECT id, userId FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId IN (:userIds)',
        {
          replacements: {
            workspaceId: allianceWorkspaceId,
            userIds: [agencyOwner.id, freelancerUser.id, opsManager?.id].filter(Boolean),
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      workspaceMembers.forEach((member) => {
        existingMemberIdsByUser.set(member.userId, member.id);
      });

      const allianceRecords = [
        {
          workspaceId: allianceWorkspaceId,
          name: 'Enterprise Launch Alliance',
          slug: 'enterprise-launch-alliance',
          status: 'active',
          allianceType: 'delivery_pod',
          description:
            'Cross-functional pod partnering with enterprise agencies to deliver full-stack product launches and revenue programs.',
          focusAreas: ['Product engineering', 'Growth experiments', 'Analytics readiness'],
          defaultRevenueSplit: { agency: 55, partners: 45 },
          startDate: new Date(now.getTime() - oneWeek * 12),
          endDate: null,
          nextReviewAt: new Date(now.getTime() + oneWeek * 4),
          createdAt: new Date(now.getTime() - oneWeek * 12),
          updatedAt: now,
        },
        {
          workspaceId: allianceWorkspaceId,
          name: 'Venture Scale Pod',
          slug: 'venture-scale-pod',
          status: 'active',
          allianceType: 'managed_service',
          description:
            'Dedicated growth and retention pod supporting venture-backed marketplaces with performance guarantees and shared upside.',
          focusAreas: ['Lifecycle marketing', 'Retention analytics', 'Conversion optimization'],
          defaultRevenueSplit: { agency: 50, partners: 50 },
          startDate: new Date(now.getTime() - oneWeek * 8),
          endDate: null,
          nextReviewAt: new Date(now.getTime() + oneWeek * 6),
          createdAt: new Date(now.getTime() - oneWeek * 8),
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('agency_alliances', allianceRecords, {
        transaction,
        ignoreDuplicates: true,
      });

      const allianceRows = await queryInterface.sequelize.query(
        'SELECT id, slug FROM agency_alliances WHERE slug IN (:slugs)',
        {
          replacements: { slugs: allianceRecords.map((record) => record.slug) },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const alliancesBySlug = new Map(allianceRows.map((row) => [row.slug, row.id]));
      const enterpriseAllianceId = alliancesBySlug.get('enterprise-launch-alliance');
      const ventureAllianceId = alliancesBySlug.get('venture-scale-pod');

      if (!enterpriseAllianceId || !ventureAllianceId) {
        throw new Error('Failed to resolve seeded alliance identifiers.');
      }

      const allianceMembers = [
        {
          allianceId: enterpriseAllianceId,
          workspaceId: allianceWorkspaceId,
          workspaceMemberId: existingMemberIdsByUser.get(agencyOwner.id),
          userId: agencyOwner.id,
          role: 'lead',
          status: 'active',
          joinDate: new Date(now.getTime() - oneWeek * 12),
          exitDate: null,
          commitmentHours: 20,
          revenueSharePercent: 55,
          objectives: { okrs: ['Stabilize enterprise launch velocity', 'Improve bench forecasting accuracy'] },
          createdAt: new Date(now.getTime() - oneWeek * 12),
          updatedAt: now,
        },
        {
          allianceId: enterpriseAllianceId,
          workspaceId: allianceWorkspaceId,
          workspaceMemberId: existingMemberIdsByUser.get(freelancerUser.id),
          userId: freelancerUser.id,
          role: 'specialist',
          status: 'active',
          joinDate: new Date(now.getTime() - oneWeek * 10),
          exitDate: null,
          commitmentHours: 28,
          revenueSharePercent: 35,
          objectives: { focus: 'Own growth experimentation backlog and QA analytics events.' },
          createdAt: new Date(now.getTime() - oneWeek * 10),
          updatedAt: now,
        },
        {
          allianceId: enterpriseAllianceId,
          workspaceId: allianceWorkspaceId,
          workspaceMemberId: existingMemberIdsByUser.get(opsManager?.id),
          userId: opsManager?.id ?? null,
          role: 'contributor',
          status: 'active',
          joinDate: new Date(now.getTime() - oneWeek * 9),
          exitDate: null,
          commitmentHours: 18,
          revenueSharePercent: 10,
          objectives: { focus: 'Drive PMO cadence and alliance reporting.' },
          createdAt: new Date(now.getTime() - oneWeek * 9),
          updatedAt: now,
        },
        {
          allianceId: ventureAllianceId,
          workspaceId: allianceWorkspaceId,
          workspaceMemberId: existingMemberIdsByUser.get(agencyOwner.id),
          userId: agencyOwner.id,
          role: 'lead',
          status: 'active',
          joinDate: new Date(now.getTime() - oneWeek * 8),
          exitDate: null,
          commitmentHours: 16,
          revenueSharePercent: 50,
          objectives: { focus: 'Grow retainer backlog across marketplaces and SaaS' },
          createdAt: new Date(now.getTime() - oneWeek * 8),
          updatedAt: now,
        },
        {
          allianceId: ventureAllianceId,
          workspaceId: allianceWorkspaceId,
          workspaceMemberId: existingMemberIdsByUser.get(freelancerUser.id),
          userId: freelancerUser.id,
          role: 'specialist',
          status: 'active',
          joinDate: new Date(now.getTime() - oneWeek * 7),
          exitDate: null,
          commitmentHours: 24,
          revenueSharePercent: 40,
          objectives: { focus: 'Lead experiment pods and train partner developers.' },
          createdAt: new Date(now.getTime() - oneWeek * 7),
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('agency_alliance_members', allianceMembers, {
        transaction,
        ignoreDuplicates: true,
      });

      const memberRows = await queryInterface.sequelize.query(
        'SELECT id, allianceId, userId FROM agency_alliance_members WHERE allianceId IN (:ids)',
        {
          replacements: { ids: [enterpriseAllianceId, ventureAllianceId] },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const findMemberId = (allianceId, userId) => {
        const match = memberRows.find((row) => row.allianceId === allianceId && row.userId === userId);
        return match ? match.id : null;
      };

      const enterpriseLeadMemberId = findMemberId(enterpriseAllianceId, agencyOwner.id);
      const enterpriseSpecialistId = findMemberId(enterpriseAllianceId, freelancerUser.id);
      const ventureLeadMemberId = findMemberId(ventureAllianceId, agencyOwner.id);
      const ventureSpecialistId = findMemberId(ventureAllianceId, freelancerUser.id);

      if (!enterpriseLeadMemberId || !enterpriseSpecialistId || !ventureLeadMemberId || !ventureSpecialistId) {
        throw new Error('Failed to resolve alliance member identifiers for seeding.');
      }

      const podRowsData = [
        {
          allianceId: enterpriseAllianceId,
          leadMemberId: enterpriseLeadMemberId,
          name: 'Launch Readiness Pod',
          focusArea: 'Product launch engineering',
          podType: 'delivery',
          status: 'active',
          backlogValue: 185000,
          capacityTarget: 4,
          externalNotes: 'Supports enterprise onboarding sprints with readiness scorecards.',
          createdAt: new Date(now.getTime() - oneWeek * 12),
          updatedAt: now,
        },
        {
          allianceId: ventureAllianceId,
          leadMemberId: ventureLeadMemberId,
          name: 'Retention Acceleration Pod',
          focusArea: 'Lifecycle & retention experiments',
          podType: 'growth',
          status: 'active',
          backlogValue: 126000,
          capacityTarget: 3,
          externalNotes: 'Owns churn rescue and activation loops for venture clients.',
          createdAt: new Date(now.getTime() - oneWeek * 8),
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('agency_alliance_pods', podRowsData, {
        transaction,
        ignoreDuplicates: true,
      });

      const podRows = await queryInterface.sequelize.query(
        'SELECT id, allianceId, name FROM agency_alliance_pods WHERE allianceId IN (:ids)',
        {
          replacements: { ids: [enterpriseAllianceId, ventureAllianceId] },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const findPodId = (allianceId, name) => {
        const match = podRows.find((row) => row.allianceId === allianceId && row.name === name);
        return match ? match.id : null;
      };

      const enterprisePodId = findPodId(enterpriseAllianceId, 'Launch Readiness Pod');
      const venturePodId = findPodId(ventureAllianceId, 'Retention Acceleration Pod');

      if (!enterprisePodId || !venturePodId) {
        throw new Error('Failed to resolve alliance pod identifiers for seeding.');
      }

      await queryInterface.bulkInsert(
        'agency_alliance_pod_members',
        [
          {
            podId: enterprisePodId,
            allianceMemberId: enterpriseLeadMemberId,
            role: 'Alliance director',
            weeklyCommitmentHours: 20,
            utilizationTarget: 85,
            createdAt: new Date(now.getTime() - oneWeek * 12),
            updatedAt: now,
          },
          {
            podId: enterprisePodId,
            allianceMemberId: enterpriseSpecialistId,
            role: 'Lead growth engineer',
            weeklyCommitmentHours: 25,
            utilizationTarget: 80,
            createdAt: new Date(now.getTime() - oneWeek * 10),
            updatedAt: now,
          },
          {
            podId: venturePodId,
            allianceMemberId: ventureLeadMemberId,
            role: 'Alliance director',
            weeklyCommitmentHours: 16,
            utilizationTarget: 80,
            createdAt: new Date(now.getTime() - oneWeek * 8),
            updatedAt: now,
          },
          {
            podId: venturePodId,
            allianceMemberId: ventureSpecialistId,
            role: 'Lifecycle architect',
            weeklyCommitmentHours: 22,
            utilizationTarget: 78,
            createdAt: new Date(now.getTime() - oneWeek * 7),
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const rateCardRows = [
        {
          allianceId: enterpriseAllianceId,
          version: 1,
          serviceLine: 'Launch readiness sprint',
          deliveryModel: 'pod_fixed',
          currency: 'USD',
          unit: 'sprint',
          rate: 18500,
          status: 'superseded',
          effectiveFrom: new Date(now.getTime() - oneWeek * 12),
          effectiveTo: new Date(now.getTime() - oneWeek * 6),
          changeSummary: 'Baseline sprint package for launch readiness.',
          createdById: agencyOwner.id,
          createdAt: new Date(now.getTime() - oneWeek * 12),
          updatedAt: new Date(now.getTime() - oneWeek * 6),
        },
        {
          allianceId: enterpriseAllianceId,
          version: 2,
          serviceLine: 'Launch readiness sprint',
          deliveryModel: 'pod_fixed',
          currency: 'USD',
          unit: 'sprint',
          rate: 20500,
          status: 'active',
          effectiveFrom: new Date(now.getTime() - oneWeek * 6),
          effectiveTo: null,
          changeSummary: 'Includes analytics QA and experimentation runway.',
          createdById: agencyOwner.id,
          createdAt: new Date(now.getTime() - oneWeek * 6),
          updatedAt: now,
        },
        {
          allianceId: ventureAllianceId,
          version: 1,
          serviceLine: 'Retention accelerator',
          deliveryModel: 'managed_service',
          currency: 'USD',
          unit: 'month',
          rate: 14800,
          status: 'active',
          effectiveFrom: new Date(now.getTime() - oneWeek * 7),
          effectiveTo: null,
          changeSummary: 'Monthly managed service covering lifecycle experiments and coaching.',
          createdById: agencyOwner.id,
          createdAt: new Date(now.getTime() - oneWeek * 7),
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('agency_alliance_rate_cards', rateCardRows, {
        transaction,
        ignoreDuplicates: true,
      });

      const rateCardRowsInserted = await queryInterface.sequelize.query(
        'SELECT id, allianceId, serviceLine, version FROM agency_alliance_rate_cards WHERE allianceId IN (:ids)',
        {
          replacements: { ids: [enterpriseAllianceId, ventureAllianceId] },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const findRateCardId = (allianceId, serviceLine, version) => {
        const match = rateCardRowsInserted.find(
          (row) => row.allianceId === allianceId && row.serviceLine === serviceLine && row.version === version,
        );
        return match ? match.id : null;
      };

      const launchCardV2Id = findRateCardId(enterpriseAllianceId, 'Launch readiness sprint', 2);
      const retentionCardV1Id = findRateCardId(ventureAllianceId, 'Retention accelerator', 1);

      if (launchCardV2Id) {
        await queryInterface.bulkInsert(
          'agency_alliance_rate_card_approvals',
          [
            {
              rateCardId: launchCardV2Id,
              approverId: opsManager?.id ?? agencyOwner.id,
              status: 'approved',
              comment: 'Approved after validating utilization targets.',
              decidedAt: new Date(now.getTime() - oneWeek * 5),
              createdAt: new Date(now.getTime() - oneWeek * 5),
              updatedAt: new Date(now.getTime() - oneWeek * 5),
            },
          ],
          { transaction, ignoreDuplicates: true },
        );
      }

      if (retentionCardV1Id) {
        await queryInterface.bulkInsert(
          'agency_alliance_rate_card_approvals',
          [
            {
              rateCardId: retentionCardV1Id,
              approverId: opsManager?.id ?? agencyOwner.id,
              status: 'pending',
              comment: null,
              decidedAt: null,
              createdAt: new Date(now.getTime() - oneWeek * 4),
              updatedAt: new Date(now.getTime() - oneWeek * 4),
            },
          ],
          { transaction, ignoreDuplicates: true },
        );
      }

      await queryInterface.bulkInsert(
        'agency_alliance_revenue_splits',
        [
          {
            allianceId: enterpriseAllianceId,
            splitType: 'tiered',
            terms: {
              tiers: [
                { threshold: 0, agency: 60, partners: 40 },
                { threshold: 150000, agency: 55, partners: 45 },
              ],
            },
            status: 'active',
            effectiveFrom: new Date(now.getTime() - oneWeek * 8),
            effectiveTo: null,
            createdById: agencyOwner.id,
            approvedById: opsManager?.id ?? agencyOwner.id,
            approvedAt: new Date(now.getTime() - oneWeek * 8),
            createdAt: new Date(now.getTime() - oneWeek * 8),
            updatedAt: now,
          },
          {
            allianceId: ventureAllianceId,
            splitType: 'performance',
            terms: {
              base: { agency: 50, partners: 50 },
              bonus: { activationSLA: '48h', performanceKickback: 5 },
            },
            status: 'pending_approval',
            effectiveFrom: new Date(now.getTime() - oneWeek * 4),
            effectiveTo: null,
            createdById: agencyOwner.id,
            approvedById: null,
            approvedAt: null,
            createdAt: new Date(now.getTime() - oneWeek * 4),
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const buildWeekDate = (offsetWeeks) => {
        const date = new Date(now.getTime() - offsetWeeks * oneWeek);
        const day = date.getUTCDay();
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(date.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
        return monday.toISOString().slice(0, 10);
      };

      const resourceSlots = [];
      for (let week = 0; week < 8; week += 1) {
        resourceSlots.push(
          {
            allianceId: enterpriseAllianceId,
            allianceMemberId: enterpriseSpecialistId,
            weekStartDate: buildWeekDate(week),
            plannedHours: 30,
            bookedHours: week < 2 ? 26 : 28,
            engagementType: 'launch_sprint',
            notes: week === 0 ? 'Buffer reserved for integrations launch.' : null,
            createdAt: now,
            updatedAt: now,
          },
          {
            allianceId: ventureAllianceId,
            allianceMemberId: ventureSpecialistId,
            weekStartDate: buildWeekDate(week),
            plannedHours: 24,
            bookedHours: week < 3 ? 18 : 22,
            engagementType: 'retention_playbook',
            notes: week === 1 ? 'Focus on churn reduction experiments.' : null,
            createdAt: now,
            updatedAt: now,
          },
        );
      }

      await queryInterface.bulkInsert('agency_alliance_resource_slots', resourceSlots, { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const allianceSlugs = ['enterprise-launch-alliance', 'venture-scale-pod'];

      const alliances = await queryInterface.sequelize.query(
        'SELECT id FROM agency_alliances WHERE slug IN (:slugs)',
        { replacements: { slugs: allianceSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const allianceIds = alliances.map((row) => row.id);

      if (allianceIds.length) {
        await queryInterface.bulkDelete(
          'agency_alliances',
          { id: { [Sequelize.Op.in]: allianceIds } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'provider_workspaces',
        { slug: 'alliance-studio-hq' },
        { transaction },
      );
    });
  },
};
