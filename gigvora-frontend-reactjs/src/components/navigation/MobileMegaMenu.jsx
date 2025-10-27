import { Disclosure } from '@headlessui/react';
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { classNames } from '../../utils/classNames.js';
import { deriveNavigationTrending, normaliseTrendingEntries } from '../../utils/navigationPulse.js';
import analytics from '../../services/analytics.js';

export default function MobileMegaMenu({ menus, search, onNavigate, onSearch, trendingEntries }) {
  const [query, setQuery] = useState('');
  const searchTrending = search?.trending;
  const trendingItems = useMemo(() => {
    if (Array.isArray(trendingEntries) && trendingEntries.length > 0) {
      return trendingEntries;
    }
    if (Array.isArray(searchTrending) && searchTrending.length > 0) {
      return normaliseTrendingEntries(searchTrending, search);
    }
    return deriveNavigationTrending(menus, 6);
  }, [menus, search, searchTrending, trendingEntries]);
  const primaryTrending = trendingItems.slice(0, 2);
  const secondaryTrending = trendingItems.slice(2);
  const trendingHelperText =
    search?.helperText ?? search?.trendingHelper ?? 'Popular destinations curated for your workspace.';
  const handleTrendingNavigate = (item) => {
    if (item && typeof analytics?.track === 'function') {
      const trackPromise = analytics.track(
        'mobile_marketing_trending_navigate',
        {
          entryId: item.id,
          label: item.label,
          destination: item.to ?? null,
          source: 'mobile-mega-menu',
          isSearchTrending: Boolean(item.id?.startsWith('search-trending-')),
        },
      );
      if (trackPromise && typeof trackPromise.catch === 'function') {
        trackPromise.catch(() => {});
      }
    }
    onNavigate?.();
    if (item?.id?.startsWith('search-trending-')) {
      onSearch?.(item.label);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    onSearch?.(trimmed);
    setQuery('');
  };

  return (
    <div className="space-y-6">
      {trendingItems.length ? (
        <div className="space-y-3 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/70 p-5 text-white shadow-xl">
          <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            <span>Trending now</span>
            <span className="rounded-full border border-white/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/80">
              Updated
            </span>
          </header>
          <p className="text-sm text-white/80">{trendingHelperText}</p>
          <div className="grid gap-2">
            {primaryTrending.map((item) => (
              <Link
                key={`primary-${item.id}`}
                to={item.to}
                onClick={() => handleTrendingNavigate(item)}
                className="group flex items-start justify-between gap-4 rounded-3xl border border-white/30 bg-white/10 px-4 py-3 text-left shadow-lg transition hover:border-white/60 hover:bg-white/20"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  {item.description ? (
                    <p className="mt-1 text-xs text-white/80">{item.description}</p>
                  ) : null}
                </div>
                <ArrowUpRightIcon className="h-5 w-5 text-white/70" aria-hidden="true" />
              </Link>
            ))}
          </div>
          {secondaryTrending.length ? (
            <div className="flex flex-wrap gap-2">
              {secondaryTrending.map((item) => (
                <Link
                  key={`secondary-${item.id}`}
                  to={item.to}
                  onClick={() => handleTrendingNavigate(item)}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/20"
                >
                  <span>{item.label}</span>
                  <ArrowUpRightIcon className="h-4 w-4 text-white/70 group-hover:text-white" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {search ? (
        <form onSubmit={handleSubmit} className="space-y-2" role="search" aria-label={search.ariaLabel}>
          <label htmlFor="mobile-mega-menu-search" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {search.label}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm focus-within:border-slate-400/80">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="mobile-mega-menu-search"
              name="query"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={search.placeholder}
              className="flex-1 border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-700"
            >
              Search
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {menus.map((menu) => (
          <Disclosure key={menu.id}>
            {({ open }) => (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <Disclosure.Button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800"
                  aria-expanded={open}
                >
                  <span>{menu.label}</span>
                  <ChevronDownIcon
                    className={classNames('h-5 w-5 text-slate-400 transition', open ? 'rotate-180 text-slate-600' : '')}
                    aria-hidden="true"
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="space-y-5 border-t border-slate-200/70 px-4 pb-5 pt-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{menu.description}</p>
                  {menu.sections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{section.title}</p>
                      <ul className="space-y-1.5">
                        {section.items.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.to}
                              onClick={() => onNavigate?.()}
                              className="block rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="h-5 w-5 text-accent" aria-hidden="true" />
                                <span>{item.name}</span>
                              </div>
                              <p className="mt-1 text-xs font-normal text-slate-500">{item.description}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  );
}

MobileMegaMenu.propTypes = {
  menus: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      sections: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string.isRequired,
              description: PropTypes.string.isRequired,
              to: PropTypes.string.isRequired,
              icon: PropTypes.elementType.isRequired,
            }),
          ).isRequired,
        }),
      ).isRequired,
    }),
  ),
  search: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    ariaLabel: PropTypes.string,
    helperText: PropTypes.string,
    trendingHelper: PropTypes.string,
    trending: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          label: PropTypes.string,
          description: PropTypes.string,
          to: PropTypes.string,
          query: PropTypes.string,
          helperText: PropTypes.string,
        }),
      ]),
    ),
  }),
  onNavigate: PropTypes.func,
  onSearch: PropTypes.func,
  trendingEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
    }),
  ),
};

MobileMegaMenu.defaultProps = {
  menus: [],
  search: null,
  onNavigate: undefined,
  onSearch: undefined,
  trendingEntries: null,
};
