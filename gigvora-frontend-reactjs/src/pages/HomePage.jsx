import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SquaresPlusIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  CpuChipIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import DataStatus from '../components/DataStatus.jsx';

const featureHighlights = [
  {
    title: 'Unified workspace',
    description: 'Brief, onboard, and collaborate with talent in one organised hub.',
    icon: SquaresPlusIcon,
  },
  {
    title: 'Curated experts',
    description: 'Match with verified specialists who join projects within hours, not weeks.',
    icon: SparklesIcon,
  },
  {
    title: 'Operational peace',
    description: 'Automate contracts, compliance, and global payouts with enterprise-grade controls.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Live intelligence',
    description: 'Visual dashboards spotlight progress, risks, and upcoming decisions in real time.',
    icon: PresentationChartBarIcon,
  },
];

const communitySpotlights = [
  {
    title: 'Atlas Labs partnership',
    category: 'Product launch',
    description: 'Coordinated a cross-functional squad to deliver a new onboarding journey ahead of schedule.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Nova Collective showcase',
    category: 'Community experience',
    description: 'Activated hybrid programming that welcomed over 4,000 members across three regions.',
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Forma Studio expansion',
    category: 'Global delivery',
    description: 'Scaled design, research, and client success pods to support enterprise wins worldwide.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  },
];

const testimonials = [
  {
    quote:
      'Gigvora gave us a professional community that feels bespoke—every contributor arrived ready, every milestone was tracked, and our stakeholders finally have clarity.',
    name: 'Morgan Wells',
    role: 'VP People, Northwind Digital',
    highlight: 'Scaled 7 markets without adding ops headcount.',
  },
  {
    quote:
      'We replaced scattered contractors with a dedicated Gigvora crew. The quality is exceptional and the admin load disappeared overnight.',
    name: 'Ivy Chen',
    role: 'Founder, Forma Studio',
    highlight: 'Closed enterprise deals with on-demand specialists.',
  },
];

const creationStudioHighlights = [
  {
    title: 'Guided publishing wizards',
    description: 'Launch CVs, cover letters, gigs, projects, and volunteering missions in minutes with guardrails.',
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: 'Automations that scale',
    description: 'Autosave, compliance scoring, and asset versioning run behind the scenes for every workflow.',
    icon: CpuChipIcon,
  },
  {
    title: 'Collaborative reviews',
    description: 'Invite team reviewers and mentors with tracked suggestions, approvals, and publishing controls.',
    icon: UserGroupIcon,
  },
];

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();
  const { data: homeData, loading: homeLoading, error: homeError, refresh, fromCache, lastUpdated } =
    useHomeExperience({ enabled: !isAuthenticated });

  const heroHeadline = homeData?.settings?.heroHeadline ?? 'Build momentum with people who deliver.';
  const heroSubheading =
    homeData?.settings?.heroSubheading ??
    'Gigvora unites clients, teams, and independent talent inside one calm workspace so every initiative moves forward with confidence.';

  const communityStats = useMemo(() => {
    if (!Array.isArray(homeData?.settings?.communityStats) || !homeData.settings.communityStats.length) {
      return [
        { label: 'Global specialists', value: '12,400+' },
        { label: 'Average NPS', value: '68' },
        { label: 'Completion rate', value: '97%' },
      ];
    }
    return homeData.settings.communityStats.map((stat) => ({
      label: stat.label ?? stat.name ?? 'Community stat',
      value: stat.value ?? stat.metric ?? '—',
    }));
  }, [homeData?.settings?.communityStats]);

  const trendingCreations = useMemo(
    () =>
      (Array.isArray(homeData?.creations) ? homeData.creations : [])
        .filter((item) => item?.title && item?.type)
        .slice(0, 6),
    [homeData?.creations],
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:flex lg:items-center lg:gap-16">
          <div className="max-w-2xl space-y-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Professional community
            </span>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {heroHeadline}
              </h1>
              <p className="text-lg text-slate-600 sm:text-xl">{heroSubheading}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 text-base font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
              >
                Create your free account
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                How it works
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="mt-16 w-full max-w-md lg:mt-0">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-1 shadow-xl">
              <div className="space-y-6 rounded-[1.85rem] bg-white p-8 text-slate-900">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Weekly snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Community health report</h2>
                  <p className="mt-3 text-sm text-slate-500">
                    Key insights from the latest portfolio of engagements across product, marketing, and operations.
                  </p>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Community concierge</p>
                      <p className="text-xs text-slate-500">Dedicated partner for hiring, onboarding, and retention.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Signals you can trust</p>
                      <p className="text-xs text-slate-500">Every update ties back to documented deliverables.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <DataStatus
            loading={homeLoading}
            error={homeError}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh().catch(() => {})}
            statusLabel={isAuthenticated ? 'Redirecting to live experience' : 'Live community snapshot'}
          />
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Everything your professional community needs</h2>
            <p className="mt-4 text-base text-slate-600">
              A single platform where relationships thrive, work stays visible, and trust scales with your ambitions.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((feature) => (
              <article
                key={feature.title}
                className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <feature.icon className="h-8 w-8 text-accent" aria-hidden="true" />
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Community moments we&apos;re proud of</h2>
            <p className="mt-4 text-base text-slate-600">Real programmes crafted by members who value thoughtful delivery.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {communitySpotlights.map((spotlight) => (
              <figure key={spotlight.title} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                <img src={spotlight.image} alt={spotlight.title} className="h-56 w-full object-cover" />
                <figcaption className="space-y-2 p-6 text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{spotlight.category}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{spotlight.title}</h3>
                  <p className="text-sm text-slate-600">{spotlight.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Trusted by leaders and makers</h2>
            <p className="mt-4 text-base text-slate-600">Short, thoughtful feedback from teams using Gigvora every day.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-slate-50 p-8 text-left shadow-sm"
              >
                <p className="text-lg font-medium leading-relaxed text-slate-700">“{testimonial.quote}”</p>
                <div className="mt-6 space-y-2 text-sm text-slate-600">
                  <p className="text-base font-semibold text-slate-900">{testimonial.name}</p>
                  <p>{testimonial.role}</p>
                  <p className="text-slate-500">{testimonial.highlight}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl space-y-3">
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Live marketplace launches</h2>
              <p className="text-base text-slate-600">
                New gigs, projects, volunteering missions, and mentorship offers are published every hour. Explore a curated
                snapshot and jump straight into opportunities that match your goals.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {communityStats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[10rem] flex-1 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 text-left shadow-sm"
                >
                  <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {trendingCreations.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
                Stay tuned—new opportunities are being prepared in the Creation Studio right now.
              </div>
            )}
            {trendingCreations.map((item) => (
              <article key={item.id ?? item.slug ?? item.title} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {item.type}
                  </span>
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.summary ?? item.description ?? 'Explore the full brief inside the Creation Studio.'}</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.ownerName ?? item.authorName ?? 'Gigvora member'}</span>
                  {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleDateString()}</span> : null}
                </div>
                <Link
                  to={item.deepLink ?? `/creation-studio?item=${encodeURIComponent(item.id ?? '')}`}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Review opportunity
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24">
        <div className="mx-auto max-w-6xl px-6 text-white">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                Creation Studio
              </span>
              <h2 className="text-3xl font-semibold sm:text-4xl">Ship opportunities with production-ready wizards</h2>
              <p className="text-base text-white/80">
                From CVs and cover letters to gigs, projects, and volunteering drives, our studio keeps every launch compliant, collaborative, and on schedule.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/creation-studio"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
                >
                  Explore the studio
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/feed"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
                >
                  See live launches
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {creationStudioHighlights.map((highlight) => (
                <article key={highlight.title} className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.35)]">
                  <highlight.icon className="h-8 w-8 text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-white">{highlight.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{highlight.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-accent to-accentDark" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl rounded-[2.5rem] bg-white/10 px-8 py-16 text-center text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur">
          <h2 className="text-3xl font-semibold sm:text-4xl">Ready to join the professional community?</h2>
          <p className="mt-4 text-base text-white/85">
            Start in minutes. Bring your team, invite trusted partners, and discover specialists ready to work alongside you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-accent transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              Claim your seat
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-8 py-3 text-base font-semibold text-white/90 transition hover:border-white hover:text-white"
            >
              Explore insights
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
