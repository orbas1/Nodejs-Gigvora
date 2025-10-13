import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  ClientPortalSummary,
  ClientPortalTimeline,
  ClientPortalScopeSummary,
  ClientPortalDecisionLog,
  ClientPortalInsightWidgets,
} from '../../components/clientPortal/index.js';
import { fetchClientPortalDashboard } from '../../services/clientPortals.js';

const DEFAULT_MENU_STRUCTURE = [
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

const DEFAULT_PORTAL_ID = import.meta.env.VITE_FREELANCER_PORTAL_ID ?? '1';

export default function FreelancerDashboardPage() {
  const [searchParams] = useSearchParams();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const requestedPortalId = searchParams.get('portalId');
  const portalIdentifier = (requestedPortalId ?? DEFAULT_PORTAL_ID ?? '1') || '1';

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientPortalDashboard(portalIdentifier, { signal: controller.signal });
        if (!cancelled) {
          setPortalData(data);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [portalIdentifier, refreshKey]);

  const portal = portalData?.portal;
  const timelineSummary = portalData?.timeline?.summary ?? {};
  const scopeSummary = portalData?.scope?.summary ?? {};
  const decisionSummary = portalData?.decisions?.summary ?? {};

  const profile = useMemo(() => {
    const badges = [];
    if (portal?.status) badges.push(`Status: ${portal.status}`);
    if (portal?.riskLevel) badges.push(`Risk: ${portal.riskLevel}`);
    if (!badges.length) badges.push('Verified Pro', 'Gigvora Elite');

    return {
      name: 'Riley Morgan',
      role: 'Lead Brand & Product Designer',
      initials: 'RM',
      status: portal?.healthScore != null ? `Portal health ${portal.healthScore}` : 'Top-rated freelancer',
      badges,
      metrics: [
        {
          label: 'Milestones',
          value: `${timelineSummary.completedCount ?? 0}/${timelineSummary.totalCount ?? 0}`,
        },
        {
          label: 'Scope delivered',
          value: `${scopeSummary.deliveredCount ?? 0}`,
        },
        {
          label: 'Decisions logged',
          value: `${decisionSummary.totalCount ?? 0}`,
        },
        {
          label: 'Health score',
          value: portal?.healthScore != null ? `${portal.healthScore}` : '—',
        },
      ],
    };
  }, [portal, timelineSummary, scopeSummary, decisionSummary]);

  const menuSections = useMemo(() => {
    const clientPortalTags = [];
    if (portal?.status) clientPortalTags.push(portal.status);
    if (portal?.healthScore != null) clientPortalTags.push(`health ${portal.healthScore}`);
    if (timelineSummary.totalCount != null) {
      clientPortalTags.push(`${timelineSummary.completedCount ?? 0}/${timelineSummary.totalCount} milestones`);
    }
    if (decisionSummary.totalCount != null) {
      clientPortalTags.push(`${decisionSummary.totalCount} decisions`);
    }

    return [
      {
        label: 'Service delivery',
        items: [
          {
            name: 'Client portals',
            description: portal?.summary ?? 'Shared timelines, scope controls, and decision logs with your clients.',
            tags: clientPortalTags,
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
        ],
      },
      ...DEFAULT_MENU_STRUCTURE,
    ];
  }, [portal, timelineSummary, decisionSummary]);

  const availableDashboards = ['freelancer', 'user', 'agency'];

  const handleRetry = () => {
    setPortalData(null);
    setError(null);
    setLoading(true);
    setRefreshKey((key) => key + 1);
  };

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={[]}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-6">
        <ClientPortalSummary
          portal={portal}
          timelineSummary={timelineSummary}
          scopeSummary={scopeSummary}
          decisionSummary={decisionSummary}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />
        <div className="grid gap-6 xl:grid-cols-3">
          <ClientPortalTimeline
            className="xl:col-span-2"
            events={portalData?.timeline?.events ?? []}
            summary={timelineSummary}
            loading={loading}
          />
          <ClientPortalInsightWidgets className="xl:col-span-1" insights={portalData?.insights ?? {}} />
        </div>
        <ClientPortalScopeSummary scope={portalData?.scope ?? {}} />
        <ClientPortalDecisionLog decisions={portalData?.decisions ?? {}} />
      </div>
    </DashboardLayout>
  );
}
