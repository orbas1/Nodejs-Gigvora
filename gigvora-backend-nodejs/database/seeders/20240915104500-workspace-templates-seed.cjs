'use strict';

const CATEGORY_TABLE = 'workspace_template_categories';
const TEMPLATE_TABLE = 'workspace_templates';
const STAGE_TABLE = 'workspace_template_stages';
const RESOURCE_TABLE = 'workspace_template_resources';

const categorySlugs = ['client-onboarding', 'creative-production', 'retainer-operations'];
const templateSlugs = [
  'brand-launch-blueprint',
  'product-experience-sprint',
  'fractional-cmo-retainer',
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const categories = [
        {
          id: 1,
          slug: categorySlugs[0],
          name: 'Client onboarding accelerators',
          description: 'Templates that standardise discovery, requirement capture, and kickoff rituals for new client engagements.',
          icon: 'clipboard-check',
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          slug: categorySlugs[1],
          name: 'Creative & product delivery',
          description: 'Execution frameworks for marketing, design, and product teams shipping repeatable deliverables.',
          icon: 'sparkles',
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 3,
          slug: categorySlugs[2],
          name: 'Retainer success playbooks',
          description: 'Operational cadences that keep long-term retainers and managed services predictable and transparent.',
          icon: 'arrows-path',
          sortOrder: 3,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert(CATEGORY_TABLE, categories, { transaction });

      const templates = [
        {
          id: 1,
          categoryId: 1,
          slug: templateSlugs[0],
          name: 'Brand launch workspace',
          tagline: 'From intake to launch-ready assets in 30 days',
          description:
            'Codified workflow for launching a new brand identity including discovery, messaging, visual design, and go-live governance.',
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
            'Signed brand strategy questionnaire completed by client stakeholders.',
            'Access to existing assets (logos, fonts, color palettes, brand guidelines).',
            'Audience personas and purchase journey insights validated.',
            'Kickoff workshop scheduled with decision makers and delivery squad.',
          ],
          onboardingSequence: [
            {
              step: 'Client welcome email',
              owner: 'Account lead',
              automation: 'Triggered immediately after contract signature via HubSpot workflow.',
            },
            {
              step: 'Discovery questionnaire',
              owner: 'Strategy',
              automation: 'Typeform automation sends reminder every 48h until completion.',
            },
            {
              step: 'Kickoff workshop',
              owner: 'Project manager',
              automation: 'Zoom + Notion doc auto-created with agenda and attendee checklist.',
            },
          ],
          deliverables: [
            'Brand platform (mission, values, voice).',
            'Visual identity system (logo suite, color, typography).',
            'Launch activation roadmap with channel priorities.',
            'Asset package export ready for web, print, and social.',
          ],
          metrics: [
            {
              name: 'Stakeholder alignment score',
              target: 4.5,
              unit: 'avg rating',
              description: 'Average post-kickoff alignment survey rating.',
            },
            {
              name: 'Revision cycle time',
              target: 3,
              unit: 'days',
              description: 'Average duration per design iteration across all assets.',
            },
          ],
          metadata: {
            workspaceType: 'freelancer',
            suggestedTools: ['Notion', 'Figma', 'Slack', 'HubSpot'],
            maturity: 'production_ready',
          },
          lastPublishedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          categoryId: 2,
          slug: templateSlugs[1],
          name: 'Product experience sprint',
          tagline: 'Ship a validated product experience in 21 days',
          description:
            'Cross-functional template covering discovery, prototyping, engineering handoff, QA, and launch analytics instrumentation.',
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
            'User research access confirmed with at least 5 target participants.',
            'Technical constraints or integration requirements surfaced.',
            'Access to analytics stack (Segment, GA4, Mixpanel) provisioned.',
          ],
          onboardingSequence: [
            {
              step: 'Sprint readiness audit',
              owner: 'Product lead',
              automation: 'Checklist auto-assigned via Linear with due dates based on start date.',
            },
            {
              step: 'Stakeholder alignment survey',
              owner: 'Research',
              automation: 'SurveyMonkey triggers on project creation with follow-up tasks.',
            },
            {
              step: 'Kickoff playback deck',
              owner: 'Design',
              automation: 'Slides template cloned with dynamic client branding.',
            },
          ],
          deliverables: [
            'Experience blueprint and service map.',
            'Interactive prototype with annotated flows.',
            'Engineering handoff package with specs and acceptance criteria.',
            'Launch experiment backlog with analytics tagging plan.',
          ],
          metrics: [
            {
              name: 'Sprint velocity adherence',
              target: 90,
              unit: 'percent',
              description: 'Percentage of committed points delivered each sprint.',
            },
            {
              name: 'User validation coverage',
              target: 80,
              unit: 'percent',
              description: 'Share of key flows tested with research participants.',
            },
          ],
          metadata: {
            workspaceType: 'freelancer',
            suggestedTools: ['Linear', 'Figma', 'Dovetail', 'Notion'],
            maturity: 'production_ready',
          },
          lastPublishedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 3,
          categoryId: 3,
          slug: templateSlugs[2],
          name: 'Fractional CMO retainer',
          tagline: 'Monthly operating system for growth retainers',
          description:
            'Governance structure for retained marketing leadership engagements including growth planning, analytics reviews, and executive communications.',
          industry: 'marketing',
          workflowType: 'retainer',
          recommendedTeamSize: '2-4 collaborators',
          estimatedDurationDays: 90,
          automationLevel: 58,
          qualityScore: 91.1,
          status: 'active',
          visibility: 'public',
          clientExperience:
            'Clients see rolling 90-day plans, automated MBR decks, and escalation logs with transparent ownership.',
          requirementChecklist: [
            'Baseline metrics dashboard connected to source-of-truth analytics.',
            'Executive sponsor and operating committee defined.',
            'Legal and procurement approvals stored with renewal dates.',
            'Access to marketing automation and CRM systems provisioned.',
          ],
          onboardingSequence: [
            {
              step: 'Retainer kickoff',
              owner: 'Engagement lead',
              automation: 'Recurring Notion agenda generated with exec summary template.',
            },
            {
              step: 'Systems access audit',
              owner: 'Operations',
              automation: 'Checklist automation ensures SSO and compliance forms completed.',
            },
            {
              step: 'Monthly business review cadence',
              owner: 'Growth strategist',
              automation: 'Google Slides deck pre-populated with KPI widgets each month.',
            },
          ],
          deliverables: [
            '90-day growth roadmap with channel owners.',
            'Monthly business review reports and recordings.',
            'Experiment backlog with prioritisation rubric.',
            'Risk and escalation register with mitigations.',
          ],
          metrics: [
            {
              name: 'Pipeline contribution',
              target: 30,
              unit: 'percent',
              description: 'Share of marketing sourced pipeline vs. target.',
            },
            {
              name: 'Retention health score',
              target: 4.2,
              unit: 'avg rating',
              description: 'Quarterly executive satisfaction survey rating.',
            },
          ],
          metadata: {
            workspaceType: 'freelancer',
            suggestedTools: ['HubSpot', 'Looker Studio', 'Airtable', 'Asana'],
            maturity: 'production_ready',
          },
          lastPublishedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert(TEMPLATE_TABLE, templates, { transaction });

      const stages = [
        {
          id: 1,
          templateId: 1,
          slug: 'intake-and-strategy',
          title: 'Intake & brand strategy',
          stageType: 'intake',
          sortOrder: 1,
          description: 'Run discovery interviews, align on goals, and translate insights into positioning pillars.',
          checklists: [
            'Discovery interviews scheduled and recorded.',
            'Competitive audit completed with SWOT summary.',
            'Brand promise and voice attributes drafted for review.',
          ],
          questionnaires: [
            {
              title: 'Brand discovery survey',
              questions: 18,
              delivery: 'Typeform',
            },
          ],
          automations: [
            'CRM workflow logs questionnaire completion and notifies account team.',
            'Asana intake project created with tasks for strategy, design, and copy.',
          ],
          deliverables: [
            'Positioning brief with messaging architecture.',
            'Stakeholder alignment summary deck.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          templateId: 1,
          slug: 'visual-identity-production',
          title: 'Visual identity production',
          stageType: 'production',
          sortOrder: 2,
          description: 'Iterate on concept boards, refine design systems, and prepare feedback-ready prototypes.',
          checklists: [
            'Concept board shortlist approved by stakeholders.',
            'Primary and secondary color palette validated for accessibility.',
            'Typography scale tested across web and print examples.',
          ],
          questionnaires: [
            {
              title: 'Visual preference alignment',
              questions: 12,
              delivery: 'Google Forms',
            },
          ],
          automations: [
            'Figma project duplicated with preset page templates.',
            'Review sessions auto-scheduled with Loom recordings for async feedback.',
          ],
          deliverables: [
            'High-fidelity identity kit with usage rules.',
            'Logo exports for dark/light/background variations.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 3,
          templateId: 1,
          slug: 'launch-activation',
          title: 'Launch activation',
          stageType: 'delivery',
          sortOrder: 3,
          description: 'Enable client teams with rollout roadmap, asset packages, and governance guardrails.',
          checklists: [
            'Launch playbook approved by exec stakeholders.',
            'Asset delivery packages uploaded to workspace vault.',
            'QA performed on digital touchpoints with updated branding.',
          ],
          questionnaires: [],
          automations: [
            'Notion launch hub published with dependencies and responsibilities.',
            'Slack channel notifications orchestrated for go-live and follow-up.',
          ],
          deliverables: [
            'Launch communications calendar.',
            'Post-launch retrospective template.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 4,
          templateId: 2,
          slug: 'research-and-definition',
          title: 'Research & definition',
          stageType: 'intake',
          sortOrder: 1,
          description: 'Capture problem statements, user insights, and success measures that guide the sprint.',
          checklists: [
            'Jobs-to-be-done statements validated with client team.',
            'Analytics baseline report uploaded for key funnels.',
            'Success metrics translated into measurable KPIs.',
          ],
          questionnaires: [
            {
              title: 'Stakeholder alignment pulse',
              questions: 10,
              delivery: 'SurveyMonkey',
            },
          ],
          automations: [
            'Research consent forms generated for interview participants.',
            'Slack reminder bot keeps alignment responses above 80% completion.',
          ],
          deliverables: [
            'Sprint brief with prioritised hypotheses.',
            'Research synthesis mural board.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 5,
          templateId: 2,
          slug: 'design-and-validation',
          title: 'Design & validation',
          stageType: 'production',
          sortOrder: 2,
          description: 'Prototype target experiences, test with real users, and calibrate solution direction.',
          checklists: [
            'Prototype covers golden path and key edge cases.',
            'Usability test scripts approved and scheduled.',
            'Feedback synthesis captured within 48 hours of sessions.',
          ],
          questionnaires: [
            {
              title: 'User testing feedback form',
              questions: 14,
              delivery: 'Dovetail',
            },
          ],
          automations: [
            'Prototype links auto-shared with password protection to stakeholders.',
            'Insight tags pushed into Notion database for prioritisation.',
          ],
          deliverables: [
            'Validated prototype annotated for engineering.',
            'Design decisions log with trade-off rationale.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 6,
          templateId: 2,
          slug: 'engineering-handoff-and-launch',
          title: 'Engineering handoff & launch',
          stageType: 'delivery',
          sortOrder: 3,
          description: 'Translate sprint outcomes into build-ready assets, QA scripts, and growth experiments.',
          checklists: [
            'Acceptance criteria documented for each story.',
            'Analytics tags configured and validated in staging.',
            'Launch experiment backlog prioritised with ICE scores.',
          ],
          questionnaires: [],
          automations: [
            'Linear issues generated automatically from annotated frames.',
            'QA scripts synced with TestRail for regression tracking.',
          ],
          deliverables: [
            'Technical handoff pack with Loom walkthroughs.',
            'Launch monitoring dashboard template.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 7,
          templateId: 3,
          slug: 'retainer-onboarding',
          title: 'Retainer onboarding',
          stageType: 'intake',
          sortOrder: 1,
          description: 'Set expectations, capture baseline metrics, and align governance cadence for the retainer.',
          checklists: [
            'Executive sponsor confirmed and introduced to delivery team.',
            'Baseline KPI dashboard reviewed and targets agreed.',
            'Compliance checklist completed for data access and security.',
          ],
          questionnaires: [
            {
              title: 'Executive goals intake',
              questions: 8,
              delivery: 'Typeform',
            },
          ],
          automations: [
            'Recurring leadership sync created with Zoom + agenda template.',
            'Access provisioning checklist triggered in ITSM tool.',
          ],
          deliverables: [
            'Retainer charter and governance model.',
            'Stakeholder map with communication cadences.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 8,
          templateId: 3,
          slug: 'monthly-operations',
          title: 'Monthly operations',
          stageType: 'production',
          sortOrder: 2,
          description: 'Run monthly planning, backlog grooming, and analytics review rituals.',
          checklists: [
            'Monthly business review deck updated with latest KPIs.',
            'Experiment backlog re-prioritised and dependencies resolved.',
            'Risks and escalations reviewed with mitigation owners.',
          ],
          questionnaires: [
            {
              title: 'Executive sentiment pulse',
              questions: 6,
              delivery: 'Google Forms',
            },
          ],
          automations: [
            'MBR deck auto-populated with Looker Studio snapshots.',
            'Reminder series nudges channel owners for metric updates 3 days before MBR.',
          ],
          deliverables: [
            'Monthly business review recording & notes.',
            'Updated growth roadmap with status markers.',
          ],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 9,
          templateId: 3,
          slug: 'quarterly-retro',
          title: 'Quarterly retrospective',
          stageType: 'retro',
          sortOrder: 3,
          description: 'Celebrate wins, surface lessons learned, and recalibrate strategic priorities.',
          checklists: [
            'Quarterly metrics analysed against targets.',
            'Client satisfaction survey circulated and summarised.',
            'Next-quarter bets aligned with executive steering group.',
          ],
          questionnaires: [
            {
              title: 'Retrospective feedback survey',
              questions: 9,
              delivery: 'Typeform',
            },
          ],
          automations: [
            'Retro board template duplicated with prompts and breakouts.',
            'Celebration shoutouts posted automatically to client Slack channel.',
          ],
          deliverables: [
            'Quarterly retrospective report.',
            'Updated OKR snapshot and focus areas.',
          ],
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert(STAGE_TABLE, stages, { transaction });

      const resources = [
        {
          id: 1,
          templateId: 1,
          title: 'Brand kickoff agenda',
          resourceType: 'sop',
          url: 'https://workspace.gigvora.example.com/templates/brand-kickoff-agenda',
          description: 'Step-by-step facilitation guide for the 90-minute kickoff session.',
          metadata: { durationMinutes: 90, owner: 'Strategy' },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          templateId: 1,
          title: 'Visual identity QA checklist',
          resourceType: 'checklist',
          url: 'https://workspace.gigvora.example.com/templates/visual-identity-qa',
          description: 'Accessibility and technical QA checks for all exported assets.',
          metadata: { coverage: 'WCAG 2.1 AA' },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 3,
          templateId: 2,
          title: 'Sprint burndown dashboard',
          resourceType: 'automation',
          url: 'https://workspace.gigvora.example.com/automations/sprint-burndown',
          description: 'Prebuilt Looker dashboard with API sync to Linear for burndown tracking.',
          metadata: { integration: 'Linear', refreshIntervalMinutes: 15 },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 4,
          templateId: 2,
          title: 'Prototype feedback form',
          resourceType: 'questionnaire',
          url: 'https://workspace.gigvora.example.com/questionnaires/prototype-feedback',
          description: 'Validated feedback form for usability test participants with scoring rubric.',
          metadata: { questionCount: 14, tool: 'Dovetail' },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 5,
          templateId: 3,
          title: 'Retainer governance playbook',
          resourceType: 'sop',
          url: 'https://workspace.gigvora.example.com/playbooks/retainer-governance',
          description: 'Policy pack covering escalation paths, approval matrices, and cadence expectations.',
          metadata: { version: '2.4.1', owner: 'Engagement lead' },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 6,
          templateId: 3,
          title: 'Executive satisfaction pulse survey',
          resourceType: 'questionnaire',
          url: 'https://workspace.gigvora.example.com/questionnaires/executive-sat',
          description: 'Automated monthly pulse sent to executive sponsors to gauge sentiment.',
          metadata: { schedule: 'Monthly', questionCount: 6 },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert(RESOURCE_TABLE, resources, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(RESOURCE_TABLE, { templateId: [1, 2, 3] }, { transaction });
      await queryInterface.bulkDelete(STAGE_TABLE, { templateId: [1, 2, 3] }, { transaction });
      await queryInterface.bulkDelete(TEMPLATE_TABLE, { slug: templateSlugs }, { transaction });
      await queryInterface.bulkDelete(CATEGORY_TABLE, { slug: categorySlugs }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
