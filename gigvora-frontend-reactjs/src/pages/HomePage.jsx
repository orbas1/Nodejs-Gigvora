import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SquaresPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import useSession from '../hooks/useSession.js';

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

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();

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
                Build momentum with people who deliver.
              </h1>
              <p className="text-lg text-slate-600 sm:text-xl">
                Gigvora unites clients, teams, and independent talent inside one calm workspace so every initiative moves forward with confidence.
              </p>
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
