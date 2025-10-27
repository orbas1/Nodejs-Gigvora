import { Fragment, useCallback, useMemo } from 'react';
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
import { classNames } from '../../utils/classNames.js';
import { useNavigationChrome } from '../../context/NavigationChromeContext.jsx';

const personaIcons = Object.freeze({
  user: UserCircleIcon,
  freelancer: SparklesIcon,
  agency: BuildingOffice2Icon,
  company: BriefcaseIcon,
  headhunter: MagnifyingGlassCircleIcon,
  mentor: AcademicCapIcon,
  admin: ShieldCheckIcon,
  founder: SparklesIcon,
});

const iconAliases = Object.freeze({
  'user-circle': UserCircleIcon,
  sparkles: SparklesIcon,
  'building-office': BuildingOffice2Icon,
  briefcase: BriefcaseIcon,
  'magnifying-glass-circle': MagnifyingGlassCircleIcon,
  'academic-cap': AcademicCapIcon,
  'shield-check': ShieldCheckIcon,
  'rocket-launch': RocketLaunchIcon,
});

const FALLBACK_BLUEPRINT = Object.freeze({
  tagline: 'Tailored workspaces with analytics, approvals, and concierge support.',
  focusAreas: ['Workspace', 'Insights'],
  metrics: [
    { label: 'Licences', value: 'Included' },
    { label: 'Support', value: 'Priority chat' },
  ],
  primaryCta: 'Switch persona',
  defaultRoute: '/',
  timelineEnabled: true,
  metadata: { journey: 'workspace' },
});

function resolveIcon(key, iconKey) {
  return personaIcons[key] ?? iconAliases[iconKey] ?? UserCircleIcon;
}

export default function RoleSwitcher({ options, currentKey, onSelect }) {
  const { personas } = useNavigationChrome();
  const personaMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(personas)) {
      personas.forEach((persona) => {
        if (persona?.key) {
          map.set(persona.key, persona);
        }
      });
    }
    return map;
  }, [personas]);

  if (!options.length) {
    return null;
  }

  const enhancedOptions = useMemo(() => {
    return options.map((option) => {
      const blueprint = personaMap.get(option.key) ?? FALLBACK_BLUEPRINT;
      const focusAreas = Array.isArray(blueprint.focusAreas)
        ? blueprint.focusAreas
        : FALLBACK_BLUEPRINT.focusAreas;
      const metrics = Array.isArray(blueprint.metrics) ? blueprint.metrics : FALLBACK_BLUEPRINT.metrics;
      const primaryCta = blueprint.primaryCta ?? FALLBACK_BLUEPRINT.primaryCta;
      const timelineActive = option.timelineEnabled ?? blueprint.timelineEnabled ?? false;
      const destination = option.to ?? blueprint.defaultRoute ?? '#';
      const journey = option.metadata?.journey ?? blueprint.metadata?.journey ?? null;
      const iconKey = option.icon ?? blueprint.icon ?? null;

      return {
        ...option,
        blueprint,
        focusAreas,
        metrics,
        primaryCta,
        timelineActive,
        destination,
        journey,
        Icon: resolveIcon(option.key, iconKey),
      };
    });
  }, [options, personaMap]);

  if (!enhancedOptions.length) {
    return null;
  }

  const activeOption = enhancedOptions.find((entry) => entry.key === currentKey) ?? enhancedOptions[0];
  const { Icon: ActiveIcon, focusAreas: activeFocusAreas, metrics: activeMetrics, primaryCta: activePrimaryCta } = activeOption;
  const activeBlueprint = activeOption.blueprint ?? FALLBACK_BLUEPRINT;

  const handleSelect = useCallback(
    (option) => (event) => {
      onSelect?.(option, event);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('gigvora:persona-switch', {
            detail: {
              key: option.key,
              label: option.label,
              journey: option.journey,
              timelineEnabled: option.timelineActive,
              destination: option.destination,
            },
          }),
        );
      }
    },
    [onSelect],
  );

  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label={`Switch persona – ${activeOption.label}`}
      >
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
        <Menu.Items className="absolute right-0 z-50 mt-2 w-[22rem] origin-top-right space-y-3 rounded-3xl border border-slate-200/70 bg-white p-4 text-sm shadow-xl focus:outline-none">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Current persona</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">
                  <ActiveIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{activeOption.label}</p>
                  <p className="text-xs text-slate-500">{activeBlueprint.tagline ?? FALLBACK_BLUEPRINT.tagline}</p>
                  <div className="flex flex-wrap gap-2">
                    {activeFocusAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white">
                {activePrimaryCta}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
              {activeMetrics.map((metric) => (
                <div key={`${activeOption.key}-${metric.label}`} className="space-y-1">
                  <dt>{metric.label}</dt>
                  <dd className="text-xs font-semibold text-slate-700">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {enhancedOptions.map((option) => {
            return (
              <Menu.Item key={option.key}>
                {({ active }) => (
                  <Link
                    to={option.destination}
                    onClick={handleSelect(option)}
                    aria-current={option.key === activeOption.key ? 'true' : undefined}
                    data-persona-key={option.key}
                    data-persona-journey={option.journey ?? undefined}
                    className={classNames(
                      'flex flex-col gap-3 rounded-2xl border border-transparent px-3 py-3 transition',
                      option.key === activeOption.key
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : active
                          ? 'border-slate-200 bg-slate-50 text-slate-900'
                          : 'text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-900/90 text-white">
                        <option.Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className={classNames('text-sm font-semibold', option.key === activeOption.key ? 'text-white' : 'text-slate-900')}>
                          {option.label}
                        </p>
                        <p className={classNames('text-xs', option.key === activeOption.key ? 'text-slate-100/80' : 'text-slate-500')}>
                          {option.blueprint?.tagline ?? FALLBACK_BLUEPRINT.tagline}
                        </p>
                        {option.journey ? (
                          <span className={classNames('inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em]', option.key === activeOption.key ? 'bg-white/10 text-white' : 'bg-white/80 text-slate-500')}>
                            {option.journey}
                          </span>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {option.focusAreas.map((area) => (
                            <span
                              key={`${option.key}-${area}`}
                              className={classNames(
                                'rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em]',
                                option.key === activeOption.key ? 'bg-white/10 text-white' : 'bg-white/80 text-slate-500',
                              )}
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span
                        className={classNames(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.35em]',
                          option.timelineActive
                            ? option.key === activeOption.key
                              ? 'bg-emerald-400/20 text-white'
                              : 'bg-emerald-100 text-emerald-700'
                            : option.key === activeOption.key
                              ? 'bg-amber-400/20 text-white'
                              : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {option.timelineActive ? 'Timeline live' : 'Timeline pending'}
                      </span>
                    </div>
                    <dl
                      className={classNames(
                        'grid grid-cols-2 gap-3 text-[0.65rem] uppercase tracking-[0.3em]',
                        option.key === activeOption.key ? 'text-slate-100/80' : 'text-slate-400',
                      )}
                    >
                      {option.metrics.map((metric) => (
                        <div key={`${option.key}-${metric.label}`} className="space-y-1">
                          <dt>{metric.label}</dt>
                          <dd className={classNames('text-xs font-semibold', option.key === activeOption.key ? 'text-white' : 'text-slate-600')}>
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {option.primaryCta}
                    </span>
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
      to: PropTypes.string,
      timelineEnabled: PropTypes.bool,
      icon: PropTypes.string,
      metadata: PropTypes.shape({
        journey: PropTypes.string,
      }),
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
