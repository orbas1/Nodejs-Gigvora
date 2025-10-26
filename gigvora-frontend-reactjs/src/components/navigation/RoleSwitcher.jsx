import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
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
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../services/analytics.js';
import { classNames } from '../../utils/classNames.js';

const personaIcons = Object.freeze({
  user: UserCircleIcon,
  freelancer: SparklesIcon,
  agency: BuildingOffice2Icon,
  company: BriefcaseIcon,
  headhunter: MagnifyingGlassCircleIcon,
  mentor: AcademicCapIcon,
  admin: ShieldCheckIcon,
  launchpad: RocketLaunchIcon,
});

const ACCENT_STYLES = Object.freeze({
  accent: {
    badge: 'bg-accent/10 text-accent',
    border: 'border-accent/20',
    icon: 'text-accent',
  },
  sky: {
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-sky-200/70',
    icon: 'text-sky-500',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200/70',
    icon: 'text-violet-500',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200/70',
    icon: 'text-amber-500',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200/70',
    icon: 'text-emerald-500',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-rose-200/70',
    icon: 'text-rose-500',
  },
  indigo: {
    badge: 'bg-indigo-100 text-indigo-600',
    border: 'border-indigo-200/70',
    icon: 'text-indigo-500',
  },
  slate: {
    badge: 'bg-slate-200 text-slate-700',
    border: 'border-slate-300/70',
    icon: 'text-slate-500',
  },
});

export default function RoleSwitcher({ options, currentKey, onSelect }) {
  if (!options.length) {
    return null;
  }

  const activeOption = options.find((option) => option.key === currentKey) ?? options[0];
  const ActiveIcon = personaIcons[activeOption.key] ?? UserCircleIcon;
  const [announcement, setAnnouncement] = useState('');
  const liveRegionRef = useRef(null);

  const accentTone = useMemo(() => ACCENT_STYLES[activeOption.accent] ?? ACCENT_STYLES.accent, [activeOption.accent]);

  const handleSelect = (option) => {
    analytics.track('navigation.role.changed', {
      role: option.key,
      previousRole: activeOption.key,
      timelineEnabled: option.timelineEnabled,
    });
    setAnnouncement(`${option.label} workspace activated`);
    onSelect?.();
  };

  useEffect(() => {
    if (!announcement || !liveRegionRef.current) {
      return;
    }
    const region = liveRegionRef.current;
    region.textContent = announcement;
    const timeout = window.setTimeout(() => {
      region.textContent = '';
      setAnnouncement('');
    }, 1800);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [announcement]);

  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        <span className={classNames('flex items-center gap-2', accentTone.icon)}>
          <ArrowsRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="flex flex-col text-left normal-case tracking-normal">
          <span className="text-[0.7rem] uppercase tracking-[0.35em] text-slate-400">Active workspace</span>
          <span className="text-sm font-semibold text-slate-700">{activeOption.label}</span>
        </span>
        <span
          className={classNames(
            'ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-600',
            accentTone.badge,
          )}
        >
          {activeOption.status ?? 'Operational'}
        </span>
      </Menu.Button>
      <span ref={liveRegionRef} aria-live="polite" className="sr-only" />
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-[26rem] max-w-[calc(100vw-1.5rem)] origin-top-right space-y-3 rounded-3xl border border-slate-200/70 bg-white/95 p-4 text-sm shadow-2xl backdrop-blur focus:outline-none">
          <div className="rounded-2xl bg-slate-900/95 px-4 py-4 text-slate-100 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Switch workspace</p>
            <p className="mt-2 text-sm leading-5 text-slate-100">{activeOption.highlight}</p>
          </div>
          {options.map((option) => {
            const OptionIcon = personaIcons[option.key] ?? UserCircleIcon;
            const optionTone = ACCENT_STYLES[option.accent] ?? ACCENT_STYLES.accent;
            return (
              <RoleSwitcherItem
                key={option.key}
                option={option}
                optionTone={optionTone}
                isActive={option.key === activeOption.key}
                onSelect={handleSelect}
                OptionIcon={OptionIcon}
              />
            );
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function RoleSwitcherItem({ option, optionTone, isActive, onSelect, OptionIcon }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <Link
          to={option.to}
          onClick={() => onSelect(option)}
          className={classNames(
            'flex flex-col gap-3 rounded-3xl border px-4 py-4 transition',
            isActive
              ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
              : active
                ? 'border-slate-200 bg-slate-100 text-slate-900'
                : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            optionTone.border,
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={classNames(
                'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500',
                optionTone.icon,
                isActive && 'bg-white/10 text-white',
              )}
            >
              <OptionIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold text-current">{option.label}</span>
              <span className={classNames('text-xs leading-5', isActive ? 'text-slate-200' : 'text-slate-500')}>
                {option.description}
              </span>
            </div>
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em]',
                optionTone.badge,
                isActive && 'bg-white/15 text-white',
              )}
            >
              {option.status ?? 'Operational'}
            </span>
          </div>
          <p className={classNames('text-xs leading-5', isActive ? 'text-slate-100' : 'text-slate-500')}>
            {option.highlight ?? option.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em]">
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1',
                isActive ? 'border-white/20 bg-white/5 text-white' : 'border-slate-200 text-slate-500',
              )}
            >
              {option.metricLabel ?? 'Key metric'}
              <span
                className={classNames(
                  'text-xs font-bold normal-case',
                  isActive ? 'text-white' : 'text-slate-900',
                )}
              >
                {option.metricValue ?? 'Live'}
              </span>
            </span>
            <span
              className={classNames(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-slate-500',
                option.timelineEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
                isActive && (option.timelineEnabled ? 'bg-emerald-500/10 text-white' : 'bg-amber-400/20 text-white'),
              )}
            >
              {option.timelineEnabled ? 'Timeline live' : 'Timeline setup needed'}
            </span>
          </div>
        </Link>
      )}
    </Menu.Item>
  );
}

RoleSwitcherItem.propTypes = {
  option: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    timelineEnabled: PropTypes.bool,
    description: PropTypes.string,
    highlight: PropTypes.string,
    metricLabel: PropTypes.string,
    metricValue: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  optionTone: PropTypes.shape({
    badge: PropTypes.string,
    border: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  OptionIcon: PropTypes.elementType.isRequired,
};

RoleSwitcher.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      timelineEnabled: PropTypes.bool,
      description: PropTypes.string,
      highlight: PropTypes.string,
      metricLabel: PropTypes.string,
      metricValue: PropTypes.string,
      status: PropTypes.string,
      accent: PropTypes.string,
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
