import PageHeader from '../components/PageHeader.jsx';
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  GlobeEuropeAfricaIcon,
  HeartIcon,
  LifebuoyIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const HIGHLIGHTS = [
  { label: 'Talent profiles', value: '15k+' },
  { label: 'Active organisations', value: '280+' },
  { label: 'Opportunities launched', value: '4.9k' },
  { label: 'Avg. time-to-match', value: '48 hrs' },
];

const ENTERPRISE_GUARANTEES = [
  {
    title: 'Enterprise governance',
    description: 'ISO-ready controls and auditable approvals keep procurement comfortable.',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'Global workforce operations',
    description: 'Local partners manage tax, labour, and onboarding checks across 60+ regions.',
    Icon: GlobeEuropeAfricaIcon,
  },
  {
    title: 'Dedicated success pods',
    description: 'Embedded strategists and talent partners keep every squad on track.',
    Icon: LifebuoyIcon,
  },
];

const VALUES = [
  {
    title: 'Community first',
    description: 'We build with freelancers, agencies, and employers so workflows stay real.',
    Icon: UserGroupIcon,
  },
  {
    title: 'Transparency and trust',
    description: 'Clear briefs and reliable payments keep every collaboration accountable.',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'Progress through experimentation',
    description: 'We ship fast, learn fast, and turn feedback into product gains.',
    Icon: SparklesIcon,
  },
];

const PILLARS = [
  {
    title: 'Unified talent graph',
    description: 'Matching spans jobs, gigs, projects, and missions in one view.',
    Icon: GlobeEuropeAfricaIcon,
  },
  {
    title: 'Operational automation',
    description: 'Contracts, compliance, onboarding, and payments run in the background.',
    Icon: RocketLaunchIcon,
  },
  {
    title: 'Supportive ecosystem',
    description: 'Communities, finance tools, and wellbeing keep flexible work sustainable.',
    Icon: HeartIcon,
  },
];

const SERVICE_LAYERS = [
  {
    title: 'Strategy and enablement',
    description: 'Discovery sprints map needs and deliver simple playbooks.',
    Icon: BuildingOffice2Icon,
  },
  {
    title: 'Capability development',
    description: 'Capability programmes upskill independents and in-house teams.',
    Icon: AcademicCapIcon,
  },
  {
    title: 'Success measurement',
    description: 'Dashboards track velocity, satisfaction, and ROI in one place.',
    Icon: ClipboardDocumentCheckIcon,
  },
];

const MILESTONES = [
  {
    year: '2021',
    title: 'Idea to prototype',
    description: 'Founded in London to remove friction from hybrid team assembly.',
  },
  {
    year: '2022',
    title: 'Launchpad goes live',
    description: 'Experience Launchpad and marketplace welcomed the first 1,000 members.',
  },
  {
    year: '2023',
    title: 'Scaling globally',
    description: 'Finance tooling and new hubs launched across Europe, MEA, and North America.',
  },
  {
    year: '2024',
    title: 'Ecosystem intelligence',
    description: 'Predictive resourcing now supports enterprises and richer pathways for talent.',
  },
];

const GLOBAL_NETWORK = [
  { region: 'Europe & UK', detail: 'London, Berlin, Lisbon' },
  { region: 'Middle East & Africa', detail: 'Dubai, Cape Town, Lagos' },
  { region: 'Americas', detail: 'Toronto, New York, São Paulo' },
  { region: 'Asia Pacific', detail: 'Singapore, Bengaluru, Sydney' },
];

const TRUST_INDICATORS = [
  'SOC 2 readiness in progress',
  'GDPR and UK GDPR compliant',
  'Diversity, equity, and inclusion partner network',
  'SLA-backed onboarding and support',
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-slate-50 py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-32 top-20 hidden h-96 w-96 rounded-full bg-accent/10 blur-[160px] lg:block" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Company"
          title="About Gigvora"
          description="Gigvora connects teams and independents through one hiring and collaboration platform."
          meta="London HQ • Serving members in 32 countries"
        />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm">
            <CheckBadgeIcon className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Trusted by people, operations, and procurement leaders.</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Enterprise</span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Scaleups</span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Public Sector</span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Social Impact</span>
          </div>
        </div>

        <div className="mt-12 grid gap-4 text-sm text-slate-500 sm:grid-cols-2">
          <a
            href="mailto:hello@gigvora.com"
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 font-medium text-slate-900 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
          >
            <span>Book an enterprise consultation</span>
            <span aria-hidden="true">→</span>
          </a>
          <a
            href="/trust-centre"
            className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/60 px-6 py-4 font-medium text-slate-900 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
          >
            <span>Explore the Trust Centre</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="mt-16 space-y-14">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <div className="grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-start">
              <div className="space-y-6 text-base leading-7 text-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900">Our mission</h2>
                <p>
                  We build for a networked, inclusive world of work. Intelligent matching, compliance automation, and wellbeing support remove friction so teams can deliver fast and talent can grow with clarity.
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {HIGHLIGHTS.map((highlight) => (
                  <div key={highlight.label} className="rounded-2xl border border-slate-100 bg-surfaceMuted/80 p-5 text-slate-800">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{highlight.label}</dt>
                    <dd className="mt-3 text-2xl font-semibold text-slate-900">{highlight.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <div className="grid gap-10 lg:grid-cols-[1.2fr,1fr] lg:items-center">
              <div className="space-y-6 text-base leading-7 text-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900">Enterprise-ready from day one</h2>
                <p>
                  Engineered for complex organisations that expect resilience and clarity across every engagement. We partner through product, playbooks, and people to deliver measurable impact.
                </p>
                <ul className="space-y-3 text-sm">
                  {TRUST_INDICATORS.map((indicator) => (
                    <li key={indicator} className="flex items-start gap-3 text-slate-700">
                      <CheckBadgeIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {ENTERPRISE_GUARANTEES.map(({ title, description, Icon }) => (
                  <div key={title} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-surfaceMuted/70 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accentSoft/70 text-accent">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2 text-sm leading-6 text-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-900">What guides us</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              Our values act as product guardrails. They inform how we partner, support, and prioritise.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {VALUES.map(({ title, description, Icon }) => (
                <div key={title} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-surfaceMuted/60 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accentSoft/70 text-accent">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-6 text-slate-700">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">The platform pillars</h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                  Marketplace, community, and operations live together so teams see one source of truth.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {PILLARS.map(({ title, description, Icon }) => (
                    <div key={title} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-surfaceMuted/60 p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accentSoft/70 text-accent">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        <p className="text-sm leading-6 text-slate-700">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-surfaceMuted/60 p-6 text-sm leading-6 text-slate-700">
                <h3 className="text-lg font-semibold text-slate-900">Service layers</h3>
                <p className="mt-3">
                  Beyond software we embed teams and frameworks to accelerate adoption.
                </p>
                <div className="mt-6 space-y-5">
                  {SERVICE_LAYERS.map(({ title, description, Icon }) => (
                    <div key={title} className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accentSoft/70 text-accent">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-slate-900">{title}</h4>
                        <p>{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <div className="grid gap-8 lg:grid-cols-[1fr,1fr] lg:items-center">
              <div className="space-y-4 text-base leading-7 text-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900">Global reach with local insight</h2>
                <p>
                  Distributed hubs keep us close to communities and regulation, backed by partners who understand the local picture.
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {GLOBAL_NETWORK.map(({ region, detail }) => (
                  <div key={region} className="rounded-2xl border border-slate-100 bg-surfaceMuted/70 p-6">
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{region}</dt>
                    <dd className="mt-3 text-base font-medium text-slate-900">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-900">Milestones</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
              We grow with our members and track success by the opportunities we unlock.
            </p>
            <ol className="mt-10 space-y-6 border-l border-slate-200 pl-6">
              {MILESTONES.map((milestone) => (
                <li key={milestone.year} className="relative rounded-2xl border border-slate-100 bg-surfaceMuted/60 p-6">
                  <span className="absolute -left-[34px] flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-white text-sm font-semibold text-accent">
                    {milestone.year}
                  </span>
                  <div className="space-y-2 text-sm leading-6 text-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900">{milestone.title}</h3>
                    <p>{milestone.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white/95 via-white/90 to-accentSoft/40 p-8 shadow-soft">
            <div className="grid gap-8 lg:grid-cols-[3fr,2fr] lg:items-center">
              <div className="space-y-4 text-base leading-7 text-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900">Looking ahead</h2>
                <p>
                  Next we deepen intelligence, forecast demand, and grow communities of practice so flexible work stays sustainable.
                </p>
                <p>
                  We partner with enterprises, agencies, universities, and civic institutions who share our focus on inclusive work. Let&apos;s build together.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 text-sm leading-6 text-slate-700">
                <h3 className="text-lg font-semibold text-slate-900">Stay connected</h3>
                <p className="mt-3">
                  Email <a href="mailto:hello@gigvora.com" className="font-semibold text-accent transition hover:text-accentDark">hello@gigvora.com</a> for partnerships, media, or speaking enquiries. Follow product updates in the Trust Centre and monthly briefings.
                </p>
                <p className="mt-3 text-xs text-slate-500">We reply within two working days.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
