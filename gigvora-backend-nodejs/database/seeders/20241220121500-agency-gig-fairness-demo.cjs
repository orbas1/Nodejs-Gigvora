'use strict';

const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { email: 'noah@gigvora.com' },
          transaction,
        },
      );

      if (!owner?.id) {
        return;
      }

      const ownerId = owner.id;
      const now = new Date();

      const [settings] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_auto_match_settings WHERE owner_id = :ownerId LIMIT 1',
        {
          type: QueryTypes.SELECT,
          replacements: { ownerId },
          transaction,
        },
      );

      if (!settings?.id) {
        await queryInterface.bulkInsert(
          'pgm_auto_match_settings',
          [
            {
              owner_id: ownerId,
              enabled: true,
              matching_window_days: 21,
              target_roles: JSON.stringify(['designer', 'copywriter']),
              focus_skills: JSON.stringify(['ui', 'localisation', 'brand strategy']),
              metadata: JSON.stringify({ seed: 'agency-gig-fairness-demo' }),
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction },
        );
      }

      const orderDefinitions = [
        {
          orderNumber: 'FAIR-001',
          vendorName: 'Atlas Studios',
          serviceName: 'Website localisation sprint',
          status: 'in_revision',
          progressPercent: 65,
          amount: 4800,
          kickoffAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          metadata: {
            fairness: { ensureNewcomer: true, rotationWindowDays: 30 },
            deliveryWindowDays: 12,
            seed: 'agency-gig-fairness-demo',
          },
          requirements: [
            {
              title: 'Upload localisation kit',
              status: 'pending',
              dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          orderNumber: 'FAIR-002',
          vendorName: 'Nova Designers Collective',
          serviceName: 'Campaign design sprint',
          status: 'completed',
          progressPercent: 100,
          amount: 6200,
          kickoffAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          dueAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          metadata: {
            fairness: { ensureNewcomer: false, equityFactor: 0.42 },
            completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
            seed: 'agency-gig-fairness-demo',
          },
          requirements: [
            {
              title: 'Brand guidelines upload',
              status: 'approved',
              dueAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
            },
          ],
          timeline: {
            title: 'Client handoff',
            eventType: 'handoff',
            completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          },
          submission: {
            title: 'Approved campaign deliverable',
            approvedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          },
        },
        {
          orderNumber: 'FAIR-003',
          vendorName: 'Signal Copy Lab',
          serviceName: 'Evergreen copy refresh',
          status: 'in_delivery',
          progressPercent: 40,
          amount: 3200,
          kickoffAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dueAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          metadata: {
            fairness: { ensureNewcomer: true, ensuredNewcomer: true },
            seed: 'agency-gig-fairness-demo',
          },
          requirements: [
            {
              title: 'Persona research upload',
              status: 'pending',
              dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      ];

      const insertedOrders = [];

      for (const definition of orderDefinitions) {
        const [existingOrder] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_gig_orders WHERE owner_id = :ownerId AND order_number = :orderNumber LIMIT 1',
          {
            type: QueryTypes.SELECT,
            replacements: { ownerId, orderNumber: definition.orderNumber },
            transaction,
          },
        );

        if (existingOrder?.id) {
          insertedOrders.push({ id: existingOrder.id, definition });
          continue;
        }

        await queryInterface.bulkInsert(
          'pgm_gig_orders',
          [
            {
              owner_id: ownerId,
              order_number: definition.orderNumber,
              vendor_name: definition.vendorName,
              service_name: definition.serviceName,
              status: definition.status,
              progress_percent: definition.progressPercent,
              amount: definition.amount,
              currency: 'USD',
              kickoff_at: definition.kickoffAt,
              due_at: definition.dueAt,
              metadata: JSON.stringify(definition.metadata),
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction },
        );

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_gig_orders WHERE owner_id = :ownerId AND order_number = :orderNumber LIMIT 1',
          {
            type: QueryTypes.SELECT,
            replacements: { ownerId, orderNumber: definition.orderNumber },
            transaction,
          },
        );

        if (inserted?.id) {
          insertedOrders.push({ id: inserted.id, definition });
        }
      }

      for (const { id: orderId, definition } of insertedOrders) {
        if (!orderId) {
          // order already present before seed; avoid duplicating related data
          continue;
        }

        if (Array.isArray(definition.requirements)) {
          for (const requirement of definition.requirements) {
            const [existingRequirement] = await queryInterface.sequelize.query(
              'SELECT id FROM pgm_gig_order_requirements WHERE order_id = :orderId AND title = :title LIMIT 1',
              {
                type: QueryTypes.SELECT,
                replacements: { orderId, title: requirement.title },
                transaction,
              },
            );
            if (existingRequirement?.id) {
              continue;
            }
            await queryInterface.bulkInsert(
              'pgm_gig_order_requirements',
              [
                {
                  order_id: orderId,
                  title: requirement.title,
                  status: requirement.status ?? 'pending',
                  due_at: requirement.dueAt ?? null,
                  notes: null,
                  created_at: now,
                  updated_at: now,
                },
              ],
              { transaction },
            );
          }
        }

        if (definition.timeline?.title) {
          const [existingTimeline] = await queryInterface.sequelize.query(
            'SELECT id FROM pgm_gig_timeline_events WHERE order_id = :orderId AND title = :title LIMIT 1',
            {
              type: QueryTypes.SELECT,
              replacements: { orderId, title: definition.timeline.title },
              transaction,
            },
          );
          if (!existingTimeline?.id) {
            await queryInterface.bulkInsert(
              'pgm_gig_timeline_events',
              [
                {
                  order_id: orderId,
                  event_type: definition.timeline.eventType ?? 'handoff',
                  title: definition.timeline.title,
                  summary: 'Auto-seeded to model fairness turnaround.',
                  status: 'completed',
                  scheduled_at: definition.timeline.completedAt ?? now,
                  completed_at: definition.timeline.completedAt ?? now,
                  created_by_id: ownerId,
                  visibility: 'client',
                  metadata: JSON.stringify({ seed: 'agency-gig-fairness-demo' }),
                  created_at: now,
                  updated_at: now,
                },
              ],
              { transaction },
            );
          }
        }

        if (definition.submission?.title) {
          const [existingSubmission] = await queryInterface.sequelize.query(
            'SELECT id FROM pgm_gig_submissions WHERE order_id = :orderId AND title = :title LIMIT 1',
            {
              type: QueryTypes.SELECT,
              replacements: { orderId, title: definition.submission.title },
              transaction,
            },
          );
          if (!existingSubmission?.id) {
            await queryInterface.bulkInsert(
              'pgm_gig_submissions',
              [
                {
                  order_id: orderId,
                  title: definition.submission.title,
                  description: 'Approved deliverable for fairness turnaround metrics.',
                  status: 'approved',
                  submitted_at: definition.submission.approvedAt ?? now,
                  approved_at: definition.submission.approvedAt ?? now,
                  submitted_by_id: ownerId,
                  reviewed_by_id: ownerId,
                  metadata: JSON.stringify({ seed: 'agency-gig-fairness-demo' }),
                  created_at: now,
                  updated_at: now,
                },
              ],
              { transaction },
            );
          }
        }
      }

      const candidateDefinitions = [
        { name: 'Alex Fairbanks', status: 'contacted', matchScore: 72.5 },
        { name: 'River Patel', status: 'engaged', matchScore: 88.1 },
        { name: 'Jamie Chen', status: 'suggested', matchScore: 64.2 },
      ];

      for (const candidate of candidateDefinitions) {
        const [existingCandidate] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_auto_match_candidates WHERE owner_id = :ownerId AND freelancer_name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            replacements: { ownerId, name: candidate.name },
            transaction,
          },
        );
        if (existingCandidate?.id) {
          continue;
        }

        await queryInterface.bulkInsert(
          'pgm_auto_match_candidates',
          [
            {
              owner_id: ownerId,
              project_id: null,
              freelancer_name: candidate.name,
              freelancer_email: null,
              match_score: candidate.matchScore,
              status: candidate.status,
              matched_at: now,
              channel: 'curated_pool',
              notes: 'Seeded candidate for fairness coverage analytics.',
              metadata: JSON.stringify({ seed: 'agency-gig-fairness-demo' }),
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
      const orderNumbers = ['FAIR-001', 'FAIR-002', 'FAIR-003'];
      const candidateNames = ['Alex Fairbanks', 'River Patel', 'Jamie Chen'];

      await queryInterface.bulkDelete(
        'pgm_auto_match_candidates',
        { freelancer_name: candidateNames },
        { transaction },
      );

      const orderIds = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_gig_orders WHERE order_number IN (:orderNumbers)',
        {
          type: QueryTypes.SELECT,
          replacements: { orderNumbers },
          transaction,
        },
      );

      const ids = orderIds.map((row) => row.id);

      if (ids.length) {
        await queryInterface.bulkDelete('pgm_gig_order_requirements', { order_id: ids }, { transaction });
        await queryInterface.bulkDelete('pgm_gig_timeline_events', { order_id: ids }, { transaction });
        await queryInterface.bulkDelete('pgm_gig_submissions', { order_id: ids }, { transaction });
        await queryInterface.bulkDelete('pgm_gig_orders', { id: ids }, { transaction });
      }

      const seededSettings = await queryInterface.sequelize.query(
        "SELECT id FROM pgm_auto_match_settings WHERE metadata LIKE '%agency-gig-fairness-demo%'",
        { type: QueryTypes.SELECT, transaction },
      );
      if (seededSettings.length) {
        await queryInterface.bulkDelete(
          'pgm_auto_match_settings',
          { id: seededSettings.map((row) => row.id) },
          { transaction },
        );
      }
    });
  },
};
