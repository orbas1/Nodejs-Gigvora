import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import {
  fetchFreelancerDashboard,
  createFreelancerGig,
  updateFreelancerGig,
  publishFreelancerGig,
} from '../../services/freelancer.js';

const FREELANCER_ID = 1;
const availableDashboards = ['freelancer', 'user', 'agency'];

const FALLBACK_MENU = [
  {
    label: 'Gig publishing',
    items: [
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, calendars, and banners.',
        href: '#gig-publisher',
      },
      {
        name: 'Pricing matrix',
        description: 'Design compelling tiered packages with highlights and delivery windows.',
        href: '#pricing-matrix',
      },
      {
        name: 'Availability calendar',
        description: 'Control your booking windows and readiness buffer in one place.',
        href: '#availability-calendar',
      },
      {
        name: 'Marketing banner',
        description: 'Craft a premium hero banner and headline for conversions.',
        href: '#marketing-banner',
      },
    ],
  },
];

const FALLBACK_BLUEPRINT = {
  title: 'Brand Identity Accelerator',
  tagline: 'Launch-ready visual systems in ten days',
  category: 'Branding & Identity',
  niche: 'Venture-backed startups',
  deliveryModel: 'Hybrid sprint with async reviews',
  outcomePromise: 'Investor-ready identity kit, launch assets, and usage playbook.',
  heroAccent: '#4f46e5',
  targetMetric: 12,
  status: 'draft',
  visibility: 'private',
  packages: [
    {
      key: 'starter',
      name: 'Launch Lite',
      priceAmount: 450,
      priceCurrency: 'USD',
      deliveryDays: 5,
      revisionLimit: 1,
      highlights: ['Discovery workshop', 'Two identity concepts', 'Primary logo lockup'],
      recommendedFor: 'First-time founders preparing for launch',
      isPopular: false,
    },
    {
      key: 'growth',
      name: 'Growth Lab',
      priceAmount: 780,
      priceCurrency: 'USD',
      deliveryDays: 8,
      revisionLimit: 2,
      highlights: ['Logo suite & icon set', 'Color & typography system', 'Brand voice guardrails'],
      recommendedFor: 'Seed to Series A teams needing polish',
      isPopular: true,
    },
    {
      key: 'elite',
      name: 'Elite Experience',
      priceAmount: 1280,
      priceCurrency: 'USD',
      deliveryDays: 12,
      revisionLimit: 3,
      highlights: ['Brand guidelines', 'Social & deck templates', 'Motion starter kit'],
      recommendedFor: 'Scale-ups and venture studios',
      isPopular: false,
    },
  ],
  addOns: [
    {
      key: 'social-kit',
      name: 'Social story kit',
      priceAmount: 220,
      priceCurrency: 'USD',
      description: 'Ten editable launch templates for Instagram, LinkedIn, and TikTok.',
      isActive: true,
    },
    {
      key: 'landing-page',
      name: 'Landing page handoff',
      priceAmount: 320,
      priceCurrency: 'USD',
      description: 'Hero, pricing, and product sections prepped for Webflow or Framer.',
      isActive: true,
    },
  ],
  availability: {
    timezone: 'America/New_York',
    leadTimeDays: 2,
    slots: [],
  },
  banner: {
    headline: 'Standout branding in 10 days',
    subheadline: 'Signature identities for venture-backed founders',
    callToAction: 'Book discovery call',
    badge: 'Gigvora Elite',
    accentColor: '#4f46e5',
    backgroundStyle: 'aurora',
    testimonial: '“Riley helped us close our seed round with a pitch-perfect identity.”',
    testimonialAuthor: 'Nova Chen, Lumen Labs',
    waitlistEnabled: true,
  },
};

const TIMEZONE_OPTIONS = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore'];
const BACKGROUND_STYLES = [
  { value: 'aurora', label: 'Aurora gradient' },
  { value: 'pulse', label: 'Pulse spotlight' },
  { value: 'grid', label: 'Blueprint grid' },
];

function formatCurrency(amount, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) {
    return `${currency} 0`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function buildBannerBackground(style, color) {
  if (style === 'pulse') {
    return `radial-gradient(circle at top left, ${color}, rgba(79,70,229,0.15)), radial-gradient(circle at bottom right, rgba(59,130,246,0.35), rgba(59,130,246,0))`;
  }
  if (style === 'grid') {
    return `linear-gradient(135deg, ${color}, rgba(79,70,229,0.4)), repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 28px)`;
  }
  return `linear-gradient(135deg, ${color}, rgba(30,64,175,0.6))`;
}
function convertGigToForm(gig, defaults = FALLBACK_BLUEPRINT) {
  const base = gig ?? {};
  const blueprint = gig ? gig : defaults;
  const availabilitySlots = Array.isArray(base.availabilitySlots) ? base.availabilitySlots : [];

  return {
    id: base.id ?? null,
    title: base.title ?? blueprint.title ?? '',
    tagline: base.tagline ?? blueprint.tagline ?? '',
    category: base.category ?? blueprint.category ?? '',
    niche: base.niche ?? blueprint.niche ?? '',
    deliveryModel: base.deliveryModel ?? blueprint.deliveryModel ?? '',
    outcomePromise: base.outcomePromise ?? blueprint.outcomePromise ?? '',
    heroAccent: base.heroAccent ?? blueprint.heroAccent ?? '#4f46e5',
    targetMetric: base.targetMetric ?? blueprint.targetMetric ?? null,
    status: base.status ?? blueprint.status ?? 'draft',
    visibility: base.visibility ?? blueprint.visibility ?? 'private',
    packages: (Array.isArray(base.packages) && base.packages.length ? base.packages : blueprint.packages).map(
      (pkg, index) => ({
        key: pkg.key ?? pkg.packageKey ?? `package-${index + 1}`,
        name: pkg.name ?? '',
        priceAmount: pkg.priceAmount ?? 0,
        priceCurrency: pkg.priceCurrency ?? 'USD',
        deliveryDays: pkg.deliveryDays ?? 0,
        revisionLimit: pkg.revisionLimit ?? 0,
        highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
        recommendedFor: pkg.recommendedFor ?? '',
        description: pkg.description ?? '',
        isPopular: pkg.isPopular ?? false,
      }),
    ),
    addOns: (Array.isArray(base.addOns) && base.addOns.length ? base.addOns : blueprint.addOns).map((addon, index) => ({
      key: addon.key ?? addon.addOnKey ?? `addon-${index + 1}`,
      name: addon.name ?? '',
      priceAmount: addon.priceAmount ?? 0,
      priceCurrency: addon.priceCurrency ?? 'USD',
      description: addon.description ?? '',
      isActive: addon.isActive !== false,
    })),
    availability: {
      timezone: base.availabilityTimezone ?? blueprint.availability.timezone,
      leadTimeDays: base.availabilityLeadTimeDays ?? blueprint.availability.leadTimeDays,
      slots: availabilitySlots.map((slot, index) => ({
        id: slot.id ?? `${slot.date}-${slot.startTime}-${index}`,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity ?? 1,
        isBookable: slot.isBookable !== false,
        notes: slot.notes ?? '',
      })),
    },
    banner: {
      headline: base.bannerSettings?.headline ?? blueprint.banner.headline ?? '',
      subheadline: base.bannerSettings?.subheadline ?? blueprint.banner.subheadline ?? '',
      callToAction: base.bannerSettings?.callToAction ?? blueprint.banner.callToAction ?? '',
      badge: base.bannerSettings?.badge ?? blueprint.banner.badge ?? '',
      accentColor: base.bannerSettings?.accentColor ?? blueprint.banner.accentColor ?? '#4f46e5',
      backgroundStyle: base.bannerSettings?.backgroundStyle ?? blueprint.banner.backgroundStyle ?? 'aurora',
      testimonial: base.bannerSettings?.testimonial ?? blueprint.banner.testimonial ?? '',
      testimonialAuthor: base.bannerSettings?.testimonialAuthor ?? blueprint.banner.testimonialAuthor ?? '',
      waitlistEnabled: base.bannerSettings?.waitlistEnabled ?? blueprint.banner.waitlistEnabled ?? true,
    },
  };
}

function buildPayloadFromForm(form) {
  return {
    actorId: FREELANCER_ID,
    ownerId: FREELANCER_ID,
    title: form.title,
    tagline: form.tagline,
    category: form.category,
    niche: form.niche,
    deliveryModel: form.deliveryModel,
    outcomePromise: form.outcomePromise,
    heroAccent: form.heroAccent,
    targetMetric: form.targetMetric,
    status: form.status,
    visibility: form.visibility,
    packages: form.packages.map((pkg, index) => ({
      key: pkg.key || `package-${index + 1}`,
      name: pkg.name,
      priceAmount: Number(pkg.priceAmount ?? 0),
      priceCurrency: pkg.priceCurrency || 'USD',
      deliveryDays: pkg.deliveryDays == null ? null : Number(pkg.deliveryDays),
      revisionLimit: pkg.revisionLimit == null ? null : Number(pkg.revisionLimit),
      highlights: Array.isArray(pkg.highlights) ? pkg.highlights : [],
      recommendedFor: pkg.recommendedFor,
      description: pkg.description,
      isPopular: Boolean(pkg.isPopular),
    })),
    addOns: form.addOns.map((addon, index) => ({
      key: addon.key || `addon-${index + 1}`,
      name: addon.name,
      priceAmount: Number(addon.priceAmount ?? 0),
      priceCurrency: addon.priceCurrency || 'USD',
      description: addon.description,
      isActive: Boolean(addon.isActive),
    })),
    availability: {
      timezone: form.availability.timezone,
      leadTimeDays: Number(form.availability.leadTimeDays ?? 2),
      slots: form.availability.slots.map((slot) => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: Number(slot.capacity ?? 1),
        isBookable: Boolean(slot.isBookable),
        notes: slot.notes ?? undefined,
      })),
    },
    banner: {
      ...form.banner,
    },
  };
}

function createNewPackage(index) {
  return {
    key: `new-package-${index + 1}`,
    name: '',
    priceAmount: 0,
    priceCurrency: 'USD',
    deliveryDays: 7,
    revisionLimit: 1,
    highlights: [],
    recommendedFor: '',
    description: '',
    isPopular: false,
  };
}

function createNewAddOn(index) {
  return {
    key: `new-addon-${index + 1}`,
    name: '',
    priceAmount: 0,
    priceCurrency: 'USD',
    description: '',
    isActive: true,
  };
}

function createNewSlot(index) {
  const date = new Date();
  date.setDate(date.getDate() + index + 1);
  const iso = date.toISOString().split('T')[0];
  return {
    id: `slot-${iso}-${index}`,
    date: iso,
    startTime: '09:00',
    endTime: '10:30',
    capacity: 1,
    isBookable: true,
    notes: '',
  };
}

function GigReadinessCard({ health, metrics }) {
  const readiness = health?.readinessScore ?? 0;
  const missing = Array.isArray(health?.missing) ? health.missing : [];
  const publishedCount = metrics?.publishedCount ?? 0;
  const totalGigs = metrics?.totalGigs ?? 0;
  const nextAvailability = metrics?.nextAvailability ?? null;

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Launch readiness</p>
          <p className="mt-2 text-3xl font-semibold text-blue-900">{readiness}% ready</p>
        </div>
        <SparklesIcon className="h-10 w-10 text-blue-400" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Published gigs</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Total gigs</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">{totalGigs}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-500">Next availability</p>
          <p className="mt-2 text-lg font-semibold text-blue-900">
            {nextAvailability ? `${nextAvailability.date} · ${nextAvailability.startTime}` : 'Schedule slots'}
          </p>
        </div>
      </div>
      {missing.length ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Next actions</p>
          <ul className="space-y-2">
            {missing.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-blue-900">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GigPreview({ form }) {
  const banner = form.banner;
  const background = buildBannerBackground(banner.backgroundStyle, banner.accentColor || '#4f46e5');
  const primaryPackage = form.packages?.[1] ?? form.packages?.[0];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <div className="absolute inset-0" style={{ background }} aria-hidden="true" />
      <div className="relative z-10 p-8 text-white">
        {banner.badge ? (
          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            {banner.badge}
          </span>
        ) : null}
        <h3 className="mt-4 text-3xl font-semibold leading-tight">{banner.headline || form.title}</h3>
        <p className="mt-3 max-w-xl text-sm text-white/90">{banner.subheadline || form.tagline}</p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/20 px-5 py-2 text-sm font-medium">
          <CalendarDaysIcon className="h-5 w-5" />
          <span>Lead time: {form.availability.leadTimeDays} days</span>
        </div>
        {primaryPackage ? (
          <div className="mt-8 rounded-3xl bg-white/15 p-6">
            <p className="text-xs uppercase tracking-wide text-white/70">Popular package</p>
            <p className="mt-2 text-2xl font-semibold">{primaryPackage.name}</p>
            <p className="mt-1 text-sm text-white/80">{primaryPackage.recommendedFor}</p>
            <p className="mt-4 text-3xl font-semibold">
              {formatCurrency(primaryPackage.priceAmount, primaryPackage.priceCurrency)}
            </p>
          </div>
        ) : null}
        {banner.callToAction ? (
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            {banner.callToAction}
          </button>
        ) : null}
        {banner.testimonial ? (
          <blockquote className="mt-10 rounded-3xl border border-white/20 bg-white/10 p-5 text-sm italic text-white/80">
            <p>{banner.testimonial}</p>
            {banner.testimonialAuthor ? (
              <cite className="mt-3 block text-xs font-semibold not-italic text-white/70">
                {banner.testimonialAuthor}
              </cite>
            ) : null}
          </blockquote>
        ) : null}
      </div>
    </div>
  );
}
function GigOverviewSection({ form, onFieldChange, health, metrics }) {
  return (
    <section id="gig-publisher" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Gig overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Position your signature service with a compelling promise and delivery model.
          </p>
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col text-xs font-medium text-slate-500">
            Status
            <select
              value={form.status}
              onChange={(event) => onFieldChange('status', event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex flex-col text-xs font-medium text-slate-500">
            Visibility
            <select
              value={form.visibility}
              onChange={(event) => onFieldChange('visibility', event.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Gig title</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Name your signature offer"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tagline</span>
            <input
              type="text"
              value={form.tagline}
              onChange={(event) => onFieldChange('tagline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Promise outcomes and positioning"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Service category</span>
              <input
                type="text"
                value={form.category}
                onChange={(event) => onFieldChange('category', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Branding & Identity"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Niche focus</span>
              <input
                type="text"
                value={form.niche}
                onChange={(event) => onFieldChange('niche', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Venture-backed startups"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Delivery model</span>
            <input
              type="text"
              value={form.deliveryModel}
              onChange={(event) => onFieldChange('deliveryModel', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Hybrid sprint with async reviews"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Outcome promise</span>
            <textarea
              value={form.outcomePromise}
              onChange={(event) => onFieldChange('outcomePromise', event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Summarise deliverables and transformation"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">North star metric (days to deliver)</span>
              <input
                type="number"
                min="0"
                value={form.targetMetric ?? ''}
                onChange={(event) => onFieldChange('targetMetric', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Accent colour</span>
              <input
                type="color"
                value={form.heroAccent}
                onChange={(event) => onFieldChange('heroAccent', event.target.value)}
                className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
              />
            </label>
          </div>
        </div>
        <GigReadinessCard health={health} metrics={metrics} />
      </div>
    </section>
  );
}
function PricingMatrixSection({ packages, onChange, onAdd, onRemove }) {
  return (
    <section id="pricing-matrix" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pricing matrix</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define tiered packages with pricing, delivery timelines, and value signals.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add package
        </button>
      </div>

      <div className="mt-6 grid gap-6">
        {packages.map((pkg, index) => (
          <div key={pkg.key || index} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-inner">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Package name</span>
                  <input
                    type="text"
                    value={pkg.name}
                    onChange={(event) => onChange(index, 'name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Growth Lab"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <input
                    type="checkbox"
                    checked={pkg.isPopular}
                    onChange={(event) => onChange(index, 'isPopular', event.target.checked)}
                    className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                  />
                  Featured package
                </label>
                {packages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove package"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.priceAmount}
                  onChange={(event) => onChange(index, 'priceAmount', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                <input
                  type="text"
                  value={pkg.priceCurrency}
                  onChange={(event) => onChange(index, 'priceCurrency', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  maxLength={3}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery days</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.deliveryDays ?? ''}
                  onChange={(event) => onChange(index, 'deliveryDays', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revision limit</span>
                <input
                  type="number"
                  min="0"
                  value={pkg.revisionLimit ?? ''}
                  onChange={(event) => onChange(index, 'revisionLimit', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</span>
                <textarea
                  value={pkg.highlights.join('\n')}
                  onChange={(event) => onChange(index, 'highlights', event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="List the deliverables as bullet points"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ideal for</span>
                <textarea
                  value={pkg.recommendedFor}
                  onChange={(event) => onChange(index, 'recommendedFor', event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Describe who benefits the most"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function AvailabilitySection({ availability, onAvailabilityChange, onSlotChange, onAddSlot, onRemoveSlot }) {
  return (
    <section id="availability-calendar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Availability calendar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage bookable discovery calls and maintain your lead time buffer.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSlot}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add time slot
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</span>
          <select
            value={availability.timezone}
            onChange={(event) => onAvailabilityChange({ timezone: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead time (days)</span>
          <input
            type="number"
            min="0"
            value={availability.leadTimeDays}
            onChange={(event) => onAvailabilityChange({ leadTimeDays: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
          <p className="font-medium">Smart booking tips</p>
          <p className="mt-2 text-xs">Maintain at least four open slots per week to appear in fast-response filters.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {availability.slots.length ? (
          availability.slots.map((slot, index) => (
            <div
              key={slot.id || `${slot.date}-${slot.startTime}`}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-inner sm:flex-row sm:items-end"
            >
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
                <input
                  type="date"
                  value={slot.date}
                  onChange={(event) => onSlotChange(index, 'date', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start time
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(event) => onSlotChange(index, 'startTime', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                End time
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(event) => onSlotChange(index, 'endTime', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Capacity
                <input
                  type="number"
                  min="1"
                  value={slot.capacity}
                  onChange={(event) => onSlotChange(index, 'capacity', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={slot.isBookable}
                  onChange={(event) => onSlotChange(index, 'isBookable', event.target.checked)}
                  className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                />
                Bookable
              </label>
              <button
                type="button"
                onClick={() => onRemoveSlot(index)}
                className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove slot"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No availability windows yet. Add time slots to open bookings.
          </div>
        )}
      </div>
    </section>
  );
}
function AddOnsSection({ addOns, onChange, onAdd, onRemove }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Add-ons</h2>
          <p className="mt-1 text-sm text-slate-500">Upsell complementary services to boost engagement.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add add-on
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {addOns.length ? (
          addOns.map((addon, index) => (
            <div key={addon.key || index} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-inner">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Add-on name</span>
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(event) => onChange(index, 'name', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <input
                    type="checkbox"
                    checked={addon.isActive}
                    onChange={(event) => onChange(index, 'isActive', event.target.checked)}
                    className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove add-on"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</span>
                  <input
                    type="number"
                    min="0"
                    value={addon.priceAmount}
                    onChange={(event) => onChange(index, 'priceAmount', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                  <input
                    type="text"
                    value={addon.priceCurrency}
                    onChange={(event) => onChange(index, 'priceCurrency', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    maxLength={3}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                  <textarea
                    value={addon.description}
                    onChange={(event) => onChange(index, 'description', event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No add-ons configured yet. Create one to increase booking value.
          </div>
        )}
      </div>
    </section>
  );
}
function BannerSection({ form, onBannerChange }) {
  return (
    <section id="marketing-banner" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Marketing banner</h2>
            <p className="mt-1 text-sm text-slate-500">Craft a hero banner with a compelling headline, CTA, and social proof.</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Headline</span>
            <input
              type="text"
              value={form.banner.headline}
              onChange={(event) => onBannerChange('headline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Subheadline</span>
            <input
              type="text"
              value={form.banner.subheadline}
              onChange={(event) => onBannerChange('subheadline', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Call to action</span>
              <input
                type="text"
                value={form.banner.callToAction}
                onChange={(event) => onBannerChange('callToAction', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Badge</span>
              <input
                type="text"
                value={form.banner.badge}
                onChange={(event) => onBannerChange('badge', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Accent colour</span>
              <input
                type="color"
                value={form.banner.accentColor}
                onChange={(event) => onBannerChange('accentColor', event.target.value)}
                className="mt-2 h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Background style</span>
              <select
                value={form.banner.backgroundStyle}
                onChange={(event) => onBannerChange('backgroundStyle', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {BACKGROUND_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Testimonial</span>
            <textarea
              value={form.banner.testimonial}
              onChange={(event) => onBannerChange('testimonial', event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Testimonial author</span>
            <input
              type="text"
              value={form.banner.testimonialAuthor}
              onChange={(event) => onBannerChange('testimonialAuthor', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.banner.waitlistEnabled}
              onChange={(event) => onBannerChange('waitlistEnabled', event.target.checked)}
              className="h-4 w-4 rounded border border-blue-300 text-blue-600 focus:ring-blue-400"
            />
            Enable waitlist capture
          </label>
        </div>
        <GigPreview form={form} />
      </div>
    </section>
  );
}
export default function FreelancerDashboardPage() {
  const [form, setForm] = useState(() => convertGigToForm(null, FALLBACK_BLUEPRINT));
  const [formDirty, setFormDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(null);

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `dashboard:freelancer:${FREELANCER_ID}`,
    ({ signal }) => fetchFreelancerDashboard({ freelancerId: FREELANCER_ID }, { signal }),
    { ttl: 1000 * 60 },
  );

  const gigComposer = data?.gigComposer ?? null;
  const defaults = useMemo(() => gigComposer?.defaults ?? FALLBACK_BLUEPRINT, [gigComposer?.defaults]);
  const activeGig = gigComposer?.activeGig ?? null;
  const menuSections = data?.menuSections ?? FALLBACK_MENU;
  const profile = data?.profile ?? {
    name: 'Freelancer',
    role: 'Independent specialist',
    initials: 'FR',
    status: 'Availability: limited',
    badges: ['Marketplace ready'],
    metrics: [],
  };

  useEffect(() => {
    setForm(convertGigToForm(activeGig, defaults));
    setFormDirty(false);
  }, [activeGig?.id, defaults]);

  const handleFieldChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormDirty(true);
  }, []);

  const handlePackageChange = useCallback((index, field, value) => {
    setForm((current) => {
      const nextPackages = current.packages.map((pkg, pkgIndex) =>
        pkgIndex === index
          ? {
              ...pkg,
              [field]: field === 'highlights'
                ? value
                : field === 'isPopular'
                ? Boolean(value)
                : value,
            }
          : pkg,
      );
      return { ...current, packages: nextPackages };
    });
    setFormDirty(true);
  }, []);

  const handleAddPackage = useCallback(() => {
    setForm((current) => ({ ...current, packages: [...current.packages, createNewPackage(current.packages.length)] }));
    setFormDirty(true);
  }, []);

  const handleRemovePackage = useCallback((index) => {
    setForm((current) => ({ ...current, packages: current.packages.filter((_, pkgIndex) => pkgIndex !== index) }));
    setFormDirty(true);
  }, []);

  const handleAddOnChange = useCallback((index, field, value) => {
    setForm((current) => {
      const nextAddOns = current.addOns.map((addon, addonIndex) =>
        addonIndex === index
          ? {
              ...addon,
              [field]: field === 'isActive' ? Boolean(value) : value,
            }
          : addon,
      );
      return { ...current, addOns: nextAddOns };
    });
    setFormDirty(true);
  }, []);

  const handleAddAddOn = useCallback(() => {
    setForm((current) => ({ ...current, addOns: [...current.addOns, createNewAddOn(current.addOns.length)] }));
    setFormDirty(true);
  }, []);

  const handleRemoveAddOn = useCallback((index) => {
    setForm((current) => ({ ...current, addOns: current.addOns.filter((_, addonIndex) => addonIndex !== index) }));
    setFormDirty(true);
  }, []);

  const handleAvailabilityChange = useCallback((changes) => {
    setForm((current) => ({ ...current, availability: { ...current.availability, ...changes } }));
    setFormDirty(true);
  }, []);

  const handleSlotChange = useCallback((index, field, value) => {
    setForm((current) => {
      const slots = current.availability.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: field === 'isBookable' ? Boolean(value) : value } : slot,
      );
      return { ...current, availability: { ...current.availability, slots } };
    });
    setFormDirty(true);
  }, []);

  const handleAddSlot = useCallback(() => {
    setForm((current) => ({
      ...current,
      availability: {
        ...current.availability,
        slots: [...current.availability.slots, createNewSlot(current.availability.slots.length)],
      },
    }));
    setFormDirty(true);
  }, []);

  const handleRemoveSlot = useCallback((index) => {
    setForm((current) => ({
      ...current,
      availability: {
        ...current.availability,
        slots: current.availability.slots.filter((_, slotIndex) => slotIndex !== index),
      },
    }));
    setFormDirty(true);
  }, []);

  const handleBannerChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, banner: { ...current.banner, [field]: value } }));
    setFormDirty(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    let savedGig = null;
    try {
      setSaveState('saving');
      setStatusMessage(null);
      const payload = buildPayloadFromForm(form);
      savedGig = form.id
        ? await updateFreelancerGig(form.id, payload)
        : await createFreelancerGig(payload);
      setForm(convertGigToForm(savedGig, defaults));
      setFormDirty(false);
      setStatusMessage({ type: 'success', text: 'Draft saved successfully.' });
      await refresh();
    } catch (saveError) {
      setStatusMessage({ type: 'error', text: saveError.message || 'Failed to save draft.' });
      savedGig = null;
    } finally {
      setSaveState('idle');
    }

    return savedGig;
  }, [defaults, form, refresh]);

  const handlePublish = useCallback(async () => {
    let draftGig = form;
    if (!form.id || formDirty) {
      draftGig = await handleSaveDraft();
    }
    try {
      setSaveState('publishing');
      setStatusMessage(null);
      const gigId = draftGig?.id ?? null;
      if (!gigId) {
        throw new Error('Unable to determine gig identifier. Save the draft before publishing.');
      }
      const result = await publishFreelancerGig(gigId, {
        actorId: FREELANCER_ID,
        visibility: form.visibility === 'private' ? 'public' : form.visibility,
      });
      setForm(convertGigToForm(result, defaults));
      setFormDirty(false);
      setStatusMessage({ type: 'success', text: 'Gig published to the marketplace.' });
      await refresh();
    } catch (publishError) {
      setStatusMessage({ type: 'error', text: publishError.message || 'Failed to publish gig.' });
    } finally {
      setSaveState('idle');
    }
    }, [defaults, form, formDirty, handleSaveDraft, refresh]);

  const heroTitle = 'Freelancer Launch Workspace';
  const heroSubtitle = 'Post a marketplace-ready gig';
  const heroDescription =
    'Compose tiered pricing, add-on services, availability calendars, and marketing banners to launch a premium Gigvora gig.';

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            error={error?.message}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRetry={refresh}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveState !== 'idle'}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className={`h-4 w-4 ${saveState === 'saving' ? 'animate-spin' : ''}`} />
              {saveState === 'saving' ? 'Saving…' : formDirty ? 'Save draft' : 'Saved'}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={saveState !== 'idle'}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <SparklesIcon className={`h-4 w-4 ${saveState === 'publishing' ? 'animate-pulse' : ''}`} />
              {saveState === 'publishing' ? 'Publishing…' : 'Publish gig'}
            </button>
          </div>
        </div>

        {statusMessage ? (
          <div
            className={`rounded-3xl border p-4 text-sm ${
              statusMessage.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {statusMessage.text}
          </div>
        ) : null}

        <GigOverviewSection form={form} onFieldChange={handleFieldChange} health={gigComposer?.health} metrics={gigComposer?.metrics} />
        <PricingMatrixSection packages={form.packages} onChange={handlePackageChange} onAdd={handleAddPackage} onRemove={handleRemovePackage} />
        <AvailabilitySection
          availability={form.availability}
          onAvailabilityChange={handleAvailabilityChange}
          onSlotChange={handleSlotChange}
          onAddSlot={handleAddSlot}
          onRemoveSlot={handleRemoveSlot}
        />
        <BannerSection form={form} onBannerChange={handleBannerChange} />
        <AddOnsSection addOns={form.addOns} onChange={handleAddOnChange} onAdd={handleAddAddOn} onRemove={handleRemoveAddOn} />
      </div>
    </DashboardLayout>
  );
}
