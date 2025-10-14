import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';

const navigation = [
  {
    title: 'Platform',
    links: [
      { label: 'Launchpad', to: '/launchpad' },
      { label: 'Jobs', to: '/jobs' },
      { label: 'Projects', to: '/projects' },
      { label: 'Volunteering', to: '/volunteering' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Trust center', to: '/trust' },
      { label: 'Contact', to: '/support/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Support centre', to: '/support' },
      { label: 'Community guidelines', to: '/community' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
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
  return (
    <footer className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 text-sm text-slate-500 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div className="space-y-6">
          <Link to="/" className="inline-flex">
            <img src={LOGO_URL} alt="Gigvora" className="h-11 w-auto" />
          </Link>
          <p className="text-sm text-slate-500">
            The professional community bringing clients, teams, and independent talent together with calm, reliable workflows.
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
      <div className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Gigvora. All rights reserved.</p>
          <p>Secure by design • SOC 2 aligned • GDPR ready</p>
        </div>
      </div>
    </footer>
  );
}
