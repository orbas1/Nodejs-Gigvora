import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  AcademicCapIcon,
  ArrowsRightLeftIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  SparklesIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  MagnifyingGlassCircleIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const personaIcons = Object.freeze({
  user: UserCircleIcon,
  freelancer: SparklesIcon,
  agency: BuildingOffice2Icon,
  company: BriefcaseIcon,
  headhunter: MagnifyingGlassCircleIcon,
  mentor: AcademicCapIcon,
  admin: ShieldCheckIcon,
});

export default function RoleSwitcher({ options, currentKey, onSelect }) {
  if (!options.length) {
    return null;
  }

  const activeOption = options.find((option) => option.key === currentKey) ?? options[0];
  const ActiveIcon = personaIcons[activeOption.key] ?? UserCircleIcon;

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
            const OptionIcon = personaIcons[option.key] ?? UserCircleIcon;
            return (
              <Menu.Item key={option.key}>
                {({ active }) => (
                  <Link
                    to={option.to}
                    onClick={onSelect}
                    className={classNames(
                      'flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition',
                      option.key === activeOption.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : active
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <OptionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {option.label}
                    </span>
                    {option.timelineEnabled ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Timeline</span>
                    ) : (
                      <span className="text-xs text-slate-400">Timeline setup needed</span>
                    )}
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
