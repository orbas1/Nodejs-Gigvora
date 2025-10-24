import { Fragment, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

import analytics from '../../services/analytics.js';
import { classNames } from '../../utils/classNames.js';

export default function MegaMenu({ item }) {
  const sectionRefs = useRef([]);

  if (sectionRefs.current.length !== item.sections.length) {
    sectionRefs.current = Array.from({ length: item.sections.length }, () => []);
  }

  const theme = useMemo(() => {
    const overrides = item.theme ?? {};
    return {
      panel: classNames(
        'overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur',
        overrides.panel,
      ),
      header: classNames('border-b border-slate-200/60 px-6 py-4', overrides.header),
      headerTitle: classNames(
        'text-xs font-semibold uppercase tracking-[0.25em] text-slate-400',
        overrides.headerTitle,
      ),
      headerDescription: classNames('mt-1 text-sm text-slate-600', overrides.headerDescription),
      sections: classNames('grid gap-6 px-6 py-6 sm:grid-cols-2', overrides.sections),
      sectionTitle: classNames(
        'text-xs font-semibold uppercase tracking-[0.25em] text-slate-400',
        overrides.sectionTitle,
      ),
      link: classNames(
        'group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        overrides.link,
      ),
      icon: classNames('h-6 w-6 flex-none text-accent group-hover:text-accent-strong', overrides.icon),
      linkTitle: classNames('text-sm font-semibold text-slate-900 group-hover:text-slate-900', overrides.linkTitle),
      linkDescription: classNames('mt-1 text-xs text-slate-500', overrides.linkDescription),
    };
  }, [item.theme]);

  const registerItem = useCallback((sectionIndex, itemIndex) => (element) => {
    if (!sectionRefs.current[sectionIndex]) {
      sectionRefs.current[sectionIndex] = [];
    }
    sectionRefs.current[sectionIndex][itemIndex] = element;
  }, []);

  const focusWithinSection = useCallback((sectionIndex, itemIndex) => {
    const section = sectionRefs.current[sectionIndex];
    if (!section || !section.length) {
      return;
    }
    const normalizedIndex = ((itemIndex % section.length) + section.length) % section.length;
    section[normalizedIndex]?.focus();
  }, []);

  const findNextSectionIndex = useCallback((currentIndex, direction) => {
    const sections = sectionRefs.current;
    if (!sections.length) {
      return currentIndex;
    }
    let nextIndex = currentIndex;
    for (let attempt = 0; attempt < sections.length; attempt += 1) {
      nextIndex = (nextIndex + direction + sections.length) % sections.length;
      if (sections[nextIndex] && sections[nextIndex].length) {
        return nextIndex;
      }
    }
    return currentIndex;
  }, []);

  const handleKeyDown = useCallback(
    (event, sectionIndex, itemIndex) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusWithinSection(sectionIndex, itemIndex + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusWithinSection(sectionIndex, itemIndex - 1);
          break;
        case 'ArrowRight': {
          event.preventDefault();
          const nextSection = findNextSectionIndex(sectionIndex, 1);
          const nextItems = sectionRefs.current[nextSection] ?? [];
          focusWithinSection(nextSection, Math.min(itemIndex, Math.max(0, nextItems.length - 1)));
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          const prevSection = findNextSectionIndex(sectionIndex, -1);
          const prevItems = sectionRefs.current[prevSection] ?? [];
          focusWithinSection(prevSection, Math.min(itemIndex, Math.max(0, prevItems.length - 1)));
          break;
        }
        default:
          break;
      }
    },
    [findNextSectionIndex, focusWithinSection],
  );

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
            )}
            onClick={() => {
              if (!open) {
                analytics.track('web_nav_megamenu_opened', { menuId: item.id }, { source: 'web_app' });
              }
            }}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && !open) {
                analytics.track('web_nav_megamenu_opened', { menuId: item.id }, { source: 'web_app' });
              }
            }}
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
          >
            <Popover.Panel className="absolute left-1/2 z-50 mt-6 w-screen max-w-3xl -translate-x-1/2 transform px-4 sm:px-0">
              <div className={theme.panel}>
                <div className={theme.header}>
                  <p className={theme.headerTitle}>{item.label}</p>
                  <p className={theme.headerDescription}>{item.description}</p>
                </div>
                <div className={theme.sections}>
                  {item.sections.map((section, sectionIndex) => (
                    <div key={section.title} className="space-y-4">
                      <div>
                        <p className={theme.sectionTitle}>{section.title}</p>
                      </div>
                      <ul className="space-y-3">
                        {section.items.map((entry, itemIndex) => (
                          <li key={entry.name}>
                            <Link
                              to={entry.to}
                              ref={registerItem(sectionIndex, itemIndex)}
                              onKeyDown={(event) => handleKeyDown(event, sectionIndex, itemIndex)}
                              onClick={() =>
                                analytics.track(
                                  'web_nav_megamenu_link_click',
                                  { menuId: item.id, target: entry.to, label: entry.name },
                                  { source: 'web_app' },
                                )
                              }
                              className={theme.link}
                            >
                              <entry.icon className={theme.icon} />
                              <div>
                                <p className={theme.linkTitle}>{entry.name}</p>
                                <p className={theme.linkDescription}>{entry.description}</p>
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
    theme: PropTypes.shape({
      panel: PropTypes.string,
      header: PropTypes.string,
      headerTitle: PropTypes.string,
      headerDescription: PropTypes.string,
      sections: PropTypes.string,
      sectionTitle: PropTypes.string,
      link: PropTypes.string,
      icon: PropTypes.string,
      linkTitle: PropTypes.string,
      linkDescription: PropTypes.string,
    }),
  }).isRequired,
};
