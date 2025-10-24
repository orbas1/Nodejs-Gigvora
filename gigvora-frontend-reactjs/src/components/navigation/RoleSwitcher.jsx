import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { ArrowsRightLeftIcon, CheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';

import { classNames } from '../../utils/classNames.js';

export default function RoleSwitcher({ options, currentKey }) {
  if (!options.length) {
    return null;
  }

  const activeOption = options.find((option) => option.key === currentKey) ?? options[0];
  const ActiveIcon = activeOption.icon ?? UserCircleIcon;

  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <ArrowsRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{activeOption.label}</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right space-y-1 rounded-3xl border border-slate-200/70 bg-white p-3 text-sm shadow-xl focus:outline-none">
          {options.map((option) => {
            const Icon = option.icon ?? UserCircleIcon;
            return (
              <Menu.Item key={option.key}>
                {({ active }) => (
                  <Link
                    to={option.to}
                    className={classNames(
                      'flex items-center gap-3 rounded-2xl px-3 py-2 transition',
                      option.key === activeOption.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : active
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs text-slate-400">
                          {option.timelineEnabled ? 'Timeline ready' : 'Enable timeline from workspace settings'}
                        </span>
                      </div>
                    </div>
                    {option.key === activeOption.key ? (
                      <CheckIcon className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                  </Link>
                )}
              </Menu.Item>
            );
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

RoleSwitcher.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      timelineEnabled: PropTypes.bool,
      icon: PropTypes.elementType,
    }),
  ),
  currentKey: PropTypes.string,
};

RoleSwitcher.defaultProps = {
  options: [],
  currentKey: undefined,
};
