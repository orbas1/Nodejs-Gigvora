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
    description:
      'ISO-aligned security posture, auditable delivery rituals, and configurable approval flows to satisfy procurement and compliance teams.',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'Global workforce operations',
    description:
      'In-country partner network covering tax, labour, and onboarding checks across 60+ jurisdictions with consolidated reporting.',
    Icon: GlobeEuropeAfricaIcon,
  },
  {
    title: 'Dedicated success pods',
    description:
      'Strategists, talent partners, and solution engineers embedded alongside your squads to capture feedback and deliver continuous optimisation.',
    Icon: LifebuoyIcon,
  },
];

const VALUES = [
  {
    title: 'Community first',
    description:
      'We co-design every feature alongside freelancers, agencies, and employers so the platform reflects real-world workflows.',
    Icon: UserGroupIcon,
  },
  {
    title: 'Transparency and trust',
    description:
      'Clear briefs, reliable payments, and observable delivery rituals keep everyone aligned and accountable.',
    Icon: ShieldCheckIcon,
  },
  {
    title: 'Progress through experimentation',
    description:
      'We ship, learn, and iterate quickly—turning feedback loops into product improvements that compound over time.',
    Icon: SparklesIcon,
  },
];

const PILLARS = [
  {
    title: 'Unified talent graph',
    description:
      'Gigvora blends skills, availability, location, and collaboration signals to surface the right people instantly across jobs, gigs, projects, and volunteering missions.',
    Icon: GlobeEuropeAfricaIcon,
  },
  {
    title: 'Operational automation',
    description:
      'Workflow engines orchestrate contracts, compliance, onboarding, and payments so teams can focus on high-value work.',
    Icon: RocketLaunchIcon,
  },
  {
    title: 'Supportive ecosystem',
    description:
      'Community programming, finance tools, and wellbeing resources make flexible careers sustainable for the long term.',
    Icon: HeartIcon,
  },
];

const SERVICE_LAYERS = [
  {
    title: 'Strategy and enablement',
    description:
      'Discovery sprints map your talent ecosystem, quantify opportunity gaps, and shape custom playbooks for leaders and hiring managers.',
    Icon: BuildingOffice2Icon,
  },
  {
    title: 'Capability development',
    description:
      'Academies and community programmes equip independents and internal teams with future-ready skills, rituals, and certifications.',
    Icon: AcademicCapIcon,
  },
  {
    title: 'Success measurement',
    description:
      'Outcome dashboards track pipeline velocity, satisfaction, and ROI so stakeholders can steer investments with confidence.',
    Icon: ClipboardDocumentCheckIcon,
  },
];

const MILESTONES = [
  {
    year: '2021',
    title: 'Idea to prototype',
    description:
      'Our founders set out to solve the friction of assembling hybrid teams, partnering with early adopters in London to co-create the first workflow blueprints.',
  },
  {
    year: '2022',
    title: 'Launchpad goes live',
    description:
      'We launched the Experience Launchpad and early marketplace features, welcoming our first 1,000 members across technology, creative, and operations disciplines.',
  },
  {
    year: '2023',
    title: 'Scaling globally',
    description:
      'Integrated finance tooling, expanded trust and safety operations, and opened new hubs across Europe, the Middle East, and North America.',
  },
  {
    year: '2024',
    title: 'Ecosystem intelligence',
    description:
      'We now power predictive resourcing for enterprises while giving independents richer career pathways through communities, missions, and mentorship.',
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
          description="Gigvora is building the connective tissue for modern talent ecosystems—helping companies assemble world-class teams while empowering independents to design fulfilling careers."
          meta="Headquartered in London • Serving members in 32 countries"
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
                  We believe the future of work is networked, diverse, and purpose-driven. Gigvora exists to help every organisation collaborate with the best talent—wherever they are based—and to give professionals the tools to thrive as they move between roles, missions, and ventures.
                </p>
                <p>
                  From intelligent matching and compliance automation to wellbeing support, we design the infrastructure that lets companies and independents work together with confidence. When opportunity is more transparent and coordination is effortless, everyone can focus on delivering meaningful outcomes.
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
                  Our platform is engineered for complex organisations that require resilience, accountability, and clarity across every engagement. We operate as a strategic partner, blending product, playbooks, and people to deliver measurable impact.
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
              Our values act as product principles. They shape how we partner with clients, nurture our community, and prioritise initiatives on the roadmap.
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
                  Gigvora brings together marketplace dynamics, community engagement, and operational tooling in one connected experience.
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
                  Beyond software, Gigvora provides embedded teams and knowledge frameworks to accelerate adoption and outcomes.
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
                  Distributed hubs keep us close to talent communities and regulatory nuance. Each location is supported by on-the-ground partners who understand local culture, compliance, and emerging skills.
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
              We grow through partnership with our members, shipping better experiences every quarter and measuring success by the opportunities created.
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
                  The next chapter of Gigvora is about deepening intelligence across the ecosystem—forecasting demand, nurturing communities of practice, and unlocking sustainable income for independents.
                </p>
                <p>
                  We are actively partnering with enterprises, agencies, universities, and civic institutions that share our belief in flexible, inclusive work. If you would like to shape the roadmap or explore collaboration, we would love to hear from you.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 text-sm leading-6 text-slate-700">
                <h3 className="text-lg font-semibold text-slate-900">Stay connected</h3>
                <p className="mt-3">
                  Email <a href="mailto:hello@gigvora.com" className="font-semibold text-accent transition hover:text-accentDark">hello@gigvora.com</a> for partnerships, media, or speaking opportunities. Follow our product updates in the Trust Centre and monthly community briefings.
                </p>
                <p className="mt-3 text-xs text-slate-500">We respond to most enquiries within two working days.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
