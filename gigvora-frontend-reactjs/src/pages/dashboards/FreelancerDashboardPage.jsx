import { useMemo } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import useFreelancerPurchasedGigsDashboard from '../../hooks/useFreelancerPurchasedGigsDashboard.js';

const defaultMenuSections = [
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
        href: '#purchased-gigs',
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


const availableDashboards = ['freelancer', 'user', 'agency'];

function getInitials(name) {
  if (!name) return 'FM';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return 'FM';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'FM';
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(0);
  }

  const numeric = Number(amount);
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
  });
  return formatter.format(numeric);
}

function cloneMenuSections(summary, currency) {
  return defaultMenuSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.name !== 'Purchased gigs') {
        return { ...item };
      }

      const activeOrders = summary?.activeOrders ?? 0;
      const requirementsDue = summary?.requirementsDue ?? 0;
      const pendingPayout = formatCurrency(summary?.pendingPayoutValue ?? 0, currency);

      return {
        ...item,
        description: `${activeOrders} active orders • ${requirementsDue} requirements • ${pendingPayout} pending payouts`,
        tags: ['orders', 'requirements', 'payouts'],
        href: '#purchased-gigs',
      };
    }),
  }));
}

function buildProfile(freelancer, summary, currency) {
  const derivedName = `${freelancer?.firstName ?? 'Freelancer'} ${freelancer?.lastName ?? ''}`.trim();
  const name = freelancer?.name ?? (derivedName || 'Freelancer');
  const role = freelancer?.role ?? freelancer?.headline ?? 'Lead independent professional';
  const status = freelancer?.availabilityStatusLabel ?? 'Top-rated freelancer';
  const badges = Array.isArray(freelancer?.badges) ? freelancer.badges : [];
  const initials = getInitials(name);

  const metrics = [
    { label: 'Active orders', value: String(summary?.activeOrders ?? 0) },
    { label: 'Requirements due', value: String(summary?.requirementsDue ?? 0) },
    { label: 'Revision cycles', value: String(summary?.revisionCount ?? 0) },
    { label: 'Pending payouts', value: formatCurrency(summary?.pendingPayoutValue ?? 0, currency) },
  ];

  return {
    name,
    role,
    initials,
    status,
    badges,
    metrics,
  };
}

function formatPriority(priority) {
  if (!priority) return 'normal';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

const PIPELINE_STAGE_CONFIG = [
  {
    key: 'awaiting_requirements',
    label: 'Awaiting requirements',
    description: 'Kickoff forms or assets are still pending from the client.',
    accent: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    description: 'Delivery is underway with milestones scheduled this week.',
    accent: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    key: 'revision_requested',
    label: 'Revisions',
    description: 'Feedback loops are active and require fast turnaround.',
    accent: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  {
    key: 'ready_for_payout',
    label: 'Ready for payout',
    description: 'Delivery accepted, awaiting payout release or recently closed.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
];

function mergePipelineStages(pipeline = []) {
  return PIPELINE_STAGE_CONFIG.map((stage) => {
    const match = pipeline.find((item) => item.key === stage.key);
    return {
      ...stage,
      orders: Array.isArray(match?.orders) ? match.orders : [],
    };
  });
}

function resolveRevisionStatusLabel(status) {
  switch (status) {
    case 'requested':
      return 'Requested';
    case 'in_progress':
      return 'In progress';
    case 'submitted':
      return 'Submitted';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function resolveActivityTypeLabel(type) {
  switch (type) {
    case 'order':
      return 'Order';
    case 'requirement':
      return 'Requirement';
    case 'revision':
      return 'Revision';
    case 'payout':
      return 'Payout';
    case 'communication':
      return 'Communication';
    case 'note':
      return 'Note';
    default:
      return 'Update';
  }
}

const payoutStatusStyles = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  released: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  on_hold: 'bg-rose-50 text-rose-700 border-rose-200',
};

const defaultSummary = {
  activeOrders: 0,
  requirementsDue: 0,
  revisionCount: 0,
  pendingPayoutValue: 0,
  pipelineValue: 0,
  payoutsDueThisWeek: 0,
};

export default function FreelancerDashboardPage() {
  const freelancerId = 2; // Seeded demo freelancer
  const { data, error, loading, summaryCards: derivedSummaryCards, refresh, fromCache } =
    useFreelancerPurchasedGigsDashboard({ freelancerId });

  const currency = useMemo(() => data?.orders?.[0]?.currencyCode ?? 'USD', [data]);
  const summary = data?.summary ?? defaultSummary;

  const menuSections = useMemo(() => cloneMenuSections(summary, currency), [summary, currency]);
  const profile = useMemo(() => buildProfile(data?.freelancer, summary, currency), [data, summary, currency]);

  const summaryCards = useMemo(() => {
    const templates = [
      { icon: QueueListIcon, iconBackground: 'bg-blue-100', iconColor: 'text-blue-600' },
      { icon: ClipboardDocumentCheckIcon, iconBackground: 'bg-amber-100', iconColor: 'text-amber-600' },
      { icon: ArrowPathIcon, iconBackground: 'bg-purple-100', iconColor: 'text-purple-600' },
      { icon: CurrencyDollarIcon, iconBackground: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    ];

    return templates.map((template, index) => {
      const card = derivedSummaryCards?.[index];
      return {
        ...template,
        label: card?.label ?? ['Active orders', 'Requirements outstanding', 'Revision cycles', 'Payouts queued'][index],
        value: card?.value ?? '—',
        hint: card?.hint ?? '',
      };
    });
  }, [derivedSummaryCards]);

  const pipelineStages = useMemo(() => mergePipelineStages(data?.pipeline ?? []), [data?.pipeline]);
  const requirementQueue = data?.requirementQueue ?? [];
  const revisionQueue = data?.revisionQueue ?? [];
  const payoutSchedule = data?.payoutSchedule ?? [];
  const activityFeed = data?.activityFeed ?? [];

  const heroTitle = 'Freelancer Operations HQ';
  const heroSubtitle = 'Service business cockpit';
  const heroDescription =
    'An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace.';

  const isInitialLoading = loading && !data;

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Unable to load purchased gig data.</p>
            <p className="mt-1 text-rose-600/80">{error.message ?? 'Please try refreshing the workspace.'}</p>
          </div>
        ) : null}

        <section
          id="purchased-gigs"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Purchased gig control center</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track every purchased gig with a clear view of intake requirements, production progress, revision cycles, and
                upcoming payouts. Stay ahead of client expectations and cash flow.
              </p>
              {fromCache ? (
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Served from cache — refresh to see the latest data.
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => refresh({ force: true })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
                Refresh data
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBackground}`}>
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{card.value}</p>
                {card.hint ? <p className="mt-1 text-xs text-slate-500">{card.hint}</p> : null}
              </article>
            ))}
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Order pipeline</h3>
                <p className="text-sm text-slate-600">
                  Monitor purchased gigs across the delivery journey. Each column highlights immediate actions to keep clients
                  informed and momentum strong.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              {pipelineStages.map((stage) => (
                <div key={stage.key} className={`flex min-h-[320px] flex-col rounded-3xl border ${stage.accent} bg-white p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</p>
                      <h4 className="text-base font-semibold text-slate-900">{stage.label}</h4>
                      <p className="mt-1 text-xs text-slate-500">{stage.description}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow">{stage.orders.length}</span>
                  </div>

                  <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                    {stage.orders.length ? (
                      stage.orders.map((order) => {
                        const orderNumber = order.orderNumber ?? `#${order.id}`;
                        const gigTitle = order.gig?.title ?? 'Gig order';
                        const clientName = order.clientCompanyName ?? order.client?.name ?? 'Client';
                        const activeRevision = order.revisions?.find((revision) =>
                          ['requested', 'in_progress', 'submitted'].includes(revision.status),
                        );

                        return (
                          <article key={order.id} className="rounded-2xl border border-white/40 bg-white/90 p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{orderNumber}</p>
                                <h5 className="text-sm font-semibold text-slate-900">{gigTitle}</h5>
                                <p className="text-xs text-slate-500">{clientName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Due</p>
                                <p className="text-xs text-slate-500">
                                  {order.dueAt ? formatAbsolute(order.dueAt, { dateStyle: 'medium' }) : 'TBD'}
                                </p>
                                {order.dueAt ? (
                                  <p className="text-[11px] font-medium text-slate-500">{formatRelativeTime(order.dueAt)}</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-blue-500 transition-all"
                                  style={{ width: `${order.progressPercent ?? 0}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500">{order.progressPercent ?? 0}%</span>
                            </div>

                            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <div>
                                <dt className="font-semibold uppercase tracking-wide text-slate-400">Pipeline value</dt>
                                <dd className="font-medium text-slate-700">
                                  {formatCurrency(order.amount ?? 0, order.currencyCode ?? currency)}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold uppercase tracking-wide text-slate-400">Requirements</dt>
                                <dd className="font-medium text-slate-700">{order.requirementsOutstanding ?? 0} pending</dd>
                              </div>
                            </dl>

                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {order.requirementsOutstanding ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                                  {order.requirementsOutstanding} requirement
                                  {order.requirementsOutstanding > 1 ? 's' : ''} outstanding
                                </span>
                              ) : null}
                              {order.revisionCycles ? (
                                <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                                  {order.revisionCycles} revision cycle{order.revisionCycles > 1 ? 's' : ''}
                                </span>
                              ) : null}
                              {activeRevision?.dueAt ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                  Revision due {formatRelativeTime(activeRevision.dueAt)}
                                </span>
                              ) : null}
                              {order.completedAt ? (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                                  Completed {formatRelativeTime(order.completedAt)}
                                </span>
                              ) : null}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No orders in this stage.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Requirements desk</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Follow up on outstanding questionnaires, files, and brand assets. Keep clients accountable so delivery can begin on
                  schedule.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {requirementQueue.length ? (
                requirementQueue.map((entry) => {
                  const outstanding = entry.items.filter((item) => item.status !== 'received').length;
                  const dueLabel = entry.dueAt ? formatRelativeTime(entry.dueAt) : 'Date TBD';

                  return (
                    <article key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{entry.orderNumber}</p>
                          <p className="text-sm font-medium text-slate-900">{entry.clientCompanyName}</p>
                          <p className="text-xs text-slate-500">Point of contact: {entry.clientContactName ?? 'Client team'}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due {dueLabel}</span>
                          <span className="text-xs text-slate-500">
                            {entry.dueAt ? formatAbsolute(entry.dueAt, { dateStyle: 'medium' }) : 'Awaiting schedule'}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
                              outstanding ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {outstanding ? `${outstanding} outstanding` : 'All items received'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-600">Priority: {formatPriority(entry.priority)}</span>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {entry.items.map((item, index) => (
                          <li key={`${item.label}-${index}`} className="flex gap-3 text-sm text-slate-600">
                            {item.status === 'received' ? (
                              <CheckCircleIcon className="mt-0.5 h-5 w-5 text-emerald-500" />
                            ) : (
                              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-amber-500" />
                            )}
                            <div>
                              <p className="font-medium text-slate-700">{item.label}</p>
                              {item.status === 'received' ? (
                                <p className="text-xs text-slate-500">
                                  Received {entry.receivedAt ? formatRelativeTime(entry.receivedAt) : 'and archived'}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500">Awaiting client submission</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No outstanding requirements. Great job keeping clients on track.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Revision control</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Manage client feedback loops with clear deadlines, scope, and impact on your delivery schedule.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {revisionQueue.length ? (
                revisionQueue.map((revision) => (
                  <article key={revision.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{revision.orderNumber}</p>
                        <p className="text-sm font-medium text-slate-900">{revision.clientCompanyName}</p>
                        <p className="text-xs text-slate-500">Round {revision.roundNumber}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {revision.dueAt ? `Due ${formatRelativeTime(revision.dueAt)}` : 'Awaiting submission'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {revision.dueAt ? formatAbsolute(revision.dueAt, { dateStyle: 'medium' }) : 'Date TBD'}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide ${
                            revision.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : revision.severity === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          Severity: {revision.severity ?? 'medium'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">
                        Status: {resolveRevisionStatusLabel(revision.status)}
                      </span>
                      {revision.submittedAt ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                          Submitted {formatRelativeTime(revision.submittedAt)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                      {revision.focusAreas?.length
                        ? revision.focusAreas.map((focus, index) => <li key={`${revision.id}-focus-${index}`}>{focus}</li>)
                        : <li>No focus areas recorded.</li>}
                    </ul>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No active revision cycles right now.</p>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Payout runway</h2>
              <p className="mt-2 text-sm text-slate-600">
                Keep cash flow predictable by tracking upcoming releases, at-risk milestones, and completed payouts.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {payoutSchedule.length ? (
              payoutSchedule.map((payout) => {
                const statusStyle = payoutStatusStyles[payout.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                const expectedLabel = payout.expectedAt ? formatRelativeTime(payout.expectedAt) : 'Date TBD';

                return (
                  <article key={payout.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{payout.orderNumber}</p>
                        <p className="text-sm font-semibold text-slate-900">{payout.clientCompanyName}</p>
                        <p className="text-xs text-slate-500">{payout.milestoneLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {payout.status === 'released' ? 'Released' : 'Expected'} {expectedLabel}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payout.status === 'released'
                            ? formatAbsolute(payout.releasedAt ?? payout.expectedAt, { dateStyle: 'medium' })
                            : payout.expectedAt
                            ? formatAbsolute(payout.expectedAt, { dateStyle: 'medium' })
                            : 'Awaiting schedule'}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatCurrency(payout.amount ?? 0, payout.currencyCode ?? currency)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <span className={`rounded-full border px-3 py-1 ${statusStyle}`}>{payout.status.replace('_', ' ')}</span>
                      {payout.riskNote ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{payout.riskNote}</span>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No payouts scheduled. Close out milestones to queue earnings for release.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Activity timeline</h2>
              <p className="mt-2 text-sm text-slate-600">
                Review the latest order events, client communications, requirement submissions, and payout updates.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {activityFeed.length ? (
              activityFeed.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {activity.order?.orderNumber ?? 'Timeline event'}
                      </p>
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500">
                        {activity.order?.clientCompanyName ? `${activity.order.clientCompanyName} • ` : ''}
                        {resolveActivityTypeLabel(activity.activityType)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{activity.occurredAt ? formatAbsolute(activity.occurredAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</p>
                      {activity.occurredAt ? <p>{formatRelativeTime(activity.occurredAt)}</p> : null}
                    </div>
                  </div>
                  {activity.description ? <p className="mt-3 text-sm text-slate-600">{activity.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {activity.actor ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-600">
                        {activity.actor.firstName} {activity.actor.lastName}
                      </span>
                    ) : null}
                    {activity.order?.gig?.title ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{activity.order.gig.title}</span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent activity yet. New order events will appear here in real-time.</p>
            )}
          </div>
        </section>

        {isInitialLoading ? (
          <p className="text-center text-sm text-slate-500">Loading purchased gig data…</p>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
