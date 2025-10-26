import { Disclosure } from '@headlessui/react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { classNames } from '../../utils/classNames.js';
import analytics from '../../services/analytics.js';

export default function MobileMegaMenu({ menus, search, onNavigate, onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    analytics.track('web_navigation_mobile_search', {
      query: trimmed,
      surface: search?.id ?? 'mobile-mega-menu',
    });
    onSearch?.(trimmed);
    setQuery('');
  };

  return (
    <div className="space-y-6">
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
                  onClick={() => {
                    analytics.track('web_navigation_mobile_megamenu_section_toggled', {
                      menuId: menu.id,
                      menuLabel: menu.label,
                      open: !open,
                    });
                  }}
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
                              onFocusCapture={() => {
                                analytics.track('web_navigation_mobile_megamenu_highlighted', {
                                  menuId: menu.id,
                                  section: section.title,
                                  destination: item.to,
                                });
                              }}
                              onClickCapture={() => {
                                analytics.track('web_navigation_mobile_megamenu_link_clicked', {
                                  menuId: menu.id,
                                  section: section.title,
                                  destination: item.to,
                                  label: item.name,
                                });
                              }}
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
  }),
  onNavigate: PropTypes.func,
  onSearch: PropTypes.func,
};

MobileMegaMenu.defaultProps = {
  menus: [],
  search: null,
  onNavigate: undefined,
  onSearch: undefined,
};
