import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import ContractComplianceLocker from '../../components/compliance/ContractComplianceLocker.jsx';
import { fetchComplianceLocker } from '../../services/compliance.js';

const DEFAULT_FREELANCER_ID = 101;

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
    ],
  },
  {
    label: 'Finance, compliance, & reputation',
    items: [
      {
        name: 'Finance control tower',
        description: 'Revenue analytics, tax-ready exports, expense tracking, and smart savings goals.',
      },
      {
        name: 'Contract & compliance locker',
        description:
          'Monitor contract renewals, obligations, and localization frameworks with an audit-ready vault.',
        anchor: 'contract-compliance-locker',
      },
      {
        name: 'Reputation engine',
        description: 'Capture testimonials, publish success stories, and display verified delivery metrics.',
      },
    ],
  },
];

const CAPABILITY_SECTIONS = [
  {
    anchor: 'project-workspace-excellence',
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
    anchor: 'gig-marketplace-operations',
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
    anchor: 'finance-compliance-reputation',
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
          'Centralize every agreement, policy acknowledgment, and compliance artifact in a secure vault with full e-sign auditability and version awareness.',
        bulletPoints: [
          'Store MSAs, NDAs, intellectual property transfers, and compliance attestations with immutable audit trails.',
          'Automated reminders for contract renewals, insurance certificates, and background check refresh cycles.',
          'Dynamic obligation tracker that notifies teammates when client-specific clauses require action.',
          'Localization libraries for GDPR, SOC 2, IR35, and worker classifications with pre-built questionnaires per region.',
          'Side-by-side version comparison, clause redlining history, and approval routing to legal or finance reviewers.',
        ],
        callout: 'Compliance-ready vault with jurisdiction-aware templates and renewal intelligence.',
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
    anchor: 'growth-partnerships-skills',
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

const AVAILABLE_DASHBOARDS = ['freelancer', 'user', 'agency'];

function slugify(value) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');
}

function DashboardSections({ sections }) {
  return sections.map((section) => {
    const anchorId = section.anchor ? section.anchor : slugify(section.title);
    return (
      <section
        key={section.title}
        id={anchorId}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
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
    );
  });
}

export default function FreelancerDashboardPage() {
  const [lockerState, setLockerState] = useState({ data: null, loading: true, error: null });

  const loadLocker = useCallback(
    ({ useCache = true } = {}) => {
      setLockerState((previous) => ({ ...previous, loading: true, error: null }));
      fetchComplianceLocker({ userId: DEFAULT_FREELANCER_ID, region: 'EU', useCache })
        .then((payload) => {
          setLockerState({ data: payload, loading: false, error: null });
        })
        .catch((error) => {
          setLockerState((previous) => ({
            data: previous.data,
            loading: false,
            error: error?.message ?? 'Unable to load the compliance locker.',
          }));
        });
    },
    [],
  );

  useEffect(() => {
    loadLocker({ useCache: true });
  }, [loadLocker]);

  const menuSections = useMemo(() => {
    const activeDocuments = lockerState.data?.summary?.totals?.activeDocuments ?? null;
    const renewalsDue = lockerState.data?.summary?.expiringSoon?.length ?? null;
    const descriptionOverride =
      activeDocuments != null && renewalsDue != null
        ? `${activeDocuments} active agreements · ${renewalsDue} renewals pending`
        : null;

    return BASE_MENU_SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.anchor === 'contract-compliance-locker' && descriptionOverride) {
          return { ...item, description: descriptionOverride };
        }
        return item;
      }),
    }));
  }, [lockerState.data]);

  const profile = useMemo(() => {
    const totals = lockerState.data?.summary?.totals ?? {};
    const obligations = lockerState.data?.summary?.obligations ?? {};
    const metrics = [
      { label: 'Active contracts', value: String(totals.activeDocuments ?? 0) },
      { label: 'Renewals due', value: String(lockerState.data?.summary?.expiringSoon?.length ?? 0) },
      { label: 'Open obligations', value: String(obligations.open ?? 0) },
      { label: 'Avg. CSAT', value: '4.9/5' },
    ];

    return {
      name: 'Riley Morgan',
      role: 'Lead Brand & Product Designer',
      initials: 'RM',
      status: lockerState.data ? 'Compliance monitoring enabled' : 'Top-rated freelancer',
      badges: ['Verified Pro', 'Gigvora Elite'],
      metrics,
    };
  }, [lockerState.data]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={[]}
      profile={profile}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-8">
        <ContractComplianceLocker
          data={lockerState.data}
          loading={lockerState.loading}
          error={lockerState.error}
          onRefresh={() => loadLocker({ useCache: false })}
        />
        <DashboardSections sections={CAPABILITY_SECTIONS} />
      </div>
    </DashboardLayout>
  );
}
