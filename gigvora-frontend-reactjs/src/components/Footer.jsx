import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BoltIcon, ShieldCheckIcon, SignalIcon } from '@heroicons/react/24/outline';
import { LOGO_URL } from '../constants/branding.js';
import { useNavigationChrome } from '../context/NavigationChromeContext.jsx';
import DataStatus from './DataStatus.jsx';

const STATUS_ICON_MAP = {
  signal: SignalIcon,
  bolt: BoltIcon,
  'shield-check': ShieldCheckIcon,
};

function resolveStatusIcon(key) {
  return STATUS_ICON_MAP[key] ?? SignalIcon;
}

function renderSocialIcon(iconKey) {
  switch (iconKey) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M7.5 3h9a4.5 4.5 0 0 1 4.5 4.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5zm4.5 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm6.1-4.35a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15z"
            fill="currentColor"
          />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M4.75 3.5A1.75 1.75 0 1 1 3 5.25 1.75 1.75 0 0 1 4.75 3.5zM3.5 8h2.5v12H3.5zm6 0h2.4v1.7h.04c.34-.64 1.18-1.31 2.43-1.31 2.6 0 3.08 1.71 3.08 3.93V20H15v-6c0-1.44-.03-3.29-2-3.29-2 0-2.3 1.56-2.3 3.18V20H9.5z"
            fill="currentColor"
          />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M13.5 9.5V7.75c0-.83.17-1.25 1.4-1.25H16V3h-2.27C10.86 3 10 4.79 10 7.38V9.5H8v3h2v8h3.5v-8h2.4l.35-3z"
            fill="currentColor"
          />
        </svg>
      );
    case 'x':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            d="M3.5 4h5.2l4.2 6.1L16.8 4H20l-6.3 7.7L20.5 20h-5.2l-4.5-6.6L7 20H3.5l6.7-8.3L3.5 4z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

export default function Footer() {
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const { footer, locales, personas, loading, error, lastFetchedAt, refresh } = useNavigationChrome();

  const navigationSections = Array.isArray(footer?.navigationSections) ? footer.navigationSections : [];
  const statusHighlights = Array.isArray(footer?.statusHighlights)
    ? footer.statusHighlights.map((highlight) => ({
        ...highlight,
        icon: resolveStatusIcon(highlight.icon),
      }))
    : [];
  const communityLinks = Array.isArray(footer?.communityPrograms) ? footer.communityPrograms : [];
  const officeLocations = Array.isArray(footer?.officeLocations) ? footer.officeLocations : [];
  const certifications = Array.isArray(footer?.certifications) ? footer.certifications : [];
  const socialLinks = Array.isArray(footer?.socialLinks) ? footer.socialLinks : [];
  const totalLocales = Array.isArray(locales) ? locales.length : 0;
  const totalPersonas = Array.isArray(personas) ? personas.length : 0;
  const chromeState = error ? 'error' : loading ? 'loading' : 'ready';
  const chromeMeta = [
    { label: 'Locales', value: `${totalLocales} active`, trend: 'Persona-ready copy', positive: true },
    { label: 'Personas', value: `${totalPersonas} journeys`, trend: 'Blueprint metrics', positive: true },
    { label: 'Programmes', value: `${communityLinks.length} live`, trend: 'Community rails', positive: true },
  ];
  const chromeInsights = [
    ...statusHighlights.map((highlight) => `${highlight.label}: ${highlight.status} — ${highlight.detail}`),
    'Locales, personas, and footer rails hydrate from navigation chrome.',
    'Refresh to pull the latest compliance badges and programme copy.',
  ];

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('newsletter-email');
    if (email) {
      setNewsletterSubmitted(true);
      form.reset();
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-16 text-sm text-slate-500">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <Link to="/" className="inline-flex">
              <img src={LOGO_URL} alt="Gigvora" className="h-11 w-auto" />
            </Link>
            <p className="text-base text-slate-600">
              The professional community bringing clients, teams, and independent talent together with calm, reliable workflows.
            </p>
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Platform signals</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {statusHighlights.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.id} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{card.label}</p>
                          <p className="text-sm font-semibold text-slate-900">{card.status}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{card.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Stay ahead with the weekly signal</h3>
              <p className="mt-2 text-xs text-slate-500">
                Premium operators share playbooks, metrics, and upcoming launches. Join the digest to receive curated highlights every
                Thursday.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  name="newsletter-email"
                  id="newsletter-email"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Subscribe
                </button>
              </form>
              {newsletterSubmitted ? (
                <p className="mt-3 text-xs font-semibold text-emerald-600">Thanks! We&apos;ll deliver the next edition to your inbox.</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent hover:bg-accent hover:text-white"
                >
                  {renderSocialIcon(item.icon)}
                </a>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
              <DataStatus
                className="text-xs"
                loading={loading}
                error={error}
                state={chromeState}
                lastUpdated={lastFetchedAt}
                statusLabel="Navigation chrome"
                title={chromeState === 'error' ? "Chrome data unavailable" : 'Navigation chrome ready'}
                description={
                  chromeState === 'error'
                    ? 'We are serving cached footer, locale, and persona metadata while we reconnect to the chrome service.'
                    : 'Footer, locale, and persona metadata are in sync with the chrome service.'
                }
                fromCache={Boolean(error)}
                meta={chromeMeta}
                insights={chromeInsights}
                actionLabel="Refresh chrome"
                onAction={() => refresh()}
                helpLink="/support/status"
                helpLabel="Open status centre"
                footnote="Chrome sync telemetry"
              />
            </div>
          </div>
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Community programmes</h3>
              <ul className="mt-4 space-y-4 text-xs text-slate-500">
                {communityLinks.map((item) => (
                  <li key={item.label} className="flex flex-col gap-1">
                    <Link to={item.to} className="text-sm font-semibold text-slate-900 transition hover:text-accent">
                      {item.label}
                    </Link>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              {navigationSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.links.map((item) => (
                      <li key={item.label}>
                        <Link to={item.to} className="transition hover:text-accent">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4 text-[0.7rem] uppercase tracking-[0.3em]">
            {officeLocations.map((office) => (
              <span key={office} className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                {office}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            {certifications.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Gigvora. All rights reserved.</p>
            <p>Built for trust • Data residency in EU, UK, CA • Support trained across 12 locales</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
