'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('support_playbooks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      stage: {
        type: Sequelize.ENUM('intake', 'investigation', 'resolution', 'follow_up'),
        allowNull: false,
        defaultValue: 'intake',
      },
      persona: {
        type: Sequelize.ENUM('freelancer', 'client', 'support_team', 'cross_functional'),
        allowNull: false,
        defaultValue: 'support_team',
      },
      channel: {
        type: Sequelize.ENUM('inbox', 'voice', 'video', 'email', 'platform'),
        allowNull: false,
        defaultValue: 'inbox',
      },
      csatImpact: { type: Sequelize.STRING(120), allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('support_playbook_steps', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      playbookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_playbooks', key: 'id' },
        onDelete: 'CASCADE',
      },
      stepNumber: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      instructions: { type: Sequelize.TEXT, allowNull: false },
      ownerRole: { type: Sequelize.STRING(120), allowNull: true },
      expectedDurationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      requiresApproval: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_playbook_steps', ['playbookId']);
    await queryInterface.addIndex('support_playbook_steps', ['stepNumber']);

    await queryInterface.createTable('support_case_playbooks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      supportCaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_cases', key: 'id' },
        onDelete: 'CASCADE',
      },
      playbookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_playbooks', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      assignedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_case_playbooks', ['supportCaseId']);
    await queryInterface.addIndex('support_case_playbooks', ['playbookId']);

    await queryInterface.createTable('support_case_links', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      supportCaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_cases', key: 'id' },
        onDelete: 'CASCADE',
      },
      linkType: {
        type: Sequelize.ENUM('gig_order', 'project', 'transaction'),
        allowNull: false,
        defaultValue: 'gig_order',
      },
      reference: { type: Sequelize.STRING(180), allowNull: true },
      gigId: { type: Sequelize.INTEGER, allowNull: true },
      gigTitle: { type: Sequelize.STRING(255), allowNull: true },
      clientName: { type: Sequelize.STRING(255), allowNull: true },
      escrowTransactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'escrow_transactions', key: 'id' },
        onDelete: 'SET NULL',
      },
      orderAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currencyCode: { type: Sequelize.STRING(3), allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_case_links', ['supportCaseId']);
    await queryInterface.addIndex('support_case_links', ['escrowTransactionId']);

    await queryInterface.createTable('support_case_satisfactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      supportCaseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_cases', key: 'id' },
        onDelete: 'CASCADE',
      },
      score: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      submittedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      submittedByType: {
        type: Sequelize.ENUM('freelancer', 'client', 'support', 'system'),
        allowNull: false,
        defaultValue: 'client',
      },
      capturedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_case_satisfactions', ['supportCaseId']);
    await queryInterface.addIndex('support_case_satisfactions', ['submittedByType']);

    await queryInterface.createTable('support_knowledge_articles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      category: {
        type: Sequelize.ENUM('policy', 'workflow', 'finance', 'compliance', 'tools'),
        allowNull: false,
        defaultValue: 'workflow',
      },
      audience: {
        type: Sequelize.ENUM('freelancer', 'client', 'support_team'),
        allowNull: false,
        defaultValue: 'freelancer',
      },
      tags: { type: jsonType, allowNull: true },
      resourceLinks: { type: jsonType, allowNull: true },
      lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('support_knowledge_articles', ['category']);
    await queryInterface.addIndex('support_knowledge_articles', ['audience']);

    const now = new Date();
    const playbooks = [
      {
        slug: 'gig-dispute-intake',
        title: 'Gig dispute intake triage',
        summary:
          'Checklist for acknowledging disputes, validating gig context, and staging the evidence gathering plan before mediation.',
        stage: 'intake',
        persona: 'freelancer',
        channel: 'platform',
        csatImpact: 'Reduces time-to-first-response by 35% when followed in full.',
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: 'gig-mediation-resolution',
        title: 'Guided mediation & resolution',
        summary:
          'Sequence to align with clients on desired outcomes, propose remedies, and coordinate escrow actions with Gigvora trust.',
        stage: 'resolution',
        persona: 'support_team',
        channel: 'voice',
        csatImpact: 'Targets 4.7+ CSAT with structured follow-ups and clear financial actions.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('support_playbooks', playbooks);

    const [playbookRows] = await queryInterface.sequelize.query(
      "SELECT id, slug FROM support_playbooks WHERE slug IN ('gig-dispute-intake', 'gig-mediation-resolution')",
    );
    const slugToId = new Map(playbookRows.map((row) => [row.slug, row.id]));

    const playbookSteps = [
      {
        playbookSlug: 'gig-dispute-intake',
        stepNumber: 1,
        title: 'Confirm gig order context',
        instructions:
          'Validate gig title, milestone, and order reference. Capture client sentiment and any deadlines noted in the gig workspace.',
        ownerRole: 'Account lead',
        expectedDurationMinutes: 10,
        requiresApproval: false,
      },
      {
        playbookSlug: 'gig-dispute-intake',
        stepNumber: 2,
        title: 'Acknowledge client within SLA',
        instructions:
          'Send templated acknowledgement with reference to the gig order, SLA clock, and link to evidence upload portal.',
        ownerRole: 'Support specialist',
        expectedDurationMinutes: 5,
        requiresApproval: false,
      },
      {
        playbookSlug: 'gig-mediation-resolution',
        stepNumber: 1,
        title: 'Outline remediation paths',
        instructions:
          'Review available options (revision, partial refund, goodwill credit) and align with Gigvora trust on financial implications.',
        ownerRole: 'Support lead',
        expectedDurationMinutes: 15,
        requiresApproval: true,
      },
      {
        playbookSlug: 'gig-mediation-resolution',
        stepNumber: 2,
        title: 'Document resolution and CSAT follow-up',
        instructions:
          'Capture final outcome, update dispute and support case metadata, trigger CSAT pulse survey, and schedule follow-up check-in.',
        ownerRole: 'Support lead',
        expectedDurationMinutes: 8,
        requiresApproval: false,
      },
    ].map((step) => ({
      playbookId: slugToId.get(step.playbookSlug),
      stepNumber: step.stepNumber,
      title: step.title,
      instructions: step.instructions,
      ownerRole: step.ownerRole,
      expectedDurationMinutes: step.expectedDurationMinutes,
      requiresApproval: step.requiresApproval,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('support_playbook_steps', playbookSteps);

    const knowledgeArticles = [
      {
        slug: 'evidence-collection-standards',
        title: 'Evidence collection standards for gig disputes',
        summary:
          'Use this rubric to capture artefacts, screenshots, and approvals so escalations have defensible records.',
        body:
          'Collect chat transcripts, deliverable file hashes, and scope references. Ensure all uploads stay within GDPR retention rules and mask PII before sharing with clients.',
        category: 'workflow',
        audience: 'freelancer',
        tags: JSON.stringify(['disputes', 'evidence', 'compliance']),
        resourceLinks: JSON.stringify([
          { label: 'Escalation email template', url: 'https://docs.gigvora.example/support/escalation-template' },
          { label: 'GDPR checklist', url: 'https://docs.gigvora.example/compliance/gdpr' },
        ]),
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: 'refund-decision-tree',
        title: 'Refund and goodwill credit decision tree',
        summary:
          'Determine when to release escrow funds, issue partial refunds, or add goodwill credits aligned with finance policies.',
        body:
          'Follow the flow: validate contract terms, assess delivery gaps, propose remediation, and coordinate with trust team for financial adjustments. Document decisions in the support case metadata.',
        category: 'finance',
        audience: 'support_team',
        tags: JSON.stringify(['escrow', 'refunds', 'finance']),
        resourceLinks: JSON.stringify([
          { label: 'Escrow policy', url: 'https://docs.gigvora.example/trust/escrow-policy' },
        ]),
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('support_knowledge_articles', knowledgeArticles);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('support_knowledge_articles', null, {});
    await queryInterface.bulkDelete('support_case_satisfactions', null, {});
    await queryInterface.bulkDelete('support_case_links', null, {});
    await queryInterface.bulkDelete('support_case_playbooks', null, {});
    await queryInterface.bulkDelete('support_playbook_steps', null, {});
    await queryInterface.bulkDelete('support_playbooks', null, {});

    await queryInterface.dropTable('support_knowledge_articles');
    await queryInterface.dropTable('support_case_satisfactions');
    await queryInterface.dropTable('support_case_links');
    await queryInterface.dropTable('support_case_playbooks');
    await queryInterface.dropTable('support_playbook_steps');
    await queryInterface.dropTable('support_playbooks');

    await dropEnum(queryInterface, 'enum_support_playbooks_stage');
    await dropEnum(queryInterface, 'enum_support_playbooks_persona');
    await dropEnum(queryInterface, 'enum_support_playbooks_channel');
    await dropEnum(queryInterface, 'enum_support_case_playbooks_status');
    await dropEnum(queryInterface, 'enum_support_case_links_linkType');
    await dropEnum(queryInterface, 'enum_support_case_satisfactions_submittedByType');
    await dropEnum(queryInterface, 'enum_support_knowledge_articles_category');
    await dropEnum(queryInterface, 'enum_support_knowledge_articles_audience');
  },
};
