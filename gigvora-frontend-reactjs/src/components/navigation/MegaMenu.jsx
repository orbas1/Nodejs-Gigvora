import { Fragment, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { ArrowUpRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import analytics from '../../services/analytics.js';
import { classNames } from '../../utils/classNames.js';

export default function MegaMenu({ item }) {
  const panelRef = useRef(null);
  const focusableSelector = useMemo(
    () => 'a[href]:not([tabindex="-1"]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    [],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!panelRef.current) {
        return;
      }

      const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) {
        return;
      }

      const focusable = Array.from(panelRef.current.querySelectorAll(focusableSelector));
      if (!focusable.length) {
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement);
      let nextIndex = currentIndex;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % focusable.length;
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = focusable.length - 1;
      }

      event.preventDefault();
      focusable[nextIndex]?.focus();
    },
    [focusableSelector],
  );

  const handleMenuEntered = useCallback(() => {
    analytics.track('web_navigation_megamenu_opened', {
      id: item.id,
      label: item.label,
    });
  }, [item.id, item.label]);

  const handleItemClick = useCallback(
    (entry) => {
      analytics.track('web_navigation_megamenu_link_clicked', {
        menuId: item.id,
        menuLabel: item.label,
        destination: entry.to,
        entryLabel: entry.name,
      });
    },
    [item.id, item.label],
  );

  const theme = item.theme ?? {};
  const highlightEntries = useMemo(() => {
    if (Array.isArray(item.highlights) && item.highlights.length > 0) {
      return item.highlights.map((highlight, index) => ({
        id: highlight.id ?? `${item.id}-highlight-${index}`,
        label: highlight.label ?? highlight.name ?? highlight.title ?? item.label,
        description: highlight.description ?? highlight.subtitle ?? '',
        to: highlight.to ?? highlight.href ?? '/',
        badge: highlight.badge ?? 'Trending',
      }));
    }

    const aggregated = [];
    item.sections.forEach((section) => {
      section.items.forEach((entry, index) => {
        if (aggregated.length >= 3) {
          return;
        }
        aggregated.push({
          id: `${item.id}-${section.title}-${entry.name}-${index}`,
          label: entry.name,
          description: entry.description,
          to: entry.to,
          badge: 'Spotlight',
        });
      });
    });
    return aggregated;
  }, [item]);

  const sectionColumns = useMemo(() => {
    if (item.sections.length >= 3) {
      return 'md:grid-cols-3';
    }
    if (item.sections.length === 2) {
      return 'md:grid-cols-2';
    }
    return 'md:grid-cols-1';
  }, [item.sections.length]);

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={classNames(
              open
                ? 'text-slate-900'
                : 'text-slate-600 hover:text-slate-900 focus:text-slate-900',
              'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              theme.button,
            )}
          >
            <span>{item.label}</span>
            <ChevronDownIcon
              className={classNames(open ? 'rotate-180 text-slate-900' : 'text-slate-400', 'h-4 w-4 transition')}
              aria-hidden="true"
            />
          </Popover.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
          afterEnter={handleMenuEntered}
        >
          <Popover.Panel
            ref={panelRef}
            className="absolute left-1/2 z-50 mt-6 w-screen max-w-5xl -translate-x-1/2 transform px-4 sm:px-0"
            onKeyDown={handleKeyDown}
          >
            <div className={classNames('overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur', theme.panel)}>
              <div className={classNames('border-b border-slate-200/60 px-6 py-4', theme.header)}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                    <p className="mt-1 max-w-xl text-sm text-slate-600">{item.description}</p>
                  </div>
                  {highlightEntries.length ? (
                    <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-sm">
                      {highlightEntries.slice(0, 2).map((highlight) => (
                        <Link
                          key={highlight.id}
                          to={highlight.to}
                          className="group relative overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 px-4 py-3 text-white shadow-lg transition hover:border-accent/40 hover:bg-slate-900"
                          onClick={() => handleItemClick({ to: highlight.to, name: highlight.label })}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-accent/20 to-transparent opacity-80" aria-hidden="true" />
                          <div className="relative z-10 flex items-center justify-between text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/70">
                            <span>{highlight.badge}</span>
                            <ArrowUpRightIcon className="h-4 w-4 text-white/80" aria-hidden="true" />
                          </div>
                          <p className="relative z-10 mt-2 text-sm font-semibold text-white">{highlight.label}</p>
                          {highlight.description ? (
                            <p className="relative z-10 mt-1 text-xs text-white/80">{highlight.description}</p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                {highlightEntries.length > 2 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {highlightEntries.slice(2, 5).map((highlight) => (
                      <Link
                        key={highlight.id}
                        to={highlight.to}
                        className="group flex items-center justify-between rounded-3xl border border-slate-200/70 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent/50 hover:text-accent"
                        onClick={() => handleItemClick({ to: highlight.to, name: highlight.label })}
                      >
                        <span className="truncate">{highlight.label}</span>
                        <ArrowUpRightIcon className="h-4 w-4 text-slate-400 group-hover:text-accent" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={classNames('grid gap-6 px-6 py-6', sectionColumns, theme.grid)}>
                {item.sections.map((section) => (
                  <div key={section.title} className={classNames('space-y-4', theme.section)}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{section.title}</p>
                    </div>
                    <ul className="space-y-3">
                      {section.items.map((entry) => (
                        <li key={entry.name}>
                          <Link
                            to={entry.to}
                            className={classNames(
                              'group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50',
                              theme.item,
                            )}
                            onClick={() => handleItemClick(entry)}
                          >
                            <entry.icon
                              className={classNames(
                                'h-6 w-6 flex-none text-accent group-hover:text-accent-strong',
                                theme.icon,
                              )}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-900">{entry.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

MegaMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    theme: PropTypes.shape({
      button: PropTypes.string,
      panel: PropTypes.string,
      header: PropTypes.string,
      grid: PropTypes.string,
      section: PropTypes.string,
      item: PropTypes.string,
      icon: PropTypes.string,
    }),
    highlights: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
        description: PropTypes.string,
        to: PropTypes.string,
        badge: PropTypes.string,
      }),
    ),
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
  }).isRequired,
};
