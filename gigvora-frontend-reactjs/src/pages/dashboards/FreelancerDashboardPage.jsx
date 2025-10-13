import { useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import ReputationEngineShowcase from '../../components/reputation/ReputationEngineShowcase.jsx';
import { fetchFreelancerReputation } from '../../services/reputation.js';

const DEFAULT_FREELANCER_ID = 2;
const availableDashboards = ['freelancer', 'user', 'agency'];

function formatNumber(value) {
  if (value == null) {
    return '0';
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(numeric);
}

function buildMenuSections(data) {
  const summary = data?.summary ?? {};
  const totals = summary.totals ?? {};
  const metrics = data?.metrics ?? [];
  const onTime = metrics.find((metric) => metric.metricType === 'on_time_delivery_rate');
  const csat = metrics.find((metric) => metric.metricType === 'average_csat');
  const publishedStories = totals.publishedStories ?? 0;
  const testimonialCount = totals.testimonials ?? 0;
  const activeWidgets = totals.activeWidgets ?? 0;
  const promotedBadges = data?.badges?.promoted?.length ?? 0;

  return [
    {
      label: 'Client trust',
      items: [
        {
          name: 'Reputation engine',
          description: `Showcase ${formatNumber(testimonialCount)} testimonials with ${formatNumber(publishedStories)} case studies and verified metrics.`,
          href: '#reputation-engine',
          tags: ['metrics', 'testimonials'],
        },
        {
          name: 'Success stories',
          description: `Publish ${formatNumber(publishedStories)} data-backed narratives with auto-synced CTAs and ROI stats.`,
          href: '#reputation-success-stories',
          tags: ['stories'],
        },
        {
          name: 'Badges & widgets',
          description: `${formatNumber(promotedBadges)} promoted badges and ${formatNumber(activeWidgets)} live widgets ready to embed.`,
          href: '#reputation-badges',
          tags: ['badges', 'embeds'],
        },
      ],
    },
    {
      label: 'Automation & distribution',
      items: [
        {
          name: 'Shareable embeds',
          description: 'Drop review widgets into proposals, deal rooms, and marketing sites without extra engineering.',
          href: '#reputation-widgets',
          tags: ['widgets'],
        },
        {
          name: 'Automation playbooks',
          description: csat
            ? `Trigger save plans when CSAT deviates from ${csat.formattedValue ?? csat.value}.`
            : 'Trigger testimonial capture, save plans, and badge issuance automatically.',
          href: '#reputation-automation',
          tags: ['automation'],
        },
        {
          name: 'Integration touchpoints',
          description: onTime
            ? `Sync proof to CRM, profiles, and marketplaces while protecting a ${onTime.formattedValue ?? onTime.value}% on-time streak.`
            : 'Sync proof across CRM, public profiles, partner marketplaces, and newsletters.',
          href: '#reputation-automation',
          tags: ['integrations'],
        },
      ],
    },
  ];
}

function formatStatus(status) {
  if (!status) return null;
  return status
    .toString()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildProfileCard(data) {
  const freelancer = data?.freelancer;
  const summary = data?.summary ?? {};
  const totals = summary.totals ?? {};
  const metricsByType = new Map((data?.metrics ?? []).map((metric) => [metric.metricType, metric]));
  const promotedBadges = data?.badges?.promoted ?? [];

  if (!freelancer) {
    return {
      name: 'Freelancer',
      role: 'Independent professional',
      initials: 'FR',
      metrics: [],
      badges: [],
    };
  }

  const metrics = [
    { label: 'Testimonials', value: formatNumber(totals.testimonials ?? 0) },
    { label: 'Stories', value: formatNumber(totals.publishedStories ?? 0) },
    { label: 'Active widgets', value: formatNumber(totals.activeWidgets ?? 0) },
  ];

  const onTime = metricsByType.get('on_time_delivery_rate');
  if (onTime) {
    metrics.push({ label: 'On-time delivery', value: onTime.formattedValue ?? formatNumber(onTime.value) });
  }

  const csat = metricsByType.get('average_csat');
  if (csat) {
    metrics.push({ label: 'CSAT', value: csat.formattedValue ?? formatNumber(csat.value) });
  }

  const badges = promotedBadges.slice(0, 3).map((badge) => badge.name);

  return {
    name: freelancer.name,
    role: freelancer.title,
    initials: freelancer.initials,
    status: freelancer.status ? `Availability: ${formatStatus(freelancer.status)}` : undefined,
    badges,
    metrics,
  };
}

export default function FreelancerDashboardPage() {
  const freelancerId = DEFAULT_FREELANCER_ID;

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `freelancer:reputation:${freelancerId}`,
    ({ signal }) => fetchFreelancerReputation(freelancerId, { signal, limitTestimonials: 8, limitStories: 4 }),
    { ttl: 1000 * 60 },
  );

  const menuSections = useMemo(() => buildMenuSections(data), [data]);
  const profileCard = useMemo(() => buildProfileCard(data), [data]);
  const errorMessage = error?.message ?? (typeof error === 'string' ? error : null);

  const heroTitle = 'Freelancer Operations HQ';
  const heroSubtitle = 'Reputation engine & social proof';
  const heroDescription =
    'Capture testimonials, publish success stories, and broadcast verified performance metrics backed by Gigvora delivery data.';

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profileCard}
      availableDashboards={availableDashboards}
    >
      <ReputationEngineShowcase
        data={data}
        loading={loading}
        error={errorMessage}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={() => refresh({ force: true })}
      />
    </DashboardLayout>
  );
}

