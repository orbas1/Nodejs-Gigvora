import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

const DEFAULT_SECTIONS = [
  { id: 'agency-overview', label: 'Overview' },
  { id: 'agency-focus', label: 'Focus' },
  { id: 'agency-bench', label: 'Bench' },
  { id: 'agency-finance', label: 'Finance' },
  { href: '/dashboard/agency/mentoring', label: 'Mentor' },
];

function normalizeSections(sections) {
  return sections
    .filter((section) => section?.label && (section?.id || section?.href))
    .map((section) => ({
      id: section.id ? `${section.id}` : null,
      label: section.label,
      href: section.href || (section.id ? `#${section.id}` : null),
    }));
}

export default function AgencyDashboardSidebar({ sections = DEFAULT_SECTIONS, offset = 128 }) {
  const normalizedSections = useMemo(() => normalizeSections(sections), [sections]);
  const location = useLocation();
  const [activeId, setActiveId] = useState(() => normalizedSections.find((section) => section.id)?.id ?? null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const observers = [];
    const handleEntries = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    normalizedSections
      .filter((section) => section.id)
      .forEach((section) => {
        const element = document.getElementById(section.id);
      if (!element) {
        return;
      }
      const observer = new IntersectionObserver(handleEntries, {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: [0.25, 0.5, 0.75],
      });
      observer.observe(element);
        observers.push(observer);
      });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [normalizedSections, offset]);

  if (!normalizedSections.length) {
    return null;
  }

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-28 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Navigation</p>
        <ul className="mt-4 space-y-2">
          {normalizedSections.map((section) => {
            const isAnchor = Boolean(section.id);
            const isRoute = Boolean(section.href && section.href.startsWith('/'));
            const key = section.id || section.href;
            const isActive = isAnchor
              ? activeId === section.id
              : isRoute && location.pathname === section.href;
            return (
              <li key={key}>
                {isRoute ? (
                  <Link
                    to={section.href}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                    {section.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    onClick={() => {
                      if (!section.id || typeof window === 'undefined') {
                        return;
                      }
                      const element = document.getElementById(section.id);
                      if (element) {
                        window.scrollTo({
                          top: element.offsetTop - offset + 8,
                          behavior: 'smooth',
                        });
                      }
                    }}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                    {section.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

AgencyDashboardSidebar.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      href: PropTypes.string,
      label: PropTypes.string.isRequired,
    }),
  ),
  offset: PropTypes.number,
};
