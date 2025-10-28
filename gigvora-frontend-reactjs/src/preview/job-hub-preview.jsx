import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import JobApplicationWorkspaceLayout from '../components/jobApplications/JobApplicationWorkspaceLayout.jsx';

const MOCK_APPLICATIONS = [
  {
    id: 'app-elinor-strategist',
    listingId: 'listing-strategist',
    candidateName: 'Elinor Stevens',
    status: 'interviewing',
    submittedAt: '2024-05-10T09:00:00Z',
    updatedAt: '2024-05-22T14:00:00Z',
    matchScore: 92,
    nextStep: 'Panel interview Friday',
    matchedSkills: ['Lifecycle storytelling', 'Campaign analytics', 'Leadership'],
    skillGaps: ['Motion design'],
    detail: {
      title: 'Brand Experience Strategist',
      companyName: 'Harbor & Pine',
      salary: { min: 96000, max: 118000, currency: 'USD', period: 'year' },
      location: { city: 'Seattle', state: 'WA', country: 'USA', remote: true },
      summary: 'Design premium lifecycle storytelling across digital and in-person touchpoints.',
      source: 'Inbound',
    },
    experience: [
      {
        id: 'exp-elinor-verb',
        title: 'Head of Brand Experience',
        company: 'Verb Studio',
        type: 'Full-time',
        highlight: 'Led a 9-person team delivering multi-channel product launches across B2B and B2C brands.',
      },
      {
        id: 'exp-elinor-freelance',
        title: 'Freelance Narrative Designer',
        company: 'Independent',
        type: 'Freelance',
        highlight: 'Produced retention storytelling for early-stage SaaS and direct-to-consumer startups.',
      },
    ],
    reviews: [
      {
        id: 'rev-elinor',
        author: 'Victor Chen · Director, Verb Studio',
        quote: 'Builds premium customer journeys and inspires teams to work smarter across every touchpoint.',
      },
    ],
  },
  {
    id: 'app-luca-ops',
    listingId: 'listing-ops',
    candidateName: 'Luca Fernandez',
    status: 'offer',
    submittedAt: '2024-04-02T13:45:00Z',
    updatedAt: '2024-05-19T17:15:00Z',
    matchScore: 88,
    nextStep: 'Offer review with finance',
    matchedSkills: ['Release governance', 'Change management', 'Stakeholder alignment'],
    skillGaps: ['Hardware operations'],
    detail: {
      title: 'Product Operations Lead',
      companyName: 'Lumen Desk',
      salary: { min: 102000, max: 128000, currency: 'USD', period: 'year' },
      location: { city: 'Toronto', country: 'Canada' },
      summary: 'Unify release rituals and customer voice loops for a distributed product org.',
      source: 'Referral',
    },
    experience: [
      {
        id: 'exp-luca-scout',
        title: 'Product Ops Manager',
        company: 'Scout Labs',
        type: 'Full-time',
        highlight: 'Scaled release rituals across four product squads and trimmed go-to-market feedback loops to 48 hours.',
      },
      {
        id: 'exp-luca-freelance',
        title: 'Freelance Ops Consultant',
        company: 'Various Series A Startups',
        type: 'Freelance',
        highlight: 'Implemented async OKR planning and analytics instrumentation for distributed product teams.',
      },
    ],
  },
  {
    id: 'app-ava-community',
    listingId: 'listing-community',
    candidateName: 'Ava Mireles',
    status: 'interviewing',
    submittedAt: '2024-05-14T11:30:00Z',
    matchScore: 95,
    nextStep: 'Founders coffee chat',
    matchedSkills: ['Community architecture', 'Experiential design', 'Ambassador programs'],
    skillGaps: [],
    detail: {
      title: 'Community Design Partner',
      companyName: 'Gatherly',
      salary: { min: 88000, max: 108000, currency: 'USD', period: 'year' },
      location: { city: 'Denver', state: 'CO', country: 'USA' },
      summary: 'Shape hybrid event programs, premium cohorts, and ambassador playbooks.',
      source: 'Talent network',
    },
    reviews: [
      {
        id: 'rev-ava',
        author: 'Kim Patel · Founder, Collective Pulse',
        quote: 'Transformed our hybrid community into a premium membership within 90 days.',
      },
    ],
  },
  {
    id: 'app-ravi-ai',
    listingId: 'listing-ai',
    candidateName: 'Ravi Kapoor',
    status: 'submitted',
    submittedAt: '2024-05-22T08:25:00Z',
    matchScore: 82,
    matchedSkills: ['Applied research', 'Sprint facilitation', 'Stakeholder storytelling'],
    skillGaps: ['Security clearance'],
    detail: {
      title: 'AI Research Producer',
      companyName: 'Signal North',
      salary: { min: 135000, max: 158000, currency: 'USD', period: 'year' },
      location: { city: 'San Francisco', state: 'CA', country: 'USA', remote: true },
      summary: 'Orchestrate applied AI sprint studies, research councils, and practitioner feedback loops.',
      source: 'Careers site',
    },
  },
];

const MOCK_LISTINGS = [
  {
    id: 'listing-strategist',
    title: 'Brand Experience Strategist',
    company: 'Harbor & Pine',
    salary: { min: 96000, max: 118000, currency: 'USD', period: 'year' },
    location: { city: 'Seattle', state: 'WA', country: 'USA', remote: true },
    matchScore: 92,
    openings: 2,
    summary: 'Design premium lifecycle storytelling across digital and in-person touchpoints for global hospitality brands.',
    description:
      'Harbor & Pine is searching for a Brand Experience Strategist to orchestrate narrative-led campaigns that unite lifecycle marketing, experiential events, and membership retention. You will partner with product, growth, and creative leaders to make every interaction feel elevated and human.',
    responsibilities: [
      'Own multi-channel storytelling frameworks across product, lifecycle, and experiential initiatives.',
      'Translate research insights into high-performing campaign blueprints with measurable lift.',
      'Mentor a hybrid collective of designers, writers, and producers to deliver premium customer journeys.',
      'Collaborate with hospitality partners to localise campaigns and personalise digital touchpoints.',
    ],
    requirements: [
      '7+ years in brand strategy, lifecycle marketing, or experience design.',
      'Portfolio demonstrating omni-channel storytelling with measurable growth.',
      'Comfort leading hybrid workshops and facilitating executive readouts.',
      'Bonus: premium hospitality, travel, or luxury brand exposure.',
    ],
    companyInfo:
      'Harbor & Pine curates boutique hospitality experiences for modern travellers. We build deep loyalty through premium partnerships, curated memberships, and storytelling-rich moments.',
    culture:
      'We celebrate craft, welcome remote voices, and protect wellbeing with No Meeting Fridays and travel stipends for research immersions.',
    postedAt: '2024-04-28T13:45:00Z',
    updatedAt: '2024-05-23T09:10:00Z',
    hiringManager: 'Marissa Delaine',
    recruiterNotes:
      'Prioritise candidates who can ship measurement frameworks quickly and have direct hospitality or subscription storytelling wins.',
    skills: {
      core: ['Lifecycle storytelling', 'Campaign analytics', 'Team leadership', 'Journey orchestration'],
      bonus: ['Luxury hospitality', 'Webflow', 'Long-form editorial'],
    },
    applicationQuestions: [
      {
        id: 'q-strategy-measure',
        question: 'How do you measure the success of an end-to-end brand experience initiative?',
        idealResponse: 'Look for funnel lift, retention, and engagement signals across owned and experiential channels.',
      },
      {
        id: 'q-portfolio',
        question: 'Share a campaign that demonstrates premium storytelling across mediums.',
        idealResponse: 'We expect a digital + in-person example with metrics, partners, and creative process breakdowns.',
      },
    ],
    pipeline: {
      stages: [
        {
          id: 'sourcing',
          count: 6,
          conversion: 35,
          highlights: [
            {
              title: 'Lead Storyteller · Collective & Co.',
              company: 'Collective & Co.',
              pulse: 'saved · 1 day ago',
            },
          ],
        },
        { id: 'applied', count: 18, conversion: 100 },
        {
          id: 'interviewing',
          count: 7,
          conversion: 39,
          highlights: [
            {
              title: 'Brand Experience Director',
              company: 'Verb Studio',
              pulse: 'panel set · 3 hours ago',
            },
          ],
        },
        {
          id: 'offer',
          count: 2,
          conversion: 11,
        },
        {
          id: 'hired',
          count: 0,
          conversion: 0,
        },
      ],
      metrics: {
        medianResponseHours: 16,
        velocityDays: 28,
        fillRate: 45,
      },
    },
    candidates: [
      {
        id: 'candidate-elinor',
        name: 'Elinor Stevens',
        headline: 'Brand Storytelling Lead · Verb Studio',
        stage: 'interviewing',
        matchScore: 92,
        submittedAt: '2024-05-10T09:00:00Z',
        nextStep: 'Panel interview Friday',
        answers: [
          {
            id: 'ans-elinor-measure',
            question: 'How do you measure the success of an end-to-end brand experience initiative?',
            summary: 'Ties lifecycle KPIs to NPS, hospitality upsells, and member retention windows.',
          },
          {
            id: 'ans-elinor-portfolio',
            question: 'Share a campaign that demonstrates premium storytelling across mediums.',
            summary: 'Launched “City in Bloom” membership rollout with 11% loyalty lift and 3% churn reduction.',
          },
        ],
        skills: {
          matched: ['Lifecycle storytelling', 'Campaign analytics', 'Journey orchestration'],
          gaps: ['Motion design'],
        },
        experience: [
          {
            id: 'exp-elinor-verb',
            title: 'Head of Brand Experience',
            company: 'Verb Studio',
            type: 'Full-time',
            highlight: 'Scaled multi-market launch rituals and re-architected retention cadences for premium members.',
          },
          {
            id: 'exp-elinor-freelance',
            title: 'Narrative Designer',
            company: 'Independent',
            type: 'Freelance',
            highlight: 'Built story systems for DTC lifestyle brands and early hospitality collectives.',
          },
        ],
        reviews: [
          {
            id: 'rev-elinor',
            author: 'Victor Chen · Director, Verb Studio',
            quote: 'Brings premium craft and loves orchestrating cross-functional win rooms.',
          },
        ],
      },
      {
        id: 'candidate-samira',
        name: 'Samira Cole',
        headline: 'Lifecycle Strategist · North & Pine',
        stage: 'offer',
        matchScore: 88,
        submittedAt: '2024-05-04T15:10:00Z',
        nextStep: 'Offer review Tuesday',
        answers: [
          {
            id: 'ans-samira-measure',
            question: 'How do you measure the success of an end-to-end brand experience initiative?',
            summary: 'Focuses on loyalty growth, membership expansion, and high-intent hospitality conversions.',
          },
        ],
        skills: {
          matched: ['Team leadership', 'Journey orchestration', 'Luxury hospitality'],
          gaps: ['Motion design'],
        },
        experience: [
          {
            id: 'exp-samira-north',
            title: 'Lifecycle Strategist',
            company: 'North & Pine',
            type: 'Full-time',
            highlight: 'Delivered 17% uplift in member renewals with hospitality partner storytelling.',
          },
        ],
      },
    ],
    metrics: {
      views: 1432,
      applications: 18,
      interviewRate: 39,
      responseHours: 16,
      fillRate: 45,
    },
  },
  {
    id: 'listing-ops',
    title: 'Product Operations Lead',
    company: 'Lumen Desk',
    salary: { min: 102000, max: 128000, currency: 'USD', period: 'year' },
    location: { city: 'Toronto', country: 'Canada' },
    matchScore: 88,
    openings: 1,
    summary: 'Unify release rituals and customer voice loops for a distributed product org serving hybrid teams.',
    description:
      'Lumen Desk powers the hybrid workplace. We need a Product Operations Lead who can orchestrate release governance, keep feedback loops sharp, and align product squads with GTM partners across time zones.',
    responsibilities: [
      'Run the release calendar and ensure every squad ships to quality with clear owner accountability.',
      'Instrument continuous discovery cadences and customer advisory rituals.',
      'Partner with revenue leaders to translate product updates into adoption playbooks.',
      'Champion async collaboration and healthy retros across product, design, and engineering.',
    ],
    requirements: [
      '5+ years in product operations, chief of staff, or program management roles.',
      'Experience supporting distributed product teams with mission-critical launches.',
      'Comfortable with analytics, Notion/Linear tooling, and change management frameworks.',
      'Bonus: B2B SaaS or workplace technology background.',
    ],
    companyInfo:
      'Lumen Desk equips hybrid teams with intelligent workspace tools. We support 4,000+ companies across 32 countries.',
    culture:
      'Remote-first with quarterly onsites, wellbeing stipends, and a learning budget for every teammate.',
    postedAt: '2024-05-01T08:20:00Z',
    updatedAt: '2024-05-24T12:35:00Z',
    hiringManager: 'Jonah Price',
    skills: {
      core: ['Release governance', 'Stakeholder communication', 'Continuous discovery'],
      bonus: ['Change management', 'Analytics storytelling'],
    },
    applicationQuestions: [
      {
        id: 'q-ops-rituals',
        question: 'Describe the release rituals you run to keep cross-functional teams aligned.',
        idealResponse: 'We expect a cadence overview, tooling, and post-release measurement habits.',
      },
    ],
    pipeline: {
      stages: [
        { id: 'sourcing', count: 4, conversion: 28 },
        { id: 'applied', count: 11, conversion: 100 },
        { id: 'interviewing', count: 5, conversion: 45 },
        { id: 'offer', count: 1, conversion: 9 },
        { id: 'hired', count: 1, conversion: 9 },
      ],
      metrics: {
        medianResponseHours: 12,
        velocityDays: 34,
        fillRate: 68,
      },
    },
    candidates: [
      {
        id: 'candidate-luca',
        name: 'Luca Fernandez',
        headline: 'Product Operations Manager · Scout Labs',
        stage: 'offer',
        matchScore: 88,
        submittedAt: '2024-04-02T13:45:00Z',
        nextStep: 'Offer review with finance',
        answers: [
          {
            id: 'ans-luca-rituals',
            question: 'Describe the release rituals you run to keep cross-functional teams aligned.',
            summary: 'Runs async status scrums, readiness reviews, and 48-hour post-launch retros with GTM sign-off.',
          },
        ],
        skills: {
          matched: ['Release governance', 'Stakeholder communication', 'Continuous discovery'],
          gaps: ['Hardware operations'],
        },
        experience: [
          {
            id: 'exp-luca-scout',
            title: 'Product Ops Manager',
            company: 'Scout Labs',
            type: 'Full-time',
            highlight: 'Scaled product ops rituals across 4 squads and trimmed release incident rate by 32%.',
          },
          {
            id: 'exp-luca-freelance',
            title: 'Ops Consultant',
            company: 'Independent',
            type: 'Freelance',
            highlight: 'Rolled out analytics instrumentation and OKR hygiene for remote-first teams.',
          },
        ],
      },
      {
        id: 'candidate-rachel',
        name: 'Rachel Dunne',
        headline: 'Chief of Staff · Nimbus Systems',
        stage: 'interviewing',
        matchScore: 83,
        submittedAt: '2024-04-19T10:05:00Z',
        answers: [
          {
            id: 'ans-rachel-rituals',
            question: 'Describe the release rituals you run to keep cross-functional teams aligned.',
            summary: 'Quarterly planning anchors, weekly release syncs, and MBRs with product + go-to-market leads.',
          },
        ],
        skills: {
          matched: ['Stakeholder communication', 'Change management'],
          gaps: ['Continuous discovery'],
        },
      },
    ],
    metrics: {
      views: 980,
      applications: 11,
      interviewRate: 45,
      responseHours: 12,
      fillRate: 68,
    },
  },
  {
    id: 'listing-community',
    title: 'Community Design Partner',
    company: 'Gatherly',
    salary: { min: 88000, max: 108000, currency: 'USD', period: 'year' },
    location: { city: 'Denver', state: 'CO', country: 'USA' },
    matchScore: 95,
    openings: 1,
    summary: 'Shape hybrid event programs, premium cohorts, and ambassador playbooks for the Gatherly network.',
    description:
      'Gatherly is building the next generation of premium community experiences. You will architect programming across live, digital, and asynchronous channels while partnering with creators and brand sponsors.',
    responsibilities: [
      'Design multi-format programming with measurable retention lift.',
      'Launch ambassador programs that activate super members and freelance experts.',
      'Collaborate with marketing to publish behind-the-scenes stories and highlight member wins.',
    ],
    requirements: [
      '5+ years building communities, memberships, or experiential programs.',
      'Proven record of scaling ambassador or creator initiatives.',
      'Strong facilitation and storytelling skills across mediums.',
    ],
    companyInfo:
      'Gatherly powers curated cohorts for operators, creatives, and founders across 40+ cities.',
    culture:
      'We run async-first rituals, sponsor co-working memberships, and host quarterly residencies in partner cities.',
    postedAt: '2024-05-08T17:05:00Z',
    updatedAt: '2024-05-23T18:20:00Z',
    hiringManager: 'Imani Walker',
    skills: {
      core: ['Community architecture', 'Experiential design', 'Content programming'],
      bonus: ['Creator partnerships', 'Audio storytelling'],
    },
    applicationQuestions: [
      {
        id: 'q-community-program',
        question: 'What community program are you most proud of and why?',
        idealResponse: 'Look for programs with measurable engagement lift, sponsor alignment, and ambassador activation.',
      },
    ],
    pipeline: {
      stages: [
        { id: 'sourcing', count: 3, conversion: 25 },
        { id: 'applied', count: 9, conversion: 100 },
        { id: 'interviewing', count: 4, conversion: 44 },
        { id: 'offer', count: 1, conversion: 11 },
        { id: 'hired', count: 0, conversion: 0 },
      ],
      metrics: {
        medianResponseHours: 20,
        velocityDays: 31,
        fillRate: 50,
      },
    },
    candidates: [
      {
        id: 'candidate-ava',
        name: 'Ava Mireles',
        headline: 'Community Architect · Collective Pulse',
        stage: 'interviewing',
        matchScore: 95,
        submittedAt: '2024-05-14T11:30:00Z',
        nextStep: 'Founders coffee chat',
        answers: [
          {
            id: 'ans-ava-program',
            question: 'What community program are you most proud of and why?',
            summary: 'Scaled “Creators in Orbit” hybrid residencies with 87% satisfaction and recurring sponsor revenue.',
          },
        ],
        skills: {
          matched: ['Community architecture', 'Experiential design', 'Ambassador programs'],
          gaps: [],
        },
        reviews: [
          {
            id: 'rev-ava',
            author: 'Kim Patel · Founder, Collective Pulse',
            quote: 'Turned our hybrid community into a premium membership within 90 days.',
          },
        ],
      },
      {
        id: 'candidate-owen',
        name: 'Owen Ibarra',
        headline: 'Freelance Experience Producer',
        stage: 'sourcing',
        matchScore: 81,
        submittedAt: '2024-05-12T09:10:00Z',
        skills: {
          matched: ['Experiential design', 'Content programming'],
          gaps: ['Creator partnerships'],
        },
        experience: [
          {
            id: 'exp-owen-freelance',
            title: 'Experience Producer',
            company: 'Independent',
            type: 'Freelance',
            highlight: 'Produced hybrid summits for Web3 and design collectives across North America.',
          },
        ],
      },
    ],
    metrics: {
      views: 640,
      applications: 9,
      interviewRate: 44,
      responseHours: 20,
      fillRate: 50,
    },
  },
  {
    id: 'listing-ai',
    title: 'AI Research Producer',
    company: 'Signal North',
    salary: { min: 135000, max: 158000, currency: 'USD', period: 'year' },
    location: { city: 'San Francisco', state: 'CA', country: 'USA', remote: true },
    matchScore: 82,
    openings: 1,
    summary: 'Orchestrate applied AI sprint studies, research councils, and practitioner feedback loops.',
    description:
      'Signal North pairs product teams with enterprise partners to ship trustworthy AI. You will run research sprints, coordinate beta councils, and translate findings into product direction.',
    responsibilities: [
      'Plan and facilitate cross-functional AI research sprints with enterprise partners.',
      'Synthesize insights into actionable recommendations for product and GTM teams.',
      'Manage practitioner councils and community contributors.',
    ],
    requirements: [
      'Experience in UX research, product management, or research operations within AI/ML contexts.',
      'Comfortable with technical audiences and qualitative + quantitative synthesis.',
      'Bonus: security or regulated industry exposure.',
    ],
    companyInfo:
      'Signal North helps enterprises ship responsible AI with industry experts, curated data, and ethical guardrails.',
    culture:
      'We are remote-first with biannual labs weeks, wellness stipends, and dedicated research sabbaticals.',
    postedAt: '2024-05-12T11:25:00Z',
    updatedAt: '2024-05-24T09:40:00Z',
    hiringManager: 'Priya Raman',
    skills: {
      core: ['Applied research', 'Stakeholder storytelling', 'Sprint facilitation'],
      bonus: ['Security clearance', 'Technical writing'],
    },
    applicationQuestions: [
      {
        id: 'q-ai-sprint',
        question: 'Walk us through how you facilitated your last AI research sprint.',
        idealResponse: 'We want to hear about partner alignment, insights synthesis, and downstream product impact.',
      },
    ],
    pipeline: {
      stages: [
        { id: 'sourcing', count: 5, conversion: 38 },
        { id: 'applied', count: 7, conversion: 100 },
        { id: 'interviewing', count: 2, conversion: 29 },
        { id: 'offer', count: 0, conversion: 0 },
        { id: 'hired', count: 0, conversion: 0 },
      ],
      metrics: {
        medianResponseHours: 18,
        velocityDays: 40,
        fillRate: 35,
      },
    },
    candidates: [
      {
        id: 'candidate-ravi',
        name: 'Ravi Kapoor',
        headline: 'Research Producer · Horizon AI',
        stage: 'applied',
        matchScore: 82,
        submittedAt: '2024-05-22T08:25:00Z',
        answers: [
          {
            id: 'ans-ravi-sprint',
            question: 'Walk us through how you facilitated your last AI research sprint.',
            summary: 'Partnered with an enterprise security team to validate anomaly detection features and deliver roadmap updates.',
          },
        ],
        skills: {
          matched: ['Applied research', 'Sprint facilitation', 'Stakeholder storytelling'],
          gaps: ['Security clearance'],
        },
      },
    ],
    metrics: {
      views: 720,
      applications: 7,
      interviewRate: 29,
      responseHours: 18,
      fillRate: 35,
    },
  },
];

const MOCK_PIPELINE = {
  stages: [
    { id: 'sourcing', count: 18, conversion: 35 },
    { id: 'applied', count: 45, conversion: 100 },
    { id: 'interviewing', count: 18, conversion: 40 },
    { id: 'offer', count: 4, conversion: 9 },
    { id: 'hired', count: 1, conversion: 2 },
  ],
  metrics: {
    velocityDays: 33,
    medianResponseHours: 16,
    fillRate: 49,
  },
};

const MOCK_STATUS_BREAKDOWN = [
  { status: 'submitted', label: 'Submitted', count: 45 },
  { status: 'interviewing', label: 'Interviewing', count: 18 },
  { status: 'offer', label: 'Offer', count: 4 },
  { status: 'hired', label: 'Hired', count: 1 },
];

const MOCK_RECOMMENDATIONS = [
  { id: 'follow-up-strategist', title: 'Send thank-you packets to Brand Strategist finalists' },
  { id: 'prep-lumen-offer', title: 'Align compensation bands with finance for Lumen Desk offer' },
  { id: 'gatherly-outreach', title: 'Invite Gatherly ambassadors to refer new storytellers' },
];

function PreviewWorkspace() {
  const [activeView, setActiveView] = useState('overview');
  const workspace = useMemo(
    () => ({
      summary: {
        totalApplications: 14,
        activeApplications: 8,
        interviewsScheduled: 4,
        offersNegotiating: 2,
        favourites: 6,
        pendingResponses: 3,
      },
      statusBreakdown: MOCK_STATUS_BREAKDOWN,
      recommendedActions: MOCK_RECOMMENDATIONS,
      applications: MOCK_APPLICATIONS,
      interviews: [],
      favourites: [],
      responses: [],
      jobListings: MOCK_LISTINGS,
      pipelineSnapshot: MOCK_PIPELINE,
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Preview</p>
              <h1 className="text-3xl font-semibold text-slate-900">Job hub workspace preview</h1>
              <p className="text-sm text-slate-500">
                Explore the refreshed listings spotlight and ATS pipeline board with mock data.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
              <span>Active view:</span>
              <select
                value={activeView}
                onChange={(event) => setActiveView(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm focus:border-accent focus:outline-none"
              >
                <option value="overview">Overview</option>
                <option value="apps">Apps</option>
                <option value="meets">Meets</option>
                <option value="saved">Saved</option>
                <option value="replies">Replies</option>
              </select>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <JobApplicationWorkspaceLayout
            workspace={workspace}
            activeView={activeView}
            onChangeView={setActiveView}
            onCreateApplication={() => {}}
            onEditApplication={() => {}}
            onArchiveApplication={() => {}}
            onCreateInterview={() => {}}
            onEditInterview={() => {}}
            onDeleteInterview={() => {}}
            onCreateFavourite={() => {}}
            onEditFavourite={() => {}}
            onDeleteFavourite={() => {}}
            onCreateResponse={() => {}}
            onEditResponse={() => {}}
            onDeleteResponse={() => {}}
            actionError={null}
          />
        </section>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<PreviewWorkspace />);
}
