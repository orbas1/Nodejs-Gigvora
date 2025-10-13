import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { useCommunitySpotlight } from '../../hooks/useCommunitySpotlight.js';

const BASE_MENU_SECTIONS = [
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
      {
        name: 'Community spotlight studio',
        description: 'Campaign analytics, newsletter automation, and social share kits for your brand.',
        tags: ['marketing'],
        sectionId: 'community-spotlight',
      },
    ],
  },
];

const BASE_CAPABILITY_SECTIONS = [
  {
    id: 'project-workspace-excellence',
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
    id: 'gig-marketplace-operations',
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
    id: 'finance-compliance-reputation',
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
    id: 'growth-partnerships-skills',
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
        name: 'Mentorship & community',
        description:
          'Share expertise through community events, spotlight campaigns, and Launchpad mentorship.',
        bulletPoints: [
          'Coordinate speaking engagements and roundtables.',
          'Community health dashboards and recognition programs.',
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
  userId: 2,
};

const availableDashboards = ['freelancer', 'user', 'agency'];

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});
const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatCompactNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return compactNumberFormatter.format(Number(value));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return percentFormatter.format(numeric);
}

function formatMetricValue(metric) {
  if (!metric || metric.value == null) {
    return '—';
  }
  if (metric.format === 'percentage') {
    return formatPercent(metric.value) ?? '—';
  }
  return metric.unit ? `${formatCompactNumber(metric.value)} ${metric.unit}` : formatCompactNumber(metric.value);
}

function formatMetricTrend(metric) {
  if (!metric) {
    return null;
  }
  const hasChange = metric.change != null && Number.isFinite(Number(metric.change));
  const trendLabel = metric.trendLabel ?? null;
  if (!hasChange) {
    return trendLabel;
  }
  const percentage = Number(metric.change) * 100;
  const rounded = Math.round(percentage * 10) / 10;
  const changeText = `${rounded >= 0 ? '+' : ''}${rounded}%`;
  return trendLabel ? `${changeText} ${trendLabel}` : changeText;
}

function formatHighlightType(type) {
  if (!type) {
    return 'Highlight';
  }
  return type
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateMonthYear(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return monthYearFormatter.format(date);
}

function formatDateFull(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return fullDateFormatter.format(date);
}

function buildCommunitySection({ data, loading, error, refresh }) {
  const spotlight = data?.spotlight ?? null;
  const remoteProfile = data?.profile ?? null;

  if (loading && !spotlight) {
    return {
      id: 'community-spotlight',
      title: 'Community spotlight studio',
      description: 'Loading personalised community spotlight analytics and assets…',
      features: [
        {
          name: 'Preparing campaign insights',
          description: 'We are syncing the latest reach metrics, highlights, and marketing kits for your spotlight.',
          bulletPoints: [
            'Campaign analytics and reach reporting',
            'Newsletter automation performance',
            'Share-ready creative assets',
          ],
        },
      ],
    };
  }

  if (error && !spotlight) {
    return {
      id: 'community-spotlight',
      title: 'Community spotlight studio',
      description: 'We were unable to load the community spotlight data right now.',
      features: [
        {
          name: 'Retry loading spotlight',
          description: error.message ?? 'Please try again in a few moments.',
          actions: [
            {
              label: 'Try again',
              variant: 'primary',
              onClick: () => refresh?.({ force: true }),
            },
          ],
        },
      ],
    };
  }

  if (!spotlight) {
    return {
      id: 'community-spotlight',
      title: 'Community spotlight studio',
      description:
        'Activate Gigvora’s marketing toolkit to publish your success stories, automate newsletter placements, and share branded assets.',
      features: [
        {
          name: 'Launch your spotlight',
          description:
            'Connect with the Gigvora marketing team to set up branded banners, newsletter features, and social media kits.',
          actions: [
            {
              label: 'Request spotlight onboarding',
              variant: 'primary',
              href: 'https://gigvora.com/community',
            },
          ],
        },
      ],
    };
  }

  const metrics = (spotlight.performanceSummary ?? []).slice(0, 3).map((metric) => ({
    label: metric.label,
    value: formatMetricValue(metric),
    trend: formatMetricTrend(metric),
  }));

  const highlights = (spotlight.highlights ?? []).slice(0, 3).map((highlight) => ({
    title: highlight.title,
    type: formatHighlightType(highlight.category),
    date: formatDateMonthYear(highlight.occurredOn),
    impact: highlight.impactStatement ?? highlight.description,
  }));

  const assets = (spotlight.assets ?? []).slice(0, 4).map((asset) => ({
    name: asset.name,
    description: asset.description,
    format: asset.format ?? asset.channel?.toUpperCase?.() ?? null,
    href: asset.downloadUrl ?? asset.previewUrl ?? spotlight.shareKitUrl ?? null,
  }));

  const latestEdition = spotlight.newsletter?.latest ?? null;
  const upcomingEdition = spotlight.newsletter?.upcoming ?? null;
  const automation = spotlight.newsletter?.automation ?? {};

  const newsletterHighlights = [];
  if (automation.enabled) {
    const cadence = automation.cadence ? automation.cadence : 'weekly';
    const segments = Array.isArray(automation.segments) && automation.segments.length
      ? automation.segments.join(', ')
      : 'targeted segments';
    newsletterHighlights.push(`Automated ${cadence} sends to ${segments}.`);
  }
  if (latestEdition) {
    const latestDate = formatDateFull(latestEdition.editionDate) ?? 'recently';
    const latestCtr = formatPercent(latestEdition.performanceMetrics?.clickRate) ?? 'strong';
    newsletterHighlights.push(`Latest edition ${latestEdition.editionName ?? ''} (${latestDate}) delivered a ${latestCtr} click rate.`.trim());
  }
  if (upcomingEdition) {
    const scheduledDate = formatDateFull(upcomingEdition.editionDate) ?? 'soon';
    const cta = upcomingEdition.callToActionLabel ?? 'View spotlight';
    newsletterHighlights.push(`Next feature scheduled ${scheduledDate} with CTA “${cta}”.`);
  }
  if (!newsletterHighlights.length) {
    newsletterHighlights.push('Connect newsletter automation to schedule your first spotlight placement.');
  }

  const actions = [
    spotlight.primaryCtaLabel && spotlight.primaryCtaUrl
      ? {
          label: spotlight.primaryCtaLabel,
          variant: 'primary',
          href: spotlight.primaryCtaUrl,
        }
      : null,
    spotlight.secondaryCtaLabel && spotlight.secondaryCtaUrl
      ? {
          label: spotlight.secondaryCtaLabel,
          variant: 'secondary',
          href: spotlight.secondaryCtaUrl,
        }
      : null,
    spotlight.shareKitUrl
      ? {
          label: 'Download press kit',
          variant: 'ghost',
          href: spotlight.shareKitUrl,
        }
      : null,
  ].filter(Boolean);

  const callout =
    spotlight.tagline ||
    (latestEdition
      ? `${latestEdition.editionName ?? 'Latest edition'} sent ${formatDateFull(latestEdition.editionDate) ?? 'recently'}`
      : undefined);

  return {
    id: 'community-spotlight',
    title: 'Community spotlight studio',
    description:
      spotlight.summary ??
      'Gigvora’s marketing engine packages your achievements with campaign analytics, newsletter automation, and share-ready assets.',
    meta: spotlight.campaignName ?? undefined,
    features: [
      {
        name: 'Campaign analytics',
        description: `Real-time reach and conversion reporting for ${remoteProfile?.name ?? 'your spotlight'}.`,
        stats: metrics,
        callout,
      },
      {
        name: 'Spotlight highlights',
        description: 'Showcase contributions, speaking engagements, and open-source work ready for promo.',
        highlights,
      },
      {
        name: 'Marketing asset kits',
        description: 'Personalised creative ready for LinkedIn, X, Instagram, newsletters, and press outreach.',
        resources: assets,
      },
      {
        name: 'Newsletter automation',
        description: 'Automated creator newsletter placements with performance reporting and upcoming features.',
        bulletPoints: newsletterHighlights,
        actions,
      },
    ],
  };
}

export default function FreelancerDashboardPage() {
  const communitySpotlight = useCommunitySpotlight({ freelancerId: profile.userId });

  const layoutProfile = useMemo(() => {
    const remoteProfile = communitySpotlight.data?.profile;
    if (!remoteProfile) {
      return profile;
    }
    const name = remoteProfile.name ?? profile.name;
    const initials = (name.match(/\b\w/g) || []).join('').slice(0, 2).toUpperCase() || profile.initials;
    const followers = formatCompactNumber(remoteProfile.followersCount ?? 0);
    const appreciations = formatCompactNumber(remoteProfile.likesCount ?? 0);

    return {
      ...profile,
      name,
      initials,
      badges: remoteProfile.badges?.length ? remoteProfile.badges : profile.badges,
      metrics: [
        { label: 'Followers', value: followers },
        { label: 'Appreciations', value: appreciations },
        ...profile.metrics,
      ],
    };
  }, [communitySpotlight.data?.profile]);

  const sections = useMemo(() => {
    const communitySection = buildCommunitySection({
      data: communitySpotlight.data,
      loading: communitySpotlight.loading,
      error: communitySpotlight.error,
      refresh: communitySpotlight.refresh,
    });
    if (communitySection) {
      return [communitySection, ...BASE_CAPABILITY_SECTIONS];
    }
    return BASE_CAPABILITY_SECTIONS;
  }, [
    communitySpotlight.data,
    communitySpotlight.loading,
    communitySpotlight.error,
    communitySpotlight.refresh,
  ]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={BASE_MENU_SECTIONS}
      sections={sections}
      profile={layoutProfile}
      availableDashboards={availableDashboards}
    />
  );
}
