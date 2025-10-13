import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AgencyAllianceManager from '../../components/alliances/AgencyAllianceManager.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchFreelancerAllianceDashboard } from '../../services/freelancerAlliance.js';

const DEFAULT_FREELANCER_ID = 2;

const menuSections = [
  {
    label: 'Agency alliances',
    items: [
      {
        id: 'agency-alliance-manager',
        name: 'Agency alliance manager',
        description:
          'Collaborate with agencies, share resource calendars, negotiate revenue splits, and activate pods for large engagements.',
        tags: ['alliances', 'pods'],
      },
      {
        id: 'rate-card-library',
        name: 'Rate card library',
        description: 'Maintain shareable pricing catalogs with audit history and digital approvals.',
        tags: ['pricing'],
      },
      {
        id: 'resource-heatmap',
        name: 'Resource calendar',
        description: 'Visualise partner bandwidth, conflicts, and staffing signals across weeks.',
      },
    ],
  },
  {
    label: 'Service delivery',
    items: [
      {
        id: 'project-workspaces',
        name: 'Project workspace dashboard',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        id: 'project-management',
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        id: 'client-portals',
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        id: 'gig-manager',
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        id: 'post-gig',
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        id: 'purchased-gigs',
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        id: 'freelancer-profile',
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        id: 'finance-insights',
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
          'Alliance health scoring with alerts for unmet SLAs or resource gaps.',
          'Pod-ready staffing suggestions based on complementary capabilities.',
          'Centralized alliance communications with decision logs and files.',
        ],
        metrics: [
          {
            label: 'Active alliances',
            value: '12',
            description: 'Cross-agency partnerships currently in delivery or pursuit.',
          },
          {
            label: 'Joint pipeline',
            value: '$420k',
            description: 'Value of co-sold opportunities in negotiation stages.',
          },
          {
            label: 'Average fill rate',
            value: '86%',
            description: 'Resource coverage across upcoming pod requests.',
          },
          {
            label: 'Rate card versions',
            value: '34',
            description: 'Approved pricing iterations tracked with digital signatures.',
          },
        ],
        detailSections: [
          {
            title: 'Alliance lifecycle cockpit',
            description:
              'Move from discovery to delivery with structured playbooks, mutual NDA templates, and governance checkpoints.',
            items: [
              'Matchmake with agencies by industry, geography, and compliance posture.',
              'Auto-generate joint opportunity briefs and assign revenue split proposals for review.',
              'Track renewal cadences, executive sponsors, and satisfaction surveys in one view.',
            ],
            meta: 'Lifecycle automation',
          },
          {
            title: 'Shared resourcing & availability',
            description:
              'Visualize supply and demand across teams with granular scheduling signals and guardrails.',
            items: [
              'Dynamic resource calendars with skill tags, PTO, and utilization thresholds.',
              'Resource heatmaps showing bandwidth across weeks with clash detection for pod workstreams.',
              'Real-time staffing requests routed to agency partners with acceptance workflows.',
            ],
            meta: 'Capacity intelligence',
          },
          {
            title: 'Commercial collaboration',
            description:
              'Align on pricing and profitability with transparent audit trails and automated guardrails.',
            items: [
              'Rate card sharing with version history, digital approvals, and comparison views.',
              'Revenue split simulations factoring delivery costs, subcontractor fees, and contingencies.',
              'Deal desk escalations with automatic notifications when margins drop below thresholds.',
            ],
            meta: 'Deal desk',
          },
          {
            title: 'Compliance & knowledge hub',
            description:
              'Keep every alliance audit-ready while capturing institutional knowledge for future pursuits.',
            items: [
              'Central repository for joint statements of work, insurance certificates, and security questionnaires.',
              'Decision logs with timestamped notes, attachments, and accountable owners.',
              'Retrospective insights capturing lessons learned, client feedback, and playbook updates.',
            ],
          },
        ],
        workflow: {
          title: 'Alliance activation workflow',
          stages: [
            {
              name: 'Discovery & intent',
              owner: 'Business development',
              description: 'Qualify agency partners, align on goals, and validate service fit.',
              outputs: [
                'Mutual NDA executed and profiles exchanged.',
                'Target client segments and opportunity archetypes documented.',
              ],
            },
            {
              name: 'Co-selling preparation',
              owner: 'Alliance manager',
              description: 'Prepare joint collateral, pricing frameworks, and engagement pods.',
              outputs: [
                'Shared rate cards approved with version control.',
                'Pod staffing matrix with availability heatmap attached.',
              ],
            },
            {
              name: 'Delivery governance',
              owner: 'Engagement lead',
              description: 'Monitor execution, manage escalations, and update revenue allocations.',
              outputs: [
                'Weekly alliance scorecard with utilization, CSAT, and financial metrics.',
                'Change requests approved with updated revenue split ledger.',
              ],
            },
            {
              name: 'Renewal & expansion',
              owner: 'Executive sponsors',
              description: 'Review performance, capture testimonials, and plan next fiscal targets.',
              outputs: [
                'Alliance health review with recommendations and commitments.',
                'Pipeline of expansion opportunities prioritized by readiness.',
              ],
            },
          ],
        },
        callout: 'Pod-ready alliances close enterprise deals 37% faster with shared visibility.',
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
  const [activeMenuItem, setActiveMenuItem] = useState('agency-alliance-manager');

  const {
    data: allianceData,
    loading: alliancesLoading,
    error: alliancesError,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `dashboard:freelancer:alliances:${DEFAULT_FREELANCER_ID}`,
    ({ signal, force }) => fetchFreelancerAllianceDashboard(DEFAULT_FREELANCER_ID, { signal, force }),
    { enabled: activeMenuItem === 'agency-alliance-manager' },
  );

  const layoutSections = useMemo(() => {
    if (activeMenuItem === 'agency-alliance-manager') {
      return [];
    }
    return capabilitySections;
  }, [activeMenuItem]);

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={layoutSections}
      profile={profile}
      availableDashboards={availableDashboards}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={(itemId) => setActiveMenuItem(itemId)}
    >
      {activeMenuItem === 'agency-alliance-manager' ? (
        <AgencyAllianceManager
          data={allianceData}
          loading={alliancesLoading}
          error={alliancesError}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={() => refresh({ force: true })}
        />
      ) : null}
    </DashboardLayout>
  );
}
