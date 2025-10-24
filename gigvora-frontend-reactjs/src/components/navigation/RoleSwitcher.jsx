import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { classNames } from '../../utils/classNames.js';

const ROLE_ICON_MAP = {
  user: UserGroupIcon,
  freelancer: SparklesIcon,
  company: BuildingOffice2Icon,
  agency: BuildingOffice2Icon,
  admin: ShieldCheckIcon,
  mentor: AcademicCapIcon,
  volunteer: HeartIcon,
};

export default function RoleSwitcher({ options, currentKey, onSelect }) {
  if (!options.length) {
    return null;
  }

  const activeOption = options.find((option) => option.key === currentKey) ?? options[0];
  const ActiveIcon = activeOption.icon ?? ROLE_ICON_MAP[activeOption.key] ?? Squares2X2Icon;

  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <ArrowsRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <ActiveIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
          {activeOption.label}
        </span>
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
        <Menu.Items className="absolute right-0 z-50 mt-2 w-72 origin-top-right space-y-1 rounded-3xl border border-slate-200/70 bg-white p-3 text-sm shadow-xl focus:outline-none">
            {options.map((option) => (
              <Menu.Item key={option.key}>
                {({ active }) => {
                  const OptionIcon = option.icon ?? ROLE_ICON_MAP[option.key] ?? Squares2X2Icon;
                  return (
                    <Link
                      to={option.to}
                      onClick={onSelect}
                      className={classNames(
                        'flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                        option.key === activeOption.key
                          ? 'bg-slate-900 text-white shadow-sm'
                          : active
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                      aria-current={option.key === activeOption.key ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <OptionIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        <div className="text-left">
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span
                            className={classNames(
                              'block text-xs',
                              option.timelineEnabled ? 'text-emerald-500' : 'text-amber-600',
                            )}
                          >
                            {option.timelineEnabled ? 'Timeline live' : 'Request timeline access'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {option.timelineEnabled ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-600">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-600">
                            Pending
                          </span>
                        )}
                        {option.key === activeOption.key ? (
                          <CheckIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                        ) : null}
                      </div>
                    </Link>
                  );
                }}
              </Menu.Item>
            ))}
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
  onSelect: PropTypes.func,
};

RoleSwitcher.defaultProps = {
  options: [],
  currentKey: undefined,
  onSelect: undefined,
};
