import { BuildingOffice2Icon, ShieldCheckIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import MarketingLayout from '../layouts/MarketingLayout.jsx';
import ProductTour from '../components/marketing/ProductTour.jsx';
import PricingTable from '../components/marketing/PricingTable.jsx';

const SOCIAL_PROOF = [
  { label: 'Northshore Creative' },
  { label: 'Atlas Ventures' },
  { label: 'Aurora Health Labs' },
  { label: 'Fathom Robotics' },
];

const TRUST_BADGES = [
  { label: 'SOC 2 Type II', description: 'Continuous monitoring, evidence-backed controls, third-party audits.' },
  { label: 'Regional data zones', description: 'EU, US, and APAC residency with automated retention policies.' },
  { label: 'Incident-ready', description: 'Dedicated trust desk, automated logging, and response rehearsal.' },
];

const HERO_STATS = [
  { label: 'Executive teams onboarded', value: '640+', helper: 'Across venture-backed companies' },
  { label: 'Campaign acceleration', value: '2.8x', helper: 'Faster from idea to market' },
  { label: 'Audience reach', value: '120k+', helper: 'Monthly Explorer professionals' },
];

const MOMENTS = [
  {
    icon: SparklesIcon,
    title: 'Magnetic storytelling',
    description:
      'Pair cinematic hero bands with modular proof points, tailored to each persona in seconds.',
  },
  {
    icon: BuildingOffice2Icon,
    title: 'Revenue + marketing alignment',
    description: 'Real-time pipeline dashboards keep sales, marketing, and executive teams in sync.',
  },
  {
    icon: TrophyIcon,
    title: 'Community activations',
    description: 'Launch curated events, spotlights, and rituals that elevate your brand narrative.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Enterprise-grade trust',
    description: 'Compliance kits, governance rules, and audit-ready histories built-in.',
  },
];

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Launchpad programmes', href: '/experience-launchpad' },
      { label: 'Creator network', href: '/community' },
      { label: 'Marketing funnels', href: '#product-tour' },
      { label: 'Integrations', href: '/apps' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Newsroom', href: '/blog' },
      { label: 'Investors', href: '/investors' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Customer stories', href: '/blog' },
      { label: 'Security center', href: '/security-operations' },
      { label: 'Help desk', href: '/faq' },
      { label: 'Brand assets', href: '/brand' },
    ],
  },
];

const FOOTER_CTA = {
  eyebrow: 'Ready to orchestrate conversions?',
  title: 'Host a growth lab with our strategist collective',
  description:
    'Co-design a funnel blueprint across marketing, content, and revenue teams in a 45-minute virtual workshop tailored to your objectives.',
  primaryAction: { label: 'Secure a workshop', href: '/contact/sales' },
  secondaryAction: { label: 'Download enterprise deck', href: '/assets/gigvora-enterprise.pdf' },
};

export default function MarketingExperiencePage() {
  return (
    <MarketingLayout
      announcement={{
        label: 'New: Conversion intelligence suite',
        caption: 'See how teams cut onboarding time by 42%',
        href: '#product-tour',
      }}
      hero={{
        eyebrow: 'Gigvora Marketing Cloud',
        title: 'Deliver campaigns that feel bespoke at enterprise scale',
        description:
          'From the first hero impression to pricing validation, Gigvora connects every signal so your story lands with the right executives, creators, and partners.',
        primaryAction: { label: 'Book a strategy lab', href: '/contact/sales' },
        secondaryAction: { label: 'Explore case studies', href: '/blog' },
      }}
      stats={HERO_STATS}
      trustBadges={TRUST_BADGES}
      socialProof={SOCIAL_PROOF}
      footerLinks={FOOTER_LINKS}
      footerCta={FOOTER_CTA}
    >
      <section className="grid gap-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.85)] backdrop-blur-xl lg:grid-cols-[minmax(0,_0.7fr)_minmax(0,_1.3fr)]">
        <div className="space-y-4 text-white">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Why teams choose Gigvora
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">A growth OS for operators, storytellers, and talent leaders</h2>
          <p className="text-base text-white/70">
            Marketing, content, and sales teams work from a shared command center. Launch orchestrated product tours, deploy
            persona-specific pricing intelligence, and activate community spotlights without leaving the workspace.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {MOMENTS.map((moment) => (
            <div
              key={moment.title}
              className="flex h-full flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-5 text-white/80 shadow-[0_24px_80px_-50px_rgba(56,189,248,0.6)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                <moment.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-white">{moment.title}</h3>
              <p className="text-sm text-white/70">{moment.description}</p>
            </div>
          ))}
        </div>
      </section>

      <ProductTour
        id="product-tour"
        headline="Guided Experience"
        subheading="Orchestrate, activate, and convert in one flow"
      />

      <section
        id="insights"
        className="grid gap-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-2"
      >
        <div className="space-y-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Insights</p>
          <h2 className="text-3xl font-semibold">Instant narrative intelligence</h2>
          <p className="text-base text-white/70">
            Gigvora connects every click, scroll, and sentiment signal back to your funnel. Real-time intelligence reveals how
            executives progress from awareness to committed champions so you can optimise without guesswork.
          </p>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                ✓
              </span>
              <span>Revenue-grade analytics mapped to each campaign and persona.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                ✓
              </span>
              <span>Automatic content scoring surfaces copy, visuals, and CTAs with the best response.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                ✓
              </span>
              <span>Connected CRM sync keeps deal stages, talent matches, and marketing readiness aligned.</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-6 text-white shadow-[0_30px_90px_-60px_rgba(56,189,248,0.7)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Live cohort spotlight</p>
            <h3 className="mt-3 text-2xl font-semibold">Launchpad pipeline overview</h3>
            <p className="mt-2 text-sm text-white/70">
              Monitor conversion rituals, event RSVPs, and storytelling experiments across every touchpoint.
            </p>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <dt className="text-[11px] uppercase tracking-[0.35em] text-white/60">Momentum score</dt>
              <dd className="mt-1 text-3xl font-semibold text-white">92</dd>
              <dd className="mt-2 text-xs text-white/60">Composite index combining reach, engagement, and readiness.</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <dt className="text-[11px] uppercase tracking-[0.35em] text-white/60">Verified advocates</dt>
              <dd className="mt-1 text-3xl font-semibold text-white">318</dd>
              <dd className="mt-2 text-xs text-white/60">Leaders who shared your narrative in the past 14 days.</dd>
            </div>
          </dl>
        </div>
      </section>

      <PricingTable
        headline="Pricing"
        description="Transparent plans with premium storytelling, analytics, and governance baked in."
      />

      <section className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-10 text-white/80 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-[minmax(0,_0.8fr)_minmax(0,_1.2fr)]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Enterprise services</p>
          <h2 className="text-3xl font-semibold text-white">Done-with-you launch pods</h2>
          <p className="text-base text-white/70">
            Pair your in-house team with Gigvora strategists across copy, design, analytics, and community to orchestrate your
            next big chapter.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex h-full flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-5 text-white/80 shadow-[0_24px_70px_-55px_rgba(76,201,240,0.6)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Sprint {index}</p>
              <h3 className="text-lg font-semibold text-white">
                {index === 1 && 'Narrative alignment workshop'}
                {index === 2 && 'Channel & audience choreography'}
                {index === 3 && 'Conversion experiment toolkit'}
                {index === 4 && 'Executive enablement & rollout'}
              </h3>
              <p className="text-sm text-white/70">
                {index === 1 && 'Map buyer journeys, proof points, and emotional arcs with leadership alignment.'}
                {index === 2 && 'Coordinate paid, earned, and community touchpoints with predictive targeting.'}
                {index === 3 && 'Deploy A/B libraries, AI-assisted creative, and rapid analytics reviews.'}
                {index === 4 && 'Equip teams with scripts, assets, and analytics rituals for go-live success.'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
