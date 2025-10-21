'use strict';

const { QueryTypes, Op } = require('sequelize');

const categorySeeds = [
  {
    slug: 'client-onboarding-demo',
    name: 'Client onboarding accelerators',
    description: 'Templates standardising discovery, requirement capture, and kickoff rituals.',
    icon: 'clipboard-check',
    sortOrder: 1,
  },
  {
    slug: 'creative-production-demo',
    name: 'Creative & product delivery',
    description: 'Execution frameworks for marketing, design, and product teams shipping repeatable deliverables.',
    icon: 'sparkles',
    sortOrder: 2,
  },
];

const templateSeeds = [
  {
    slug: 'brand-launch-workspace-demo',
    categorySlug: 'client-onboarding-demo',
    name: 'Brand launch workspace (demo)',
    tagline: 'From intake to launch-ready assets in 30 days',
    description: 'Codified workflow for launching a new brand identity including discovery and go-live governance.',
    industry: 'marketing',
    workflowType: 'brand_launch',
    recommendedTeamSize: '3-5 collaborators',
    estimatedDurationDays: 30,
    automationLevel: 65,
    qualityScore: 93.5,
    status: 'active',
    visibility: 'public',
    clientExperience:
      'Clients receive structured welcome packets, milestone briefings, and automated approvals throughout the engagement.',
    requirementChecklist: [
      'Signed brand strategy questionnaire from client stakeholders.',
      'Access to existing assets (logos, fonts, colour palette).',
      'Audience personas validated by stakeholders.',
    ],
    onboardingSequence: [
      { step: 'Client welcome email', owner: 'Account lead' },
      { step: 'Discovery questionnaire', owner: 'Strategy' },
    ],
    deliverables: ['Brand platform playbook', 'Launch asset package'],
    metrics: [
      { name: 'Stakeholder alignment score', target: 4.5, unit: 'avg rating' },
      { name: 'Revision cycle time', target: 3, unit: 'days' },
    ],
    metadata: { workspaceType: 'freelancer', maturity: 'production_ready' },
  },
  {
    slug: 'product-sprint-workspace-demo',
    categorySlug: 'creative-production-demo',
    name: 'Product experience sprint (demo)',
    tagline: 'Ship a validated product experience in 21 days',
    description: 'Template covering discovery, prototyping, engineering handoff, QA, and launch analytics instrumentation.',
    industry: 'product',
    workflowType: 'product_sprint',
    recommendedTeamSize: '4-7 collaborators',
    estimatedDurationDays: 21,
    automationLevel: 72,
    qualityScore: 95.2,
    status: 'active',
    visibility: 'public',
    clientExperience:
      'Real-time roadmap, sprint burndown charts, and automated stakeholder demo invites keep clients engaged weekly.',
    requirementChecklist: [
      'Prioritised problem statements documented with success metrics.',
      'User research access confirmed.',
      'Access to analytics stack provisioned.',
    ],
    onboardingSequence: [
      { step: 'Sprint readiness audit', owner: 'Product lead' },
      { step: 'Stakeholder alignment survey', owner: 'Research' },
    ],
    deliverables: ['Experience blueprint', 'Engineering handoff package'],
    metrics: [
      { name: 'Sprint velocity adherence', target: 90, unit: 'percent' },
      { name: 'User validation coverage', target: 80, unit: 'percent' },
    ],
    metadata: { workspaceType: 'freelancer', maturity: 'production_ready' },
  },
];

const stageSeeds = [
  {
    templateSlug: 'brand-launch-workspace-demo',
    slug: 'demo-intake-strategy',
    title: 'Intake & brand strategy',
    stageType: 'intake',
    sortOrder: 1,
    description: 'Run discovery interviews, align on goals, and translate insights into positioning pillars.',
    checklists: [
      'Discovery interviews scheduled and recorded.',
      'Competitive audit completed with SWOT summary.',
    ],
    questionnaires: [{ title: 'Brand discovery survey', questions: 18 }],
    automations: ['CRM workflow logs questionnaire completion.'],
    deliverables: ['Positioning brief', 'Stakeholder alignment summary'],
  },
  {
    templateSlug: 'brand-launch-workspace-demo',
    slug: 'demo-visual-production',
    title: 'Visual identity production',
    stageType: 'production',
    sortOrder: 2,
    description: 'Iterate on concept boards, refine design systems, and prepare feedback-ready prototypes.',
    checklists: ['Colour palette validated for accessibility.', 'Typography scale approved.'],
    questionnaires: [{ title: 'Visual preference alignment', questions: 12 }],
    automations: ['Figma project duplicated with preset templates.'],
    deliverables: ['Identity kit with usage rules'],
  },
  {
    templateSlug: 'product-sprint-workspace-demo',
    slug: 'demo-sprint-discovery',
    title: 'Sprint discovery',
    stageType: 'intake',
    sortOrder: 1,
    description: 'Frame problem statements, align success metrics, and plan research cadence.',
    checklists: ['Kickoff deck approved.', 'Research participants recruited.'],
    questionnaires: [{ title: 'Stakeholder goals survey', questions: 10 }],
    automations: ['Linear checklist generated for readiness tasks.'],
    deliverables: ['Discovery backlog'],
  },
  {
    templateSlug: 'product-sprint-workspace-demo',
    slug: 'demo-sprint-delivery',
    title: 'Sprint delivery',
    stageType: 'delivery',
    sortOrder: 2,
    description: 'Prototype, test, and document engineering handoff requirements.',
    checklists: ['Usability test sessions complete.', 'QA checklist signed.'],
    questionnaires: [],
    automations: ['Slack demo invites sent automatically.'],
    deliverables: ['Engineering handoff package'],
  },
];

const resourceSeeds = [
  {
    templateSlug: 'brand-launch-workspace-demo',
    title: 'Brand discovery questionnaire',
    resourceType: 'questionnaire',
    url: 'https://workspace.gigvora.example.com/questionnaires/brand-discovery',
    description: 'Structured intake form for stakeholders covering positioning, voice, and priorities.',
    metadata: { seed: 'workspace-templates-demo' },
    sortOrder: 1,
  },
  {
    templateSlug: 'brand-launch-workspace-demo',
    title: 'Launch communications playbook',
    resourceType: 'sop',
    url: 'https://workspace.gigvora.example.com/playbooks/launch-comms',
    description: 'Checklist ensuring comms, QA, and analytics steps are assigned.',
    metadata: { seed: 'workspace-templates-demo' },
    sortOrder: 2,
  },
  {
    templateSlug: 'product-sprint-workspace-demo',
    title: 'Sprint demo agenda template',
    resourceType: 'checklist',
    url: 'https://workspace.gigvora.example.com/templates/sprint-demo-agenda',
    description: 'Structure for weekly demos including metrics and decisions.',
    metadata: { seed: 'workspace-templates-demo' },
    sortOrder: 1,
  },
  {
    templateSlug: 'product-sprint-workspace-demo',
    title: 'Experiment backlog sheet',
    resourceType: 'asset',
    url: 'https://workspace.gigvora.example.com/templates/experiment-backlog',
    description: 'Google Sheets template aligning experiment hypotheses with metrics.',
    metadata: { seed: 'workspace-templates-demo' },
    sortOrder: 2,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const categoryIdBySlug = new Map();

      for (const category of categorySeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_template_categories WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: category.slug },
          },
        );
        if (existing?.id) {
          categoryIdBySlug.set(category.slug, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'workspace_template_categories',
          [
            {
              ...category,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_template_categories WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: category.slug },
          },
        );
        if (inserted?.id) {
          categoryIdBySlug.set(category.slug, inserted.id);
        }
      }

      const templateIdBySlug = new Map();
      for (const template of templateSeeds) {
        const categoryId = categoryIdBySlug.get(template.categorySlug);
        if (!categoryId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_templates WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: template.slug },
          },
        );
        if (existing?.id) {
          templateIdBySlug.set(template.slug, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'workspace_templates',
          [
            {
              ...template,
              categoryId,
              lastPublishedAt: now,
              archivedAt: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_templates WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: template.slug },
          },
        );
        if (inserted?.id) {
          templateIdBySlug.set(template.slug, inserted.id);
        }
      }

      for (const stage of stageSeeds) {
        const templateId = templateIdBySlug.get(stage.templateSlug);
        if (!templateId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_template_stages WHERE templateId = :templateId AND slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { templateId, slug: stage.slug },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'workspace_template_stages',
          [
            {
              ...stage,
              templateId,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const resource of resourceSeeds) {
        const templateId = templateIdBySlug.get(resource.templateSlug);
        if (!templateId) continue;
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_template_resources WHERE templateId = :templateId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { templateId, title: resource.title },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'workspace_template_resources',
          [
            {
              ...resource,
              templateId,
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
      const templateIds = [];
      for (const template of templateSeeds) {
        const [row] = await queryInterface.sequelize.query(
          'SELECT id FROM workspace_templates WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: template.slug },
          },
        );
        if (row?.id) {
          templateIds.push(row.id);
        }
      }

      if (templateIds.length) {
        await queryInterface.bulkDelete(
          'workspace_template_resources',
          { templateId: { [Op.in]: templateIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'workspace_template_stages',
          { templateId: { [Op.in]: templateIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'workspace_templates',
          { id: { [Op.in]: templateIds } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'workspace_template_categories',
        { slug: categorySeeds.map((category) => category.slug) },
        { transaction },
      );
    });
  },
};
