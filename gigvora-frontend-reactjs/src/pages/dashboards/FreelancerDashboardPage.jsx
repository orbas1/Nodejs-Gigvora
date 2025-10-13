import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyCollaborationsPanel from '../../components/freelancer/AgencyCollaborationsPanel.jsx';
import { fetchFreelancerAgencyCollaborations } from '../../services/freelancerAgency.js';

const DEFAULT_FREELANCER_ID = Number.parseInt(import.meta.env.VITE_DEMO_FREELANCER_ID ?? '101', 10);

const baseMenuSections = [
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
        href: '#agency-collaborations',
      },
      {
        name: 'Finance & insights',
        description: 'Revenue analytics, payout history, taxes, and profitability dashboards.',
      },
    ],
  },
];

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
];

const availableDashboards = ['freelancer', 'user', 'agency'];

function getInitials(name) {
  if (!name) return 'FR';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(0);
  }
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  }).format(numeric);
}

export default function FreelancerDashboardPage() {
  const freelancerId = Number.isFinite(DEFAULT_FREELANCER_ID) && DEFAULT_FREELANCER_ID > 0 ? DEFAULT_FREELANCER_ID : 101;
  const [collaborationsState, setCollaborationsState] = useState({ data: null, loading: false, error: null });

  const loadCollaborations = useCallback(() => {
    setCollaborationsState((previous) => ({ ...previous, loading: true, error: null }));
    fetchFreelancerAgencyCollaborations(freelancerId, { lookbackDays: 120 })
      .then((payload) => {
        setCollaborationsState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        setCollaborationsState({
          data: null,
          loading: false,
          error: error?.message ?? 'Unable to load agency collaborations.',
        });
      });
  }, [freelancerId]);

  useEffect(() => {
    loadCollaborations();
  }, [loadCollaborations]);

  const summary = collaborationsState.data?.summary ?? null;

  const menuSections = useMemo(() => {
    return baseMenuSections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.name !== 'Agency collaborations') {
          return item;
        }

        if (!summary) {
          return item;
        }

        const description = `${formatNumber(summary.activeCollaborations ?? 0)} active retainers · ${formatCurrency(
          summary.monthlyRetainerValue,
          summary.monthlyRetainerCurrency,
        )} / month`;

        return {
          ...item,
          description,
          href: '#agency-collaborations',
          tags: ['retainers', 'rate cards'],
        };
      }),
    }));
  }, [summary]);

  const profile = useMemo(() => {
    const freelancer = collaborationsState.data?.freelancer;
    if (!freelancer) {
      return {
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
    }

    const badges = ['Agency partnerships'];
    const metrics = Array.isArray(freelancer.metrics)
      ? freelancer.metrics.map((metric) => ({
          label: metric.label,
          value:
            metric.currency != null
              ? formatCurrency(metric.value, metric.currency)
              : formatNumber(metric.value ?? 0),
        }))
      : [];

    const status = summary
      ? `${formatNumber(summary.activeCollaborations ?? 0)} active retainers`
      : 'Agency ready';

    const composedName = `${freelancer.firstName ?? ''} ${freelancer.lastName ?? ''}`.trim();
    const fallbackName = composedName || freelancer.email || 'Freelancer';

    return {
      name: freelancer.name ?? fallbackName,
      role: freelancer.title ?? 'Independent operator',
      initials: getInitials(freelancer.name ?? freelancer.email ?? 'FR'),
      status,
      badges,
      metrics,
    };
  }, [collaborationsState.data?.freelancer, summary]);

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
      <>
        <AgencyCollaborationsPanel
          data={collaborationsState.data}
          loading={collaborationsState.loading}
          error={collaborationsState.error}
          onRetry={loadCollaborations}
        />

        {capabilitySections.map((section) => (
          <section
            key={section.title}
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                {section.description ? (
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
                ) : null}
              </div>
              {section.meta ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                  {section.meta}
                </div>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {section.features.map((feature) => (
                <div
                  key={feature.name}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                    {feature.description ? (
                      <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                    ) : null}
                    {feature.bulletPoints?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {feature.bulletPoints.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {feature.callout ? (
                    <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-blue-700">
                      {feature.callout}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </>
    </DashboardLayout>
  );
}

