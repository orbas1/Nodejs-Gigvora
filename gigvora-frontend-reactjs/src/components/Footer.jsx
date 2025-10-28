import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';

const linkGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Opportunities', to: '/gigs' },
      { label: 'Projects', to: '/projects' },
      { label: 'Mentorship', to: '/mentors' },
      { label: 'Launchpad', to: '/launchpad' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Events', to: '/community-events' },
      { label: 'Blog', to: '/blog' },
      { label: 'Groups', to: '/groups' },
      { label: 'Volunteering', to: '/volunteering' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Trust Center', to: '/trust-center' },
      { label: 'Security', to: '/security-operations' },
      { label: 'Privacy', to: '/privacy' },
    ],
  },
];

const socialLinks = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/gigvora',
    icon: (props) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path
          d="M4.75 3.5A1.75 1.75 0 1 1 3 5.25 1.75 1.75 0 0 1 4.75 3.5zM3.5 8h2.5v12H3.5zm6 0h2.4v1.7h.04c.34-.64 1.18-1.31 2.43-1.31 2.6 0 3.08 1.71 3.08 3.93V20H15v-6c0-1.44-.03-3.29-2-3.29-2 0-2.3 1.56-2.3 3.18V20H9.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com',
    icon: (props) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path
          d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5zm4.5 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm6.1-4.35a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com',
    icon: (props) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path
          d="M13.5 9.5V7.75c0-.83.17-1.25 1.4-1.25H16V3h-2.27C10.86 3 10 4.79 10 7.38V9.5H8v3h2v8h3.5v-8h2.4l.35-3z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X',
    href: 'https://www.x.com',
    icon: (props) => (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path
          d="M3.5 4h5.2l4.2 6.1L16.8 4H20l-6.3 7.7L20.5 20h-5.2l-4.5-6.6L7 20H3.5l6.7-8.3L3.5 4z"
          fill="currentColor"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr,repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-6">
            <Link to="/" className="inline-flex items-center">
              <img src={LOGO_URL} alt="GigVora" className="h-10 w-auto" />
            </Link>
            <p className="max-w-sm text-sm text-slate-600">
              A modern workspace for creative professionals to launch projects, hire collaborators, and grow together.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/register?intent=talent"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Join as talent
              </Link>
              <Link
                to="/register?intent=company"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900 hover:text-slate-900"
              >
                Hire teams
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ id, label, href, icon: Icon }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {linkGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="transition hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© GigVora 2025. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link to="/community-guidelines" className="transition hover:text-slate-900">
              Community Guidelines
            </Link>
            <Link to="/trust-center" className="transition hover:text-slate-900">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
