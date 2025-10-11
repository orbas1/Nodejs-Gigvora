import { CheckCircleIcon } from '@heroicons/react/24/solid';

const userFeatures = [
  {
    id: 'search',
    eyebrow: 'Precision discovery',
    title: 'Search and shortlist talent with context-rich profiles',
    description:
      'Filter by skills, availability, rates, and collaboration style while seeing the full story behind every professional.',
    bullets: ['Live filters update your pool instantly', 'Save curated shortlists for each initiative', 'Deep profiles surface work history, proof points, and social signals'],
    mockup: SearchMockup,
  },
  {
    id: 'booking',
    eyebrow: 'Booking flow',
    title: 'Book vetted talent in a guided collaboration flow',
    description:
      'Kick off engagements faster with structured milestones, scope approvals, and kickoff notes in one secure workspace.',
    bullets: ['Milestone planner keeps both sides accountable', 'Smart reminders track signatures and kickoff tasks', 'Shared files and briefs live beside the conversation'],
    mockup: BookingMockup,
  },
  {
    id: 'subscription',
    eyebrow: 'Subscriptions',
    title: 'Manage retainers and subscriptions without spreadsheets',
    description:
      'Recurring engagements auto-sync with billing preferences so finance stays informed while teams focus on outcomes.',
    bullets: ['Visual calendar of renewals and invoice dates', 'Usage tracking spotlights overages early', 'Custom tags for departments and cost centers'],
    mockup: SubscriptionMockup,
  },
  {
    id: 'dashboard',
    eyebrow: 'Client dashboard',
    title: 'Track progress and ROI across every engagement',
    description:
      'Portfolio-level insights keep leadership confident that initiatives are shipping on time and on budget.',
    bullets: ['Delivery health indicators refresh in real time', 'Budget burn versus forecast is always visible', 'Spotlight stories capture qualitative wins'],
    mockup: ClientDashboardMockup,
  },
];

const providerFeatures = [
  {
    id: 'pipeline',
    eyebrow: 'Opportunities',
    title: 'A focused pipeline that turns conversations into contracts',
    description:
      'Manage inbound briefs, proposals, and negotiations with a single board that mirrors your agency playbook.',
    bullets: ['Drag and drop deals through your pipeline stages', 'Automated nudges keep leads warm without the busywork', 'Proposal previews show exactly what clients see'],
    mockup: PipelineMockup,
  },
  {
    id: 'team',
    eyebrow: 'Team availability',
    title: 'Know every expert’s bandwidth before you say yes',
    description:
      'Centralize calendars, preferred projects, and rate cards so producers can assemble the right squad in minutes.',
    bullets: ['Heatmap view of weekly availability', 'Skill tags reveal bench strength instantly', 'Pin go-to collaborators for faster staffing'],
    mockup: TeamAvailabilityMockup,
  },
  {
    id: 'insights',
    eyebrow: 'Performance insights',
    title: 'See which engagements drive revenue and retention',
    description:
      'Revenue dashboards combine bookings, utilization, and satisfaction signals so leaders can plan the next sprint.',
    bullets: ['MRR, NPS, and win-rate in a single glance', 'Spot trends by segment, industry, or channel', 'Export-ready charts for board updates'],
    mockup: InsightsMockup,
  },
  {
    id: 'broadcast',
    eyebrow: 'Community feed',
    title: 'Broadcast wins and opportunities to your network',
    description:
      'The live feed blends marketing, recruiting, and community building—keeping talent excited about what’s next.',
    bullets: ['Schedule drops across web, email, and mobile', 'Template library keeps messaging on brand', 'Engagement analytics highlight top performers'],
    mockup: BroadcastMockup,
  },
];

function ProductShowcaseSection({ title, subtitle, features }) {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl space-y-16 px-6">
        <header className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">{subtitle}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          <p className="text-base text-slate-600">
            Explore the key workspaces that make Gigvora feel like a polished SaaS suite—not a patchwork of disconnected tools.
          </p>
        </header>
        <div className="space-y-20">
          {features.map((feature, index) => (
            <ShowcaseRow key={feature.id} feature={feature} reverse={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseRow({ feature, reverse }) {
  const MockupComponent = feature.mockup;

  return (
    <div
      className={`grid gap-12 lg:grid-cols-2 lg:items-center ${
        reverse ? 'lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1' : ''
      }`}
    >
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-accentSoft bg-accentSoft px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">
          {feature.eyebrow}
        </span>
        <h3 className="text-2xl font-semibold text-slate-900">{feature.title}</h3>
        <p className="text-base text-slate-600">{feature.description}</p>
        <ul className="space-y-3">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
              <CheckCircleIcon className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative">
        <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-tr from-accent/10 via-transparent to-accent/20 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <MockupComponent />
        </div>
      </div>
    </div>
  );
}

function BrowserChrome({ title, children, accent = 'accent' }) {
  const accentPills = {
    accent: 'bg-accentSoft text-accentDark',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    sky: 'bg-sky-100 text-sky-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-accent/10">
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50 px-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="hidden rounded-full border border-slate-200 px-3 py-1 sm:inline-flex">{title}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accentPills[accent] ?? accentPills.accent}`}>
            Live
          </span>
        </div>
      </div>
      <div className="space-y-6 bg-white p-6">{children}</div>
    </div>
  );
}

function Avatar({ initials, gradient }) {
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${gradient}`}>
      {initials}
    </div>
  );
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    sky: 'bg-sky-100 text-sky-600',
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function SearchMockup() {
  const profiles = [
    {
      name: 'Riya Banerjee',
      role: 'Product Designer • Wellness',
      tags: [
        { label: 'UX Research', tone: 'emerald' },
        { label: 'Figma Systems', tone: 'violet' },
      ],
      gradient: 'bg-gradient-to-br from-violet-500 to-indigo-500',
    },
    {
      name: 'Arman Ortega',
      role: 'Full-stack Developer • Fintech',
      tags: [
        { label: 'Node.js', tone: 'sky' },
        { label: 'AWS', tone: 'amber' },
      ],
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
    },
    {
      name: 'Imani Kole',
      role: 'Growth Strategist • SaaS',
      tags: [
        { label: 'Paid Media', tone: 'emerald' },
        { label: 'Lifecycle', tone: 'violet' },
      ],
      gradient: 'bg-gradient-to-br from-rose-500 to-orange-500',
    },
  ];

  return (
    <BrowserChrome title="Talent Search">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <span className="hidden rounded-full bg-white px-3 py-1 font-semibold text-slate-500 shadow-sm sm:inline-flex">Role</span>
        <span className="font-semibold text-slate-700">Product strategist</span>
        <span className="text-slate-300">|</span>
        <span>Availability: &lt; 2 weeks</span>
        <span className="text-slate-300">|</span>
        <span>Timezone overlap: 4 hrs+</span>
      </div>
      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.name}
            className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-surface p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-4">
              <Avatar initials={profile.name.split(' ').map((n) => n[0]).join('')} gradient={profile.gradient} />
              <div>
                <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                <p className="text-xs text-slate-500">{profile.role}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <Pill key={tag.label} tone={tag.tone}>
                  {tag.label}
                </Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function BookingMockup() {
  const steps = [
    { title: 'Scope alignment', detail: 'Mutual brief approved', status: 'complete' },
    { title: 'Milestones', detail: '3 phases drafted', status: 'active' },
    { title: 'Kickoff call', detail: 'Scheduled for Thu • 10:00 AM EST', status: 'up-next' },
    { title: 'Collaboration hub', detail: 'Workspace ready for files & chat', status: 'pending' },
  ];

  const statusStyles = {
    complete: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    active: 'border-accentSoft bg-white text-accentDark',
    'up-next': 'border-sky-200 bg-sky-50 text-sky-600',
    pending: 'border-slate-200 bg-slate-50 text-slate-500',
  };

  return (
    <BrowserChrome title="Booking Flow" accent="emerald">
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Project</p>
          <h4 className="text-lg font-semibold text-slate-900">Brand relaunch sprint</h4>
        </div>
        <Pill tone="emerald">Approval 92%</Pill>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <div key={step.title} className={`rounded-2xl border p-4 text-sm ${statusStyles[step.status]}`}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{step.title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{step.detail}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Kickoff notes</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Share brand guidelines + asset folder</li>
          <li>• Confirm payment method &amp; project owner</li>
          <li>• Introduce cross-functional collaborators</li>
        </ul>
      </div>
    </BrowserChrome>
  );
}

function SubscriptionMockup() {
  const rows = [
    { name: 'Growth advisory pod', owner: 'Nova Labs', renewal: 'Renews Apr 18', value: '$6,500 / month', status: 'On track' },
    { name: 'Data storytelling squad', owner: 'Atlas Ventures', renewal: 'Renews Apr 24', value: '$9,200 / month', status: 'Review' },
    { name: 'Lifecycle automation crew', owner: 'Horizon Health', renewal: 'Renews May 01', value: '$4,800 / month', status: 'Upsell' },
  ];

  return (
    <BrowserChrome title="Subscriptions" accent="violet">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-500">Recurring revenue</p>
          <p className="text-xl font-semibold text-slate-900">$22.5k</p>
        </div>
        <Pill tone="violet">Up 18% MoM</Pill>
        <Pill tone="emerald">Retention 96%</Pill>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.owner}</p>
              </div>
              <Pill tone="slate">{row.renewal}</Pill>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>{row.value}</span>
              <span className="font-semibold text-emerald-500">{row.status}</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function ClientDashboardMockup() {
  return (
    <BrowserChrome title="Client Dashboard" accent="amber">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Active engagements</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">12</p>
          <p className="text-xs text-amber-600">+3 new this week</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">On-time delivery</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">94%</p>
          <p className="text-xs text-emerald-600">SLA variance &lt; 6%</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Budget health</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">$312k</p>
          <p className="text-xs text-slate-500">Budget used • Forecast 87%</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Delivery momentum</p>
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs text-slate-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <div key={day} className="space-y-2">
                <div className="h-20 rounded-full bg-gradient-to-b from-accent/70 to-accent/10" />
                <span>{day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner lg:w-56">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Spotlight stories</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <p>• Atlas Labs launched beta 2 weeks early.</p>
            <p>• Horizon Health upsold strategy sprint.</p>
            <p>• Nova Labs rated collaboration 9.6/10.</p>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function PipelineMockup() {
  const columns = [
    {
      title: 'Discovery',
      cards: [
        { name: 'EcoBank app refresh', value: '$18k', time: 'New inquiry' },
        { name: 'Muse Studio partner pitch', value: '$24k', time: 'Intro call booked' },
      ],
    },
    {
      title: 'Proposal',
      cards: [
        { name: 'VoltWear loyalty build', value: '$42k', time: 'Proposal sent' },
        { name: 'Atlas Labs R&amp;D pod', value: '$36k', time: 'Awaiting feedback' },
      ],
    },
    {
      title: 'Contract',
      cards: [
        { name: 'Horizon Health lifecycle', value: '$28k', time: 'Legal review' },
      ],
    },
  ];

  return (
    <BrowserChrome title="Provider Pipeline" accent="emerald">
      <div className="flex flex-wrap gap-4">
        {columns.map((column) => (
          <div key={column.title} className="w-full flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:w-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{column.title}</p>
              <span className="text-xs text-slate-400">{column.cards.length} deals</span>
            </div>
            <div className="mt-3 space-y-3">
              {column.cards.map((card) => (
                <div key={card.name} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{card.value}</span>
                    <span>{card.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function TeamAvailabilityMockup() {
  const people = [
    { name: 'Lena Kim', role: 'Design Lead', focus: 'Brand systems', load: '60%', gradient: 'bg-gradient-to-br from-sky-500 to-indigo-500' },
    { name: 'Milo Grant', role: 'Frontend Engineer', focus: 'React + Vite', load: '40%', gradient: 'bg-gradient-to-br from-emerald-500 to-lime-500' },
    { name: 'Chandra Patel', role: 'Producer', focus: 'Enterprise onboarding', load: '80%', gradient: 'bg-gradient-to-br from-rose-500 to-orange-500' },
  ];

  return (
    <BrowserChrome title="Team Availability" accent="sky">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-500">This week</p>
        <Pill tone="sky">Capacity 68%</Pill>
        <Pill tone="emerald">8 people free in 2 weeks</Pill>
      </div>
      <div className="space-y-3">
        {people.map((person) => (
          <div key={person.name} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <Avatar initials={person.name.split(' ').map((n) => n[0]).join('')} gradient={person.gradient} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{person.name}</p>
              <p className="text-xs text-slate-500">{person.role}</p>
              <p className="text-xs text-slate-400">Focus: {person.focus}</p>
            </div>
            <div className="w-full sm:w-40">
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" style={{ width: person.load }} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">Load {person.load}</p>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

function InsightsMockup() {
  return (
    <BrowserChrome title="Performance Insights" accent="emerald">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Monthly revenue</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">$186k</p>
          <p className="text-xs text-emerald-600">+12% vs. last month</p>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-500">Win rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">48%</p>
          <p className="text-xs text-violet-600">+6 pts</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Retention</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">93%</p>
          <p className="text-xs text-amber-600">Top quartile</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Revenue trajectory</p>
          <div className="mt-4 h-36 rounded-2xl bg-gradient-to-r from-emerald-100 via-white to-emerald-100" />
        </div>
        <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner lg:w-64">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Top segments</p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Fintech</span>
              <Pill tone="emerald">$62k</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span>Healthtech</span>
              <Pill tone="violet">$44k</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span>Climate</span>
              <Pill tone="sky">$28k</Pill>
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

function BroadcastMockup() {
  const posts = [
    {
      name: 'Studio Nova',
      headline: 'Case study drop',
      summary: 'Rearchitected VoltWear loyalty in 8 weeks. Diving into the data &amp; design story.',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    },
    {
      name: 'Atlas Labs',
      headline: 'Hiring',
      summary: 'Looking for a senior UX researcher for our climate analytics pod. Remote friendly.',
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
    },
    {
      name: 'Horizon Health',
      headline: 'Launch update',
      summary: 'Patient onboarding portal just went live. See behind-the-scenes learnings.',
      gradient: 'bg-gradient-to-br from-rose-500 to-orange-500',
    },
  ];

  return (
    <BrowserChrome title="Community Feed" accent="rose">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-500">Scheduled drops</p>
        <Pill tone="amber">7 queued</Pill>
        <Pill tone="violet">Cross-post to LinkedIn</Pill>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar initials={post.name.split(' ').map((n) => n[0]).join('')} gradient={post.gradient} />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{post.headline}</p>
                <p className="text-sm font-semibold text-slate-900">{post.name}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{post.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
              <span>Reach 12.4k</span>
              <span>Clicks 540</span>
              <span>Save template</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  );
}

export default function ProductShowcase() {
  return (
    <div className="space-y-0">
      <ProductShowcaseSection
        title="How clients experience Gigvora"
        subtitle="Client-side product tour"
        features={userFeatures}
      />
      <ProductShowcaseSection
        title="How providers grow with Gigvora"
        subtitle="Provider-side product tour"
        features={providerFeatures}
      />
    </div>
  );
}
