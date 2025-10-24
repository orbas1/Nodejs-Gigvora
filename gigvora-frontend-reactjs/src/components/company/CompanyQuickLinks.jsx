import { useState } from 'react';
import PropTypes from 'prop-types';
import { Bars3BottomLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CompanyQuickLinks({ links }) {
  const [expanded, setExpanded] = useState(false);

  if (!links?.length) {
    return null;
  }

  const toggle = () => {
    setExpanded((previous) => !previous);
  };

  return (
    <div className="sticky top-24 z-10 space-y-4">
      <div className="hidden lg:block">
        <nav className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 font-medium text-slate-600 transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
          aria-expanded={expanded}
        >
          <span className="inline-flex items-center gap-2">
            <Bars3BottomLeftIcon className="h-5 w-5" />
            Navigation
          </span>
          <XMarkIcon className={`h-5 w-5 transition ${expanded ? 'rotate-0 opacity-100' : 'rotate-90 opacity-40'}`} />
        </button>
        {expanded ? (
          <nav className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <ul className="space-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setExpanded(false)}
                    className="block rounded-2xl px-3 py-2 font-medium text-slate-600 transition hover:bg-accent/5 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

CompanyQuickLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    }),
  ),
};

CompanyQuickLinks.defaultProps = {
  links: undefined,
};
