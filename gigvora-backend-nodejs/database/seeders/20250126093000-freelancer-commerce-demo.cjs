'use strict';

const { QueryTypes } = require('sequelize');

const ORDER_NUMBERS = ['FCOMM-001', 'FCOMM-002', 'FCOMM-003'];

async function fetchUserId(queryInterface, email, transaction) {
  const [record] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      replacements: { email },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  if (!record) {
    throw new Error(`Required seed user with email ${email} not found.`);
  }
  return record.id;
}

async function fetchGigId(queryInterface, slug, transaction) {
  const [record] = await queryInterface.sequelize.query(
    'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
    {
      replacements: { slug },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  if (!record) {
    throw new Error(`Required seed gig with slug ${slug} not found.`);
  }
  return record.id;
}

function buildDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const freelancerId = await fetchUserId(queryInterface, 'leo@gigvora.com', transaction);
      const clientId = await fetchUserId(queryInterface, 'mia@gigvora.com', transaction);
      const gigId = await fetchGigId(
        queryInterface,
        'demo-launch-landing-page-optimisation',
        transaction,
      );

      const now = new Date();
      const orders = [
        {
          orderNumber: ORDER_NUMBERS[0],
          gigId,
          clientId,
          freelancerId,
          clientCompanyName: 'Lumen Analytics',
          clientContactName: 'Mia Operations',
          clientContactEmail: 'mia@gigvora.com',
          clientContactPhone: null,
          status: 'in_progress',
          currencyCode: 'USD',
          amount: 6500,
          progressPercent: 45,
          submittedAt: buildDate(-45),
          kickoffDueAt: buildDate(-30),
          dueAt: buildDate(5),
          completedAt: null,
          metadata: {
            seed: 'freelancer-commerce-demo',
            pipelineStage: 'production',
            intakeStatus: 'completed',
            kickoffStatus: 'completed',
            kickoffScheduledAt: buildDate(-30).toISOString(),
            productionStartedAt: buildDate(-28).toISOString(),
            deliveryDueAt: buildDate(5).toISOString(),
            csatScore: 4.6,
            valueAmount: 6500,
            valueCurrency: 'USD',
            escrowTotalAmount: 6500,
            escrowCurrency: 'USD',
            tags: ['retainer', 'design'],
            lastClientContactAt: buildDate(-2).toISOString(),
            nextClientTouchpointAt: buildDate(3).toISOString(),
            gigTitle: 'Launch landing page optimisation',
          },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderNumber: ORDER_NUMBERS[1],
          gigId,
          clientId,
          freelancerId,
          clientCompanyName: 'Lumen Analytics',
          clientContactName: 'Mia Operations',
          clientContactEmail: 'mia@gigvora.com',
          clientContactPhone: null,
          status: 'ready_for_payout',
          currencyCode: 'USD',
          amount: 4200,
          progressPercent: 92,
          submittedAt: buildDate(-32),
          kickoffDueAt: buildDate(-24),
          dueAt: buildDate(-1),
          completedAt: null,
          metadata: {
            seed: 'freelancer-commerce-demo',
            pipelineStage: 'delivery',
            intakeStatus: 'completed',
            kickoffStatus: 'completed',
            kickoffScheduledAt: buildDate(-24).toISOString(),
            productionStartedAt: buildDate(-20).toISOString(),
            deliveryDueAt: buildDate(-1).toISOString(),
            csatScore: null,
            valueAmount: 4200,
            valueCurrency: 'USD',
            escrowTotalAmount: 4200,
            escrowCurrency: 'USD',
            tags: ['bundle', 'ops'],
            lastClientContactAt: buildDate(-1).toISOString(),
            nextClientTouchpointAt: buildDate(1).toISOString(),
            gigTitle: 'Launch landing page optimisation',
          },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderNumber: ORDER_NUMBERS[2],
          gigId,
          clientId,
          freelancerId,
          clientCompanyName: 'Lumen Analytics',
          clientContactName: 'Mia Operations',
          clientContactEmail: 'mia@gigvora.com',
          clientContactPhone: null,
          status: 'completed',
          currencyCode: 'USD',
          amount: 9800,
          progressPercent: 100,
          submittedAt: buildDate(-70),
          kickoffDueAt: buildDate(-60),
          dueAt: buildDate(-25),
          completedAt: buildDate(-24),
          metadata: {
            seed: 'freelancer-commerce-demo',
            pipelineStage: 'completed',
            intakeStatus: 'completed',
            kickoffStatus: 'completed',
            kickoffScheduledAt: buildDate(-60).toISOString(),
            productionStartedAt: buildDate(-58).toISOString(),
            deliveryDueAt: buildDate(-25).toISOString(),
            deliveredAt: buildDate(-24).toISOString(),
            csatScore: 4.9,
            valueAmount: 9800,
            valueCurrency: 'USD',
            escrowTotalAmount: 9800,
            escrowCurrency: 'USD',
            tags: ['retainer', 'automation'],
            lastClientContactAt: buildDate(-24).toISOString(),
            nextClientTouchpointAt: buildDate(7).toISOString(),
            gigTitle: 'Launch landing page optimisation',
          },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('gig_orders', orders, { transaction });

      const insertedOrders = await queryInterface.sequelize.query(
        'SELECT id, orderNumber FROM gig_orders WHERE orderNumber IN (:numbers)',
        {
          replacements: { numbers: ORDER_NUMBERS },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const orderIdMap = insertedOrders.reduce((acc, row) => {
        acc[row.orderNumber] = row.id;
        return acc;
      }, {});

      const requirements = [
        {
          orderId: orderIdMap[ORDER_NUMBERS[0]],
          title: 'Messaging framework questionnaire',
          status: 'received',
          priority: 'high',
          requestedAt: buildDate(-44),
          dueAt: buildDate(-40),
          receivedAt: buildDate(-41),
          notes: 'Client provided full responses and examples.',
          items: null,
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[0]],
          title: 'Analytics access audit',
          status: 'pending',
          priority: 'medium',
          requestedAt: buildDate(-6),
          dueAt: buildDate(-2),
          receivedAt: null,
          notes: 'Waiting on security approval for GA4 access.',
          items: null,
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[1]],
          title: 'Conversion data export',
          status: 'received',
          priority: 'medium',
          requestedAt: buildDate(-20),
          dueAt: buildDate(-15),
          receivedAt: buildDate(-16),
          notes: null,
          items: null,
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('gig_order_requirements', requirements, { transaction });

      const revisions = [
        {
          orderId: orderIdMap[ORDER_NUMBERS[0]],
          roundNumber: 1,
          status: 'submitted',
          severity: 'medium',
          focusAreas: ['hero messaging', 'cta flow'],
          summary: 'Incorporated founder feedback on hero copy and trust badges.',
          requestedAt: buildDate(-8),
          dueAt: buildDate(-5),
          submittedAt: buildDate(-4),
          approvedAt: null,
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[2]],
          roundNumber: 1,
          status: 'approved',
          severity: 'low',
          focusAreas: ['automation follow-up'],
          summary: 'Validated nurture automations after QA pass.',
          requestedAt: buildDate(-30),
          dueAt: buildDate(-27),
          submittedAt: buildDate(-27),
          approvedAt: buildDate(-26),
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('gig_order_revisions', revisions, { transaction });

      const payouts = [
        {
          orderId: orderIdMap[ORDER_NUMBERS[0]],
          milestoneLabel: 'Discovery + blueprint',
          amount: 2500,
          currencyCode: 'USD',
          status: 'released',
          expectedAt: buildDate(-25),
          releasedAt: buildDate(-22),
          riskNote: null,
          metadata: { seed: 'freelancer-commerce-demo', payoutReference: 'ESCROW-4101' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[0]],
          milestoneLabel: 'Experiment launch',
          amount: 4000,
          currencyCode: 'USD',
          status: 'pending',
          expectedAt: buildDate(6),
          releasedAt: null,
          riskNote: 'Pending analytics access.',
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[1]],
          milestoneLabel: 'Automation build',
          amount: 4200,
          currencyCode: 'USD',
          status: 'scheduled',
          expectedAt: buildDate(2),
          releasedAt: null,
          riskNote: null,
          metadata: { seed: 'freelancer-commerce-demo' },
          createdAt: now,
          updatedAt: now,
        },
        {
          orderId: orderIdMap[ORDER_NUMBERS[2]],
          milestoneLabel: 'Retrospective + handoff',
          amount: 9800,
          currencyCode: 'USD',
          status: 'released',
          expectedAt: buildDate(-26),
          releasedAt: buildDate(-24),
          riskNote: null,
          metadata: { seed: 'freelancer-commerce-demo', payoutReference: 'ESCROW-4094' },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('gig_order_payouts', payouts, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const insertedOrders = await queryInterface.sequelize.query(
        'SELECT id FROM gig_orders WHERE orderNumber IN (:numbers)',
        {
          replacements: { numbers: ORDER_NUMBERS },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const orderIds = insertedOrders.map((row) => row.id);

      if (orderIds.length) {
        await queryInterface.bulkDelete('gig_order_payouts', { orderId: orderIds }, { transaction });
        await queryInterface.bulkDelete('gig_order_revisions', { orderId: orderIds }, { transaction });
        await queryInterface.bulkDelete('gig_order_requirements', { orderId: orderIds }, { transaction });
      }

      await queryInterface.bulkDelete('gig_orders', { orderNumber: ORDER_NUMBERS }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
