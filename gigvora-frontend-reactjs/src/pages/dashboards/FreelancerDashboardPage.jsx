import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import WorkspaceTemplatesSection from '../../components/WorkspaceTemplatesSection.jsx';
import { fetchWorkspaceTemplates } from '../../services/workspaceTemplates.js';

const BASE_MENU_SECTIONS = [
  {
    label: 'Service delivery',
    items: [
      {
        name: 'Workspace templates',
        description: 'Industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        tags: ['templates', 'automation'],
        href: '#workspace-templates',
      },
      {
        name: 'Project workspace dashboard',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
      },
      {
        name: 'Finance & insights',
        description: 'Revenue analytics, payout history, taxes, and profitability dashboards.',
      },
    ],
  },
];

const BASE_CAPABILITY_SECTIONS = [
  {
    title: 'Project workspace excellence',
    description:
      'Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals.',
    features: [
      {
        name: 'Workspace templates',
        description:
          'Kickstart delivery with industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        bulletPoints: [
          'Pre-built workspace layouts for marketing, product design, development, video, and consulting practices.',
          'Standard operating procedures with reusable task lists, dependencies, and milestone sign-offs.',
          'Interactive requirement questionnaires that branch based on client inputs and service tiers.',
          'Client welcome sequences with automated kickoff surveys, contract packets, and onboarding videos.',
          'Role-based permissions and assignment presets for collaborators, reviewers, and finance approvers.',
          'Template governance that tracks revisions, owners, and adoption analytics across your team.',
        ],
        callout: 'Launch new client workspaces in minutes while keeping delivery standards consistent.',
      },
      {
        name: 'Task & sprint manager',
        description:
          'Run sprints, Kanban boards, and timeline views with burn charts, dependencies, and backlog grooming.',
        bulletPoints: [
          'Time tracking per task with billable vs. non-billable flags.',
          'Risk registers and change request approvals with e-signatures.',
        ],
      },
      {
        name: 'Collaboration cockpit',
        description:
          'Host video rooms, creative proofing, code repositories, and AI assistants for documentation and QA.',
        bulletPoints: [
          'Inline annotations on files, prototypes, and project demos.',
          'Client-specific permissions with comment-only or edit access.',
        ],
      },
      {
        name: 'Deliverable vault',
        description:
          'Secure storage with version history, watermarking, NDA controls, and automated delivery packages.',
        bulletPoints: [
          'Auto-generate delivery summaries with success metrics.',
          'Long-term archiving and compliance exports.',
        ],
      },
    ],
  },
  {
    title: 'Gig marketplace operations',
    description:
      'Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews.',
    features: [
      {
        name: 'Gig builder',
        description:
          'Design irresistible gig pages with tiered pricing, add-ons, gallery media, and conversion-tested copy.',
        bulletPoints: [
          'Freelancer banner creator with dynamic call-to-actions.',
          'Preview modes for desktop, tablet, and mobile experiences.',
        ],
      },
      {
        name: 'Order pipeline',
        description:
          'Monitor incoming orders, qualification forms, kickoff calls, and delivery status from inquiry to completion.',
        bulletPoints: [
          'Automated requirement forms and revision workflows.',
          'Escrow release checkpoints tied to client satisfaction.',
        ],
      },
      {
        name: 'Client success automation',
        description:
          'Trigger onboarding sequences, educational drip emails, testimonials, and referral programs automatically.',
        bulletPoints: [
          'Smart nudges for review requests post-delivery.',
          'Affiliate and referral tracking per gig.',
        ],
      },
      {
        name: 'Catalog insights',
        description:
          'See conversion rates, top-performing gig bundles, repeat clients, and cross-sell opportunities at a glance.',
        bulletPoints: [
          'Margin calculator factoring software costs and subcontractors.',
          'Heatmaps of search keywords driving gig impressions.',
        ],
      },
    ],
  },
  {
    title: 'Finance, compliance, & reputation',
    description:
      'Get paid fast while staying compliant. Monitor cash flow, taxes, contracts, and reputation programs across clients.',
    features: [
      {
        name: 'Finance control tower',
        description:
          'Revenue breakdowns, tax-ready exports, expense tracking, and smart savings goals for benefits or downtime.',
        bulletPoints: [
          'Split payouts between teammates or subcontractors instantly.',
          'Predictive forecasts for retainers vs. one-off gigs.',
        ],
      },
      {
        name: 'Contract & compliance locker',
        description:
          'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
        bulletPoints: [
          'Automated reminders for renewals and insurance certificates.',
          'Localization for GDPR, SOC2, and freelancer classifications.',
        ],
      },
      {
        name: 'Reputation engine',
        description:
          'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
        bulletPoints: [
          'Custom badges and banners for featured freelancer programs.',
          'Shareable review widgets for external websites.',
        ],
      },
      {
        name: 'Support & dispute desk',
        description:
          'Resolve client concerns, manage escalations, and collaborate with Gigvora support for smooth resolutions.',
        bulletPoints: [
          'Conversation transcripts linked back to gig orders.',
          'Resolution playbooks to keep satisfaction high.',
        ],
      },
    ],
  },
  {
    title: 'Growth, partnerships, & skills',
    description:
      'Scale your business with targeted marketing, agency partnerships, continuous learning, and community mentoring.',
    features: [
      {
        name: 'Pipeline CRM',
        description:
          'Track leads, proposals, follow-ups, and cross-selling campaigns separate from gig orders.',
        bulletPoints: [
          'Kanban views by industry, retainer size, or probability.',
          'Proposal templates with case studies and ROI calculators.',
        ],
      },
      {
        name: 'Agency alliance manager',
        description:
          'Collaborate with agencies, share resource calendars, negotiate revenue splits, and join pods for large engagements.',
        bulletPoints: [
          'Rate card sharing with version history and approvals.',
          'Resource heatmaps showing bandwidth across weeks.',
        ],
      },
      {
        name: 'Learning and certification hub',
        description:
          'Access curated courses, peer mentoring sessions, and skill gap diagnostics tied to your service lines.',
        bulletPoints: [
          'Certification tracker with renewal reminders.',
          'AI recommendations for new service offerings.',
        ],
      },
      {
        name: 'Community spotlight',
        description:
          'Showcase contributions, speaking engagements, and open-source work with branded banners and social share kits.',
        bulletPoints: [
          'Automated newsletter features for top-performing freelancers.',
          'Personalized marketing assets ready for social channels.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Riley Morgan',
  role: 'Lead Brand & Product Designer',
  initials: 'RM',
  status: 'Top-rated freelancer',
  badges: ['Verified Pro', 'Gigvora Elite'],
  metrics: [
    { label: 'Active projects', value: '6' },
    { label: 'Gigs fulfilled', value: '148' },
    { label: 'Avg. CSAT', value: '4.9/5' },
    { label: 'Monthly revenue', value: '$18.4k' },
  ],
};

const availableDashboards = ['freelancer', 'user', 'agency'];

export default function FreelancerDashboardPage() {
  const [templatesState, setTemplatesState] = useState({ data: null, loading: true, error: null });
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState(null);

  const loadTemplates = useCallback(() => {
    setTemplatesState((previous) => ({ ...previous, loading: true, error: null }));

    fetchWorkspaceTemplates({ workspaceType: 'freelancer', includeStages: true, includeResources: true })
      .then((payload) => {
        setTemplatesState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        setTemplatesState({
          data: null,
          loading: false,
          error: error.message ?? 'Unable to load workspace templates.',
        });
      });
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const templates = templatesState.data?.templates ?? [];
  const categories = templatesState.data?.categories ?? [];
  const meta = templatesState.data?.meta ?? null;
  const stats = templatesState.data?.stats ?? null;

  useEffect(() => {
    if (templatesState.loading || templatesState.error) {
      return;
    }
    if (!templates.length) {
      setSelectedTemplateSlug(null);
      return;
    }
    setSelectedTemplateSlug((current) => {
      if (current && templates.some((template) => template.slug === current)) {
        return current;
      }
      return templates[0].slug;
    });
  }, [templatesState.loading, templatesState.error, templates]);

  useEffect(() => {
    if (activeCategory === 'all') {
      return;
    }
    const availableSlugs = new Set(categories.map((category) => category.slug));
    if (!availableSlugs.has(activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') {
      return templates;
    }
    return templates.filter((template) => template.category?.slug === activeCategory);
  }, [templates, activeCategory]);

  useEffect(() => {
    if (templatesState.loading) {
      return;
    }
    if (!filteredTemplates.length) {
      if (!templates.length) {
        setSelectedTemplateSlug(null);
      }
      return;
    }

    setSelectedTemplateSlug((current) => {
      if (current && filteredTemplates.some((template) => template.slug === current)) {
        return current;
      }
      return filteredTemplates[0].slug;
    });
  }, [filteredTemplates, templates.length, templatesState.loading]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateSlug) {
      return filteredTemplates[0] ?? null;
    }
    return (
      filteredTemplates.find((template) => template.slug === selectedTemplateSlug) ??
      templates.find((template) => template.slug === selectedTemplateSlug) ??
      filteredTemplates[0] ??
      null
    );
  }, [filteredTemplates, selectedTemplateSlug, templates]);

  const templatesTotal = templatesState.data?.stats?.totalTemplates ?? templates.length;

  const menuSections = useMemo(() => {
    return BASE_MENU_SECTIONS.map((section) => {
      if (section.label !== 'Service delivery') {
        return section;
      }
      return {
        ...section,
        items: section.items.map((item) => {
          if (item.name !== 'Workspace templates') {
            return item;
          }
          const dynamicDescription = templatesTotal
            ? `Spin up ${templatesTotal} ready-to-use workspaces with questionnaires and automated onboarding flows.`
            : item.description;
          return {
            ...item,
            description: dynamicDescription,
          };
        }),
      };
    });
  }, [templatesTotal]);

  const workspaceTemplateSection = useMemo(
    () => ({
      id: 'workspace-templates',
      title: 'Workspace template library',
      description:
        'Kickstart delivery with production-ready playbooks, interactive questionnaires, and automated onboarding journeys tailored to your service lines.',
      meta: templatesTotal ? `${templatesTotal} production-ready templates` : undefined,
      render: () => (
        <WorkspaceTemplatesSection
          categories={categories}
          templates={filteredTemplates}
          stats={stats}
          meta={meta}
          loading={templatesState.loading}
          error={templatesState.error}
          onRetry={loadTemplates}
          activeCategory={activeCategory}
          onCategoryChange={(slug) => setActiveCategory(slug)}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={(slug) => setSelectedTemplateSlug(slug)}
        />
      ),
    }),
    [
      activeCategory,
      categories,
      filteredTemplates,
      loadTemplates,
      meta,
      selectedTemplate,
      stats,
      templatesState.error,
      templatesState.loading,
      templatesTotal,
    ],
  );

  const sections = useMemo(() => [workspaceTemplateSection, ...BASE_CAPABILITY_SECTIONS], [workspaceTemplateSection]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={sections}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
