import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../../components/DataStatus.jsx';
import TagInput from '../../components/TagInput.jsx';
import {
  fetchFreelancerProfileHub,
  saveFreelancerExpertiseAreas,
  saveFreelancerHeroBanners,
  saveFreelancerSuccessMetrics,
  saveFreelancerTestimonials,
} from '../../services/freelancerProfileHub.js';

const DEFAULT_FREELANCER_ID = 1;
const DEFAULT_AVAILABLE_DASHBOARDS = ['freelancer', 'user', 'agency'];

const EXPERTISE_STATUS_OPTIONS = [
  { value: 'live', label: 'Live' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'needs_decision', label: 'Needs decision' },
  { value: 'archived', label: 'Archived' },
];

const METRIC_TREND_OPTIONS = [
  { value: 'up', label: 'Trending up' },
  { value: 'steady', label: 'Steady' },
  { value: 'down', label: 'Trending down' },
];

const TESTIMONIAL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const HERO_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'testing', label: 'Testing' },
  { value: 'live', label: 'Live' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

const initialExpertiseDraft = {
  title: '',
  description: '',
  status: 'live',
  tags: [],
  recommendations: [],
};

const initialSuccessDraft = {
  label: '',
  value: '',
  delta: '',
  target: '',
  trend: 'steady',
};

const initialTestimonialDraft = {
  client: '',
  role: '',
  company: '',
  project: '',
  quote: '',
  status: 'draft',
};

const initialHeroDraft = {
  title: '',
  headline: '',
  audience: '',
  status: 'planned',
  ctaLabel: '',
  ctaUrl: '',
  gradient: '',
};

function formatStatus(value) {
  if (!value) return '';
  return value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function expertiseStatusStyles(status) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'in_progress':
      return 'bg-amber-100 text-amber-700';
    case 'needs_decision':
      return 'bg-rose-100 text-rose-700';
    case 'archived':
    default:
      return 'bg-slate-200 text-slate-600';
  }
}

function testimonialStatusStyles(status) {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-700';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700';
    case 'draft':
      return 'bg-slate-200 text-slate-600';
    case 'archived':
    default:
      return 'bg-slate-200 text-slate-600';
  }
}

function heroStatusStyles(status) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'testing':
      return 'bg-blue-100 text-blue-700';
    case 'paused':
      return 'bg-amber-100 text-amber-700';
    case 'archived':
      return 'bg-slate-200 text-slate-600';
    case 'planned':
    default:
      return 'bg-slate-100 text-slate-500';
  }
}

function tractionToneStyles(tone) {
  switch (tone) {
    case 'positive':
      return 'text-emerald-600';
    case 'negative':
      return 'text-rose-600';
    default:
      return 'text-slate-600';
  }
}

function metricTrendTextClasses(trend) {
  switch (trend) {
    case 'up':
      return 'text-emerald-600';
    case 'down':
      return 'text-rose-600';
    default:
      return 'text-slate-500';
  }
}

function buildMenuSections(summary = {}) {
  const retainerCount = summary.retainerCount ?? 0;
  const launchpadGigCount = summary.launchpadGigCount ?? 0;
  const heroBannersLive = summary.heroBannersLive ?? 0;
  const testimonialsPublished = summary.testimonialsPublished ?? 0;
  const expertiseLiveCount = summary.expertiseLiveCount ?? 0;
  const successMetricCount = summary.successMetricCount ?? 0;

  return [
    {
      label: 'Service delivery',
      items: [
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
          description: `Monitor ${launchpadGigCount} launchpad gigs, delivery milestones, bundled services, and upsells.`,
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
          description: `Update ${expertiseLiveCount} live expertise themes, ${successMetricCount} success metrics, and ${heroBannersLive} hero banners with ${testimonialsPublished} published testimonials.`,
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
}

function mapExpertiseForUpdate(area, index) {
  return {
    id: area.id,
    slug: area.slug,
    title: area.title,
    description: area.description,
    status: area.status,
    tags: area.tags,
    recommendations: area.recommendations,
    traction: area.traction,
    healthScore: area.healthScore,
    displayOrder: area.displayOrder ?? index,
  };
}

function mapMetricForUpdate(metric, index) {
  return {
    id: metric.id,
    metricKey: metric.metricKey,
    label: metric.label,
    value: metric.value,
    numericValue: metric.numericValue,
    delta: metric.delta,
    target: metric.target,
    trend: metric.trend,
    breakdown: metric.breakdown,
    periodStart: metric.period?.start ?? null,
    periodEnd: metric.period?.end ?? null,
    displayOrder: metric.displayOrder ?? index,
  };
}

function mapTestimonialForUpdate(testimonial, index) {
  return {
    id: testimonial.id,
    testimonialKey: testimonial.testimonialKey,
    client: testimonial.client,
    role: testimonial.role,
    company: testimonial.company,
    project: testimonial.project,
    quote: testimonial.quote,
    status: testimonial.status,
    metrics: testimonial.metrics ?? [],
    isFeatured: testimonial.isFeatured,
    nextAction: testimonial.nextAction,
    curationNotes: testimonial.curationNotes,
    requestedAt: testimonial.requestedAt ?? null,
    recordedAt: testimonial.recordedAt ?? null,
    publishedAt: testimonial.publishedAt ?? null,
    displayOrder: testimonial.displayOrder ?? index,
  };
}

function mapHeroForUpdate(banner, index) {
  return {
    id: banner.id,
    bannerKey: banner.bannerKey,
    title: banner.title,
    headline: banner.headline,
    audience: banner.audience,
    status: banner.status,
    cta: banner.cta ?? { label: null, url: null },
    gradient: banner.gradient,
    metrics: banner.metrics ?? [],
    experimentId: banner.experimentId,
    backgroundImageUrl: banner.backgroundImageUrl,
    conversionTarget: banner.conversionTarget,
    lastLaunchedAt: banner.lastLaunchedAt ?? null,
    displayOrder: banner.displayOrder ?? index,
  };
}
const capabilitySections = [
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
          'Standard operating procedures and checklists for repeat work.',
          'Client welcome sequences and kickoff survey automation.',
        ],
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

export default function FreelancerDashboardPage() {
  const freelancerId = DEFAULT_FREELANCER_ID;
  const [expertiseFormOpen, setExpertiseFormOpen] = useState(false);
  const [expertiseDraft, setExpertiseDraft] = useState(initialExpertiseDraft);
  const [expertiseSaving, setExpertiseSaving] = useState(false);
  const [expertiseError, setExpertiseError] = useState(null);

  const [metricFormOpen, setMetricFormOpen] = useState(false);
  const [metricDraft, setMetricDraft] = useState(initialSuccessDraft);
  const [metricSaving, setMetricSaving] = useState(false);
  const [metricError, setMetricError] = useState(null);

  const [testimonialFormOpen, setTestimonialFormOpen] = useState(false);
  const [testimonialDraft, setTestimonialDraft] = useState(initialTestimonialDraft);
  const [testimonialSaving, setTestimonialSaving] = useState(false);
  const [testimonialError, setTestimonialError] = useState(null);

  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [heroDraft, setHeroDraft] = useState(initialHeroDraft);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroError, setHeroError] = useState(null);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `dashboard:freelancer:profile-hub:${freelancerId}`,
    ({ signal, force }) => fetchFreelancerProfileHub(freelancerId, { signal, force }),
    { ttl: 1000 * 60 },
  );

  const summary = data?.summary ?? {
    retainerCount: 0,
    launchpadGigCount: 0,
    heroBannersLive: 0,
    testimonialsPublished: 0,
    expertiseLiveCount: 0,
    successMetricCount: 0,
  };

  const expertiseAreas = Array.isArray(data?.expertiseAreas) ? data.expertiseAreas : [];
  const successMetrics = Array.isArray(data?.successMetrics) ? data.successMetrics : [];
  const testimonials = Array.isArray(data?.testimonials) ? data.testimonials : [];
  const heroBanners = Array.isArray(data?.heroBanners) ? data.heroBanners : [];

  const menuSections = useMemo(() => buildMenuSections(summary), [summary]);
  const profileCard = data?.sidebarProfile ?? {
    name: 'Freelancer',
    role: 'Independent professional',
    initials: 'FR',
    status: 'Availability: Limited',
    badges: ['Gigvora member'],
    metrics: [
      { label: 'Active retainers', value: '0' },
      { label: 'Launchpad gigs', value: '0' },
      { label: 'Avg. CSAT', value: 'N/A' },
      { label: 'Net-new revenue (90d)', value: '$0' },
    ],
  };
  const availableDashboards = data?.availableDashboards ?? DEFAULT_AVAILABLE_DASHBOARDS;

  const handleAddExpertise = async (event) => {
    event.preventDefault();
    if (!expertiseDraft.title.trim()) {
      setExpertiseError('A title is required to create an expertise focus.');
      return;
    }

    setExpertiseSaving(true);
    setExpertiseError(null);
    try {
      const payload = [
        ...expertiseAreas.map(mapExpertiseForUpdate),
        {
          title: expertiseDraft.title.trim(),
          description: expertiseDraft.description.trim(),
          status: expertiseDraft.status,
          tags: expertiseDraft.tags,
          recommendations: expertiseDraft.recommendations,
          traction: [],
        },
      ];
      await saveFreelancerExpertiseAreas(freelancerId, payload);
      await refresh({ force: true });
      setExpertiseDraft(initialExpertiseDraft);
      setExpertiseFormOpen(false);
    } catch (submissionError) {
      setExpertiseError(submissionError?.message ?? 'Unable to save expertise focus.');
    } finally {
      setExpertiseSaving(false);
    }
  };

  const handleAddMetric = async (event) => {
    event.preventDefault();
    if (!metricDraft.label.trim() || !metricDraft.value.trim()) {
      setMetricError('A label and value are required for a success metric.');
      return;
    }

    setMetricSaving(true);
    setMetricError(null);
    try {
      const payload = [
        ...successMetrics.map(mapMetricForUpdate),
        {
          label: metricDraft.label.trim(),
          value: metricDraft.value.trim(),
          delta: metricDraft.delta.trim() || null,
          target: metricDraft.target.trim() || null,
          trend: metricDraft.trend,
          breakdown: [],
        },
      ];
      await saveFreelancerSuccessMetrics(freelancerId, payload);
      await refresh({ force: true });
      setMetricDraft(initialSuccessDraft);
      setMetricFormOpen(false);
    } catch (submissionError) {
      setMetricError(submissionError?.message ?? 'Unable to save success metric.');
    } finally {
      setMetricSaving(false);
    }
  };

  const handleAddTestimonial = async (event) => {
    event.preventDefault();
    if (!testimonialDraft.client.trim() || !testimonialDraft.quote.trim()) {
      setTestimonialError('Client name and quote are required.');
      return;
    }

    setTestimonialSaving(true);
    setTestimonialError(null);
    try {
      const payload = [
        ...testimonials.map(mapTestimonialForUpdate),
        {
          client: testimonialDraft.client.trim(),
          role: testimonialDraft.role.trim() || null,
          company: testimonialDraft.company.trim() || null,
          project: testimonialDraft.project.trim() || null,
          quote: testimonialDraft.quote.trim(),
          status: testimonialDraft.status,
          metrics: [],
        },
      ];
      await saveFreelancerTestimonials(freelancerId, payload);
      await refresh({ force: true });
      setTestimonialDraft(initialTestimonialDraft);
      setTestimonialFormOpen(false);
    } catch (submissionError) {
      setTestimonialError(submissionError?.message ?? 'Unable to save testimonial.');
    } finally {
      setTestimonialSaving(false);
    }
  };

  const handleAddHeroBanner = async (event) => {
    event.preventDefault();
    if (!heroDraft.title.trim() || !heroDraft.headline.trim()) {
      setHeroError('Title and headline are required for a hero banner.');
      return;
    }

    setHeroSaving(true);
    setHeroError(null);
    try {
      const ctaLabel = heroDraft.ctaLabel.trim() || null;
      const ctaUrl = heroDraft.ctaUrl.trim() || null;
      const payload = [
        ...heroBanners.map(mapHeroForUpdate),
        {
          title: heroDraft.title.trim(),
          headline: heroDraft.headline.trim(),
          audience: heroDraft.audience.trim() || null,
          status: heroDraft.status,
          cta: {
            label: ctaLabel,
            url: ctaUrl,
          },
          gradient: heroDraft.gradient.trim() || null,
          metrics: [],
        },
      ];
      await saveFreelancerHeroBanners(freelancerId, payload);
      await refresh({ force: true });
      setHeroDraft(initialHeroDraft);
      setHeroFormOpen(false);
    } catch (submissionError) {
      setHeroError(submissionError?.message ?? 'Unable to save hero banner.');
    } finally {
      setHeroSaving(false);
    }
  };
  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile hub data status</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage expertise focuses, success metrics, testimonials, and hero banners from a unified dashboard view.
            </p>
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error?.message ?? 'Something went wrong while loading the freelancer profile hub.'}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Freelancer profile</p>
              <h2 className="text-2xl font-semibold text-slate-900">Expertise tags &amp; positioning</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Curate the skills marketplace algorithms surface first, highlight differentiators, and archive offers that no longer drive demand.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpertiseFormOpen((open) => !open);
                setExpertiseError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-100"
            >
              {expertiseFormOpen ? 'Close expertise form' : 'Add expertise focus'}
            </button>
          </div>

          {expertiseAreas.length ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {expertiseAreas.map((group) => (
                <div key={group.id ?? group.slug ?? group.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
                      {group.description ? (
                        <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${expertiseStatusStyles(group.status)}`}>
                      {formatStatus(group.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.tags?.length ? (
                      group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs text-slate-400">No tags yet</span>
                    )}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    {group.traction?.length ? (
                      group.traction.map((item) => (
                        <div key={`${group.id ?? group.slug}-${item.label}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <dt className="uppercase tracking-wide text-slate-400">{item.label}</dt>
                          <dd className={`mt-1 text-sm font-semibold ${tractionToneStyles(item.tone)}`}>
                            {item.value}
                          </dd>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-3 text-slate-400">
                        No traction snapshot yet
                      </div>
                    )}
                  </dl>

                  {group.recommendations?.length ? (
                    <div className="mt-5 space-y-2 text-sm text-slate-600">
                      {group.recommendations.map((recommendation) => (
                        <div key={`${group.id ?? group.slug}-rec-${recommendation}`} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          <span>{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-sm text-blue-700">
              No expertise focuses have been recorded yet. Use the form below to define your positioning pillars.
            </div>
          )}

          {expertiseFormOpen ? (
            <form onSubmit={handleAddExpertise} className="mt-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Title
                  <input
                    type="text"
                    value={expertiseDraft.title}
                    onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Signature service pillars"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={expertiseDraft.status}
                    onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, status: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {EXPERTISE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Description
                <textarea
                  value={expertiseDraft.description}
                  onChange={(event) => setExpertiseDraft((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Summarise how this expertise focus helps clients."
                />
              </label>
              <TagInput
                label="Tags"
                items={expertiseDraft.tags}
                onChange={(items) => setExpertiseDraft((prev) => ({ ...prev, tags: items }))}
                placeholder="Add tag"
              />
              <TagInput
                label="Recommendations"
                description="Internal actions or next steps to strengthen this expertise pillar."
                items={expertiseDraft.recommendations}
                onChange={(items) => setExpertiseDraft((prev) => ({ ...prev, recommendations: items }))}
                placeholder="Add recommendation"
              />
              {expertiseError ? (
                <p className="text-sm text-rose-600">{expertiseError}</p>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={expertiseSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {expertiseSaving ? 'Saving…' : 'Save expertise focus'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpertiseFormOpen(false);
                    setExpertiseDraft(initialExpertiseDraft);
                    setExpertiseError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(14,116,144,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600/80">Success metrics</p>
              <h2 className="text-2xl font-semibold text-slate-900">Delivery &amp; reputation scorecard</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track operational excellence against targets before promoting new offers or pitching strategic retainers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMetricFormOpen((open) => !open);
                setMetricError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-100"
            >
              {metricFormOpen ? 'Close metric form' : 'Add success metric'}
            </button>
          </div>

          {successMetrics.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {successMetrics.map((metric) => (
                <div key={metric.id ?? metric.metricKey ?? metric.label} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{metric.label}</h3>
                      {metric.delta ? (
                        <p className={`mt-1 text-xs font-semibold ${metricTrendTextClasses(metric.trend)}`}>
                          {metric.delta}
                        </p>
                      ) : null}
                    </div>
                    {metric.target ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {metric.target}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-6 text-3xl font-semibold text-slate-900">{metric.value}</p>
                  {metric.breakdown?.length ? (
                    <div className="mt-6 grid gap-3 text-xs text-slate-500">
                      {metric.breakdown.map((item) => (
                        <div key={`${metric.id ?? metric.metricKey}-${item.label}`} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="font-medium text-slate-600">{item.label}</p>
                          <p className="mt-1 text-base font-semibold text-slate-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/40 p-6 text-sm text-cyan-700">
              No success metrics have been logged yet. Add key delivery and reputation metrics to track progress.
            </div>
          )}

          {metricFormOpen ? (
            <form onSubmit={handleAddMetric} className="mt-6 space-y-4 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Label
                  <input
                    type="text"
                    value={metricDraft.label}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, label: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="On-time milestone delivery"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Value
                  <input
                    type="text"
                    value={metricDraft.value}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, value: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="98%"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Delta / change
                  <input
                    type="text"
                    value={metricDraft.delta}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, delta: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="+3.4% vs. last quarter"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Target
                  <input
                    type="text"
                    value={metricDraft.target}
                    onChange={(event) => setMetricDraft((prev) => ({ ...prev, target: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    placeholder="Target ≥ 95%"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Trend
                <select
                  value={metricDraft.trend}
                  onChange={(event) => setMetricDraft((prev) => ({ ...prev, trend: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  {METRIC_TREND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {metricError ? <p className="text-sm text-rose-600">{metricError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={metricSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {metricSaving ? 'Saving…' : 'Save success metric'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetricFormOpen(false);
                    setMetricDraft(initialSuccessDraft);
                    setMetricError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(147,51,234,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600/80">Testimonials</p>
              <h2 className="text-2xl font-semibold text-slate-900">Client proof &amp; narrative assets</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Pair written quotes with launchpad-ready assets and ensure every testimonial is attached to a flagship service.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestimonialFormOpen((open) => !open);
                setTestimonialError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-purple-300 bg-purple-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-700 shadow-sm transition hover:border-purple-400 hover:bg-purple-100"
            >
              {testimonialFormOpen ? 'Close testimonial form' : 'Add testimonial'}
            </button>
          </div>

          {testimonials.length ? (
            <div className="mt-6 space-y-4">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id ?? testimonial.testimonialKey ?? testimonial.client} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{testimonial.client}</p>
                      <p className="text-xs text-slate-500">
                        {[testimonial.role, testimonial.project].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${testimonialStatusStyles(testimonial.status)}`}>
                      {formatStatus(testimonial.status)}
                    </span>
                  </div>

                  <blockquote className="mt-3 text-sm italic text-slate-700">“{testimonial.quote}”</blockquote>

                  {testimonial.metrics?.length ? (
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      {testimonial.metrics.map((metric) => (
                        <span key={`${testimonial.id ?? testimonial.testimonialKey}-${metric.label}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1">
                          <span className="font-semibold text-slate-600">{metric.label}:</span>
                          <span className="text-slate-700">{metric.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-6 text-sm text-purple-700">
              No testimonials captured yet. Invite clients to share outcomes and attach assets for launchpad promotion.
            </div>
          )}

          {testimonialFormOpen ? (
            <form onSubmit={handleAddTestimonial} className="mt-6 space-y-4 rounded-2xl border border-purple-200 bg-purple-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Client name
                  <input
                    type="text"
                    value={testimonialDraft.client}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, client: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Noah Patel"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Client role
                  <input
                    type="text"
                    value={testimonialDraft.role}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, role: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Founder, SummitOps"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Company
                  <input
                    type="text"
                    value={testimonialDraft.company}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, company: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="SummitOps"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Project
                  <input
                    type="text"
                    value={testimonialDraft.project}
                    onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, project: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="B2B SaaS brand overhaul"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Quote
                <textarea
                  value={testimonialDraft.quote}
                  onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, quote: event.target.value }))}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="Share the headline impact in the client's own words."
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                  value={testimonialDraft.status}
                  onChange={(event) => setTestimonialDraft((prev) => ({ ...prev, status: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                >
                  {TESTIMONIAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {testimonialError ? <p className="text-sm text-rose-600">{testimonialError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={testimonialSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {testimonialSaving ? 'Saving…' : 'Save testimonial'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestimonialFormOpen(false);
                    setTestimonialDraft(initialTestimonialDraft);
                    setTestimonialError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(245,158,11,0.25)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600/80">Hero banners</p>
              <h2 className="text-2xl font-semibold text-slate-900">Launchpad spotlight creatives</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Refresh primary hero banners by audience, keep conversion metrics visible, and prep the next launch ahead of demand spikes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHeroFormOpen((open) => !open);
                setHeroError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
            >
              {heroFormOpen ? 'Close banner form' : 'Add hero banner'}
            </button>
          </div>

          {heroBanners.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {heroBanners.map((banner) => (
                <div key={banner.id ?? banner.bannerKey ?? banner.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${banner.gradient ?? 'from-slate-200 via-slate-100 to-white'} opacity-20`} />
                  <div className="relative flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{banner.title}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{banner.headline}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${heroStatusStyles(banner.status)}`}>
                        {formatStatus(banner.status)}
                      </span>
                    </div>

                    {banner.audience ? (
                      <p className="text-sm text-slate-600">Audience: {banner.audience}</p>
                    ) : null}
                    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      Primary CTA: {banner.cta?.label ?? 'Configure call-to-action'}
                    </div>

                    <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
                      {banner.metrics?.length ? (
                        banner.metrics.map((metric) => (
                          <div key={`${banner.id ?? banner.bannerKey}-${metric.label}`} className="rounded-xl border border-white/70 bg-white/80 p-3">
                            <dt className="uppercase tracking-wide text-slate-400">{metric.label}</dt>
                            <dd className="mt-1 text-base font-semibold text-slate-900">{metric.value}</dd>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-slate-400">
                          No metrics logged yet
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-sm text-amber-700">
              No hero banners published yet. Add a spotlight banner to promote your flagship services and campaigns.
            </div>
          )}

          {heroFormOpen ? (
            <form onSubmit={handleAddHeroBanner} className="mt-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Title
                  <input
                    type="text"
                    value={heroDraft.title}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, title: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="SaaS launch accelerator"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Audience
                  <input
                    type="text"
                    value={heroDraft.audience}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, audience: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="High-growth tech founders"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Headline
                <input
                  type="text"
                  value={heroDraft.headline}
                  onChange={(event) => setHeroDraft((prev) => ({ ...prev, headline: event.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Design systems that speed up product-market fit"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  CTA label
                  <input
                    type="text"
                    value={heroDraft.ctaLabel}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="Book strategy intensive"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  CTA URL
                  <input
                    type="url"
                    value={heroDraft.ctaUrl}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, ctaUrl: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="https://"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Status
                  <select
                    value={heroDraft.status}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, status: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {HERO_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Gradient utility classes
                  <input
                    type="text"
                    value={heroDraft.gradient}
                    onChange={(event) => setHeroDraft((prev) => ({ ...prev, gradient: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="from-blue-500 via-indigo-500 to-violet-500"
                  />
                </label>
              </div>
              {heroError ? <p className="text-sm text-rose-600">{heroError}</p> : null}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={heroSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {heroSaving ? 'Saving…' : 'Save hero banner'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroFormOpen(false);
                    setHeroDraft(initialHeroDraft);
                    setHeroError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
