import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataStatus from './DataStatus.jsx';
import { LOGO_URL } from '../constants/branding.js';

const navigation = [
  {
    title: 'Platform',
    links: [
      { label: 'Launchpad', to: '/launchpad' },
      { label: 'Jobs', to: '/jobs' },
      { label: 'Projects', to: '/projects' },
      { label: 'Volunteering', to: '/volunteering' },
      { label: 'Mentorship', to: '/mentors' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Freelancer workspace', to: '/dashboard/freelancer' },
      { label: 'Agency hub', to: '/dashboard/agency' },
      { label: 'Company analytics', to: '/dashboard/company' },
      { label: 'Launchpad experiences', to: '/experience-launchpad' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Trust centre', to: '/trust-center' },
      { label: 'Contact', to: '/support/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Support centre', to: '/support' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Community guidelines', to: '/community-guidelines' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms & conditions', to: '/terms' },
      { label: 'Refund policy', to: '/refunds' },
    ],
  },
];

const socialLinks = [
  {
    label: 'Follow on X',
    href: 'https://x.com/gigvora',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M3.5 4h5.2l4.2 6.1L16.8 4H20l-6.3 7.7L20.5 20h-5.2l-4.5-6.6L7 20H3.5l6.7-8.3L3.5 4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Follow on Instagram',
    href: 'https://instagram.com/gigvora',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M7.5 3h9a4.5 4.5 0 0 1 4.5 4.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5zm4.5 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm6.1-4.35a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Connect on LinkedIn',
    href: 'https://linkedin.com/company/gigvora',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M4.75 3.5A1.75 1.75 0 1 1 3 5.25 1.75 1.75 0 0 1 4.75 3.5zM3.5 8h2.5v12H3.5zm6 0h2.4v1.7h.04c.34-.64 1.18-1.31 2.43-1.31 2.6 0 3.08 1.71 3.08 3.93V20H15v-6c0-1.44-.03-3.29-2-3.29-2 0-2.3 1.56-2.3 3.18V20H9.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    label: 'Like on Facebook',
    href: 'https://facebook.com/gigvora',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
          d="M13.5 9.5V7.75c0-.83.17-1.25 1.4-1.25H16V3h-2.27C10.86 3 10 4.79 10 7.38V9.5H8v3h2v8h3.5v-8h2.4l.35-3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  const [statusSnapshot, setStatusSnapshot] = useState(() => ({
    updatedAt: new Date(),
    uptime: '99.98%',
    supportResponse: '4m median',
    incidents: 0,
    maintenance: 'No maintenance scheduled',
    services: [
      {
        id: 'web-app',
        name: 'Web application',
        status: 'Operational',
        description: 'Dashboards, feeds, messaging, and surface chrome.',
      },
      {
        id: 'api',
        name: 'API & automations',
        status: 'Operational',
        description: 'REST APIs, webhook delivery, and workflow automations.',
      },
      {
        id: 'payments',
        name: 'Payments & billing',
        status: 'Operational',
        description: 'Invoicing, payouts, and subscription renewals.',
      },
      {
        id: 'communications',
        name: 'Communications',
        status: 'Operational',
        description: 'Voice, video, notifications, and inbox syncing.',
      },
    ],
  }));

  const statusInsights = useMemo(
    () => [
      {
        id: 'uptime',
        label: 'Uptime',
        value: statusSnapshot.uptime,
        caption: 'Rolling 90-day composite across core surfaces.',
      },
      {
        id: 'response',
        label: 'Support response',
        value: statusSnapshot.supportResponse,
        caption: 'Median human response time from the trust centre.',
      },
      {
        id: 'incidents',
        label: 'Incidents (30d)',
        value: `${statusSnapshot.incidents}`,
        caption: 'Major incidents published with transparent runbooks.',
      },
      {
        id: 'maintenance',
        label: 'Next maintenance',
        value: statusSnapshot.maintenance,
        caption: 'All windows announced at least 7 days in advance.',
      },
    ],
    [statusSnapshot.incidents, statusSnapshot.maintenance, statusSnapshot.supportResponse, statusSnapshot.uptime],
  );

  const handleStatusRefresh = () => {
    setStatusSnapshot((current) => ({
      ...current,
      updatedAt: new Date(),
    }));
  };

  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-16 text-sm text-slate-500">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="space-y-6">
            <Link to="/" className="inline-flex">
              <img src={LOGO_URL} alt="Gigvora" className="h-11 w-auto" />
            </Link>
            <p className="text-sm leading-6 text-slate-500">
              Gigvora unites clients, agencies, freelancers, and mentors in one premium workspace with polished onboarding,
              live analytics, and human support that feels as considered as the best social networks.
            </p>
            <Link
              to="/support"
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Support centre
            </Link>
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
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          {navigation.map((section) => (
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
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <DataStatus
            loading={false}
            fromCache={false}
            lastUpdated={statusSnapshot.updatedAt}
            onRefresh={handleStatusRefresh}
            statusLabel="Platform status"
            title="All systems operational"
            helper="Status updates follow SOC 2, ISO 27001, and GDPR communication runbooks."
            insights={statusInsights}
            actions={
              <a
                href="/trust-center/status"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Open trust centre
              </a>
            }
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {statusSnapshot.services.map((service) => (
                <li
                  key={service.id}
                  className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">{service.name}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                      {service.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{service.description}</p>
                </li>
              ))}
            </ul>
          </DataStatus>
          <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Insights & newsletters</h3>
            <p className="text-sm leading-6 text-slate-500">
              Join our monthly drop for product releases, playbooks, and behind-the-scenes operations notes from the Gigvora crew.
            </p>
            <form className="space-y-3">
              <div>
                <label htmlFor="footer-email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Work email
                </label>
                <input
                  id="footer-email"
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-inner transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Subscribe
              </button>
              <p className="text-[0.7rem] text-slate-400">
                By subscribing you agree to our{' '}
                <Link to="/privacy" className="underline underline-offset-4">
                  privacy policy
                </Link>{' '}
                and can opt out anytime.
              </p>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Gigvora. All rights reserved.</p>
          <p>Secure by design • SOC 2 aligned • GDPR ready</p>
        </div>
      </div>
    </footer>
  );
}
