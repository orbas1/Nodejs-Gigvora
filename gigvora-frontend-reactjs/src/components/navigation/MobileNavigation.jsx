import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowTrendingUpIcon, SignalIcon, SparklesIcon } from '@heroicons/react/24/outline';
import LanguageSelector from '../LanguageSelector.jsx';
import RoleSwitcher from './RoleSwitcher.jsx';
import MobileMegaMenu from './MobileMegaMenu.jsx';
import PrimaryNavItem from './PrimaryNavItem.jsx';
import {
  deriveNavigationPulse,
  deriveNavigationTrending,
  normaliseTrendingEntries,
} from '../../utils/navigationPulse.js';
import analytics from '../../services/analytics.js';

function PersonaPulse({ insights }) {
  if (!Array.isArray(insights) || insights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-lg">
      <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        <span className="inline-flex items-center gap-2 text-slate-600">
          <SignalIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          Live pulse
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Today
        </span>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-400">{insight.label}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{insight.value}</p>
            {insight.delta ? <p className="mt-1 text-xs font-medium text-emerald-600">{insight.delta}</p> : null}
            {insight.hint ? <p className="mt-1 text-[0.65rem] text-slate-400">{insight.hint}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

PersonaPulse.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      hint: PropTypes.string,
    }),
  ),
};

PersonaPulse.defaultProps = {
  insights: [],
};

export function TrendingQuickLinks({ entries, onNavigate }) {
  const curatedEntries = useMemo(() => {
    if (!Array.isArray(entries) || !entries.length) {
      return [];
    }
    return entries.slice(0, 5);
  }, [entries]);

  if (!curatedEntries.length) {
    return null;
  }

  const primary = curatedEntries.slice(0, 2);
  const secondary = curatedEntries.slice(2);

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/80 p-4 text-white shadow-xl">
      <header className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
        <span className="inline-flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          Trending now
        </span>
        <span className="rounded-full border border-white/30 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/80">
          Updated
        </span>
      </header>
      <div className="grid gap-2">
        {primary.map((entry) => (
          <Link
            key={entry.id}
            to={entry.to ?? '#'}
            onClick={() => onNavigate?.(entry)}
            className="group flex items-start justify-between gap-4 rounded-3xl border border-white/25 bg-white/10 px-4 py-3 text-left shadow-lg transition hover:border-white/40 hover:bg-white/20"
          >
            <div>
              <p className="text-sm font-semibold text-white">{entry.label}</p>
              {entry.description ? (
                <p className="mt-1 text-xs text-white/80">{entry.description}</p>
              ) : null}
            </div>
            <ArrowTrendingUpIcon className="h-5 w-5 text-white/70" aria-hidden="true" />
          </Link>
        ))}
      </div>
      {secondary.length ? (
        <div className="flex flex-wrap gap-2">
          {secondary.map((entry) => (
            <Link
              key={entry.id}
              to={entry.to ?? '#'}
              onClick={() => onNavigate?.(entry)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <span>{entry.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

TrendingQuickLinks.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
    }),
  ),
  onNavigate: PropTypes.func,
};

TrendingQuickLinks.defaultProps = {
  entries: [],
  onNavigate: undefined,
};

export default function MobileNavigation({
  open,
  onClose,
  isAuthenticated,
  primaryNavigation,
  quickNavigation,
  marketingNavigation,
  marketingSearch,
  onLogout,
  roleOptions,
  currentRoleKey,
  onMarketingSearch,
  session,
  navigationPulse,
  trendingEntries,
}) {
  const resolvedPrimaryNavigation = useMemo(() => primaryNavigation ?? [], [primaryNavigation]);
  const quickNavItems = useMemo(() => quickNavigation ?? [], [quickNavigation]);
  const sessionId = session?.id ?? null;
  const personaPulse = useMemo(() => {
    if (Array.isArray(navigationPulse) && navigationPulse.length > 0) {
      return navigationPulse;
    }
    return deriveNavigationPulse(session, marketingNavigation, resolvedPrimaryNavigation);
  }, [marketingNavigation, navigationPulse, resolvedPrimaryNavigation, session]);
  const personaTrending = useMemo(() => {
    if (Array.isArray(trendingEntries) && trendingEntries.length > 0) {
      return trendingEntries;
    }
    const marketingMenus = Array.isArray(marketingNavigation) ? marketingNavigation : [];
    const marketingDerived = deriveNavigationTrending(marketingMenus, 6);
    if (marketingDerived.length) {
      return marketingDerived;
    }
    const searchTrending = normaliseTrendingEntries(marketingSearch?.trending ?? [], marketingSearch);
    if (searchTrending.length) {
      return searchTrending;
    }
    const fallbackMenus = [
      {
        id: 'primary-navigation',
        sections: [
          {
            title: 'Recommended',
            items: resolvedPrimaryNavigation.map((item) => ({
              name: item.label,
              description: item.badge ?? 'Explore this workspace surface',
              to: item.to,
            })),
          },
        ],
      },
    ];
    return deriveNavigationTrending(fallbackMenus, 6);
  }, [marketingNavigation, marketingSearch, resolvedPrimaryNavigation, trendingEntries]);
  const handleTrendingNavigate = useCallback(
    (entry) => {
      if (entry) {
        if (typeof analytics?.track === 'function') {
          const trackPromise = analytics.track(
            'mobile_nav_trending_navigate',
            {
              entryId: entry.id,
              label: entry.label,
              destination: entry.to ?? null,
              persona: currentRoleKey ?? null,
              isSearchTrending: Boolean(entry.id?.startsWith('search-trending-')),
              source: 'mobile-navigation',
            },
            { userId: sessionId },
          );
          if (trackPromise && typeof trackPromise.catch === 'function') {
            trackPromise.catch(() => {});
          }
        }
        if (entry.id?.startsWith('search-trending-')) {
          onMarketingSearch?.(entry.label);
        }
      }
      onClose?.();
    },
    [currentRoleKey, onClose, onMarketingSearch, sessionId],
  );

  const creationStudioNav = useMemo(
    () => quickNavItems.find((item) => item.id === 'studio'),
    [quickNavItems],
  );

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in duration-150"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-r-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl">
            <div className="flex items-center justify-between px-1 pb-3">
              <Dialog.Title className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Navigate
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
              {isAuthenticated ? (
                <div className="space-y-4">
                  {roleOptions?.length ? (
                    <RoleSwitcher options={roleOptions} currentKey={currentRoleKey} onSelect={onClose} />
                  ) : null}
                  <nav className="space-y-2">
                    {resolvedPrimaryNavigation.map((item) => (
                      <PrimaryNavItem key={item.id} item={item} variant="mobile" onNavigate={onClose} />
                    ))}
                  </nav>
                  {quickNavItems.length ? (
                    <div className="space-y-2 pt-2">
                      <p className="px-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Quick actions
                      </p>
                      <div className="space-y-2">
                        {quickNavItems.map((item) => (
                          <PrimaryNavItem key={item.id} item={item} variant="mobile" onNavigate={onClose} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <PersonaPulse insights={personaPulse} />
                  <TrendingQuickLinks entries={personaTrending} onNavigate={handleTrendingNavigate} />
                  <div className="grid gap-2">
                    {creationStudioNav ? (
                      <Link
                        to={creationStudioNav.to}
                        onClick={onClose}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accentDark"
                      >
                        <SparklesIcon className="h-4 w-4" /> Launch {creationStudioNav.label}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout?.();
                      }}
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <MobileMegaMenu
                    menus={marketingNavigation}
                    search={marketingSearch}
                    trendingEntries={trendingEntries}
                    onNavigate={onClose}
                    onSearch={(value) => {
                      onClose();
                      onMarketingSearch?.(value);
                    }}
                  />
                  <div className="grid gap-2">
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/80 px-5 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-slate-200/70 pt-4">
              <LanguageSelector variant="mobile" />
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

MobileNavigation.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  primaryNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      badge: PropTypes.string,
      placement: PropTypes.string,
    }),
  ),
  quickNavigation: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      badge: PropTypes.string,
      placement: PropTypes.string,
    }),
  ),
  marketingNavigation: PropTypes.arrayOf(
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
  marketingSearch: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    ariaLabel: PropTypes.string,
    helperText: PropTypes.string,
    trendingHelper: PropTypes.string,
    trending: PropTypes.array,
  }),
  onLogout: PropTypes.func,
  roleOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      timelineEnabled: PropTypes.bool,
    }),
  ),
  currentRoleKey: PropTypes.string,
  onMarketingSearch: PropTypes.func,
  session: PropTypes.object,
  navigationPulse: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      delta: PropTypes.string,
      hint: PropTypes.string,
    }),
  ),
  trendingEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
    }),
  ),
};

MobileNavigation.defaultProps = {
  primaryNavigation: [],
  quickNavigation: [],
  marketingNavigation: [],
  marketingSearch: null,
  onLogout: undefined,
  roleOptions: [],
  currentRoleKey: 'user',
  onMarketingSearch: undefined,
  session: null,
  navigationPulse: [],
  trendingEntries: [],
};
