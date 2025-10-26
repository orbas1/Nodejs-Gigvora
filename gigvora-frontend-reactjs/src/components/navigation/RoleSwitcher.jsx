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

const personaBlueprints = Object.freeze({
  default: {
    tagline: 'Tailored workspaces with analytics, approvals, and concierge support.',
    focusAreas: ['Workspace', 'Insights'],
    metrics: [
      { label: 'Licences', value: 'Included' },
      { label: 'Support', value: 'Priority chat' },
    ],
    primaryCTA: 'Switch persona',
  },
  founder: {
    tagline: 'Raise capital, hire leaders, and review investor-ready dashboards.',
    focusAreas: ['Capital', 'Community'],
    metrics: [
      { label: 'Pipeline', value: 'Active' },
      { label: 'Advisors', value: 'Synced' },
    ],
    primaryCTA: 'Review founder workspace',
  },
  agency: {
    tagline: 'Coordinate crews, retainers, and milestone billing for every client.',
    focusAreas: ['Delivery', 'Finance'],
    metrics: [
      { label: 'Clients', value: 'Portfolio' },
      { label: 'Utilisation', value: 'Live' },
    ],
    primaryCTA: 'Open agency control centre',
  },
  company: {
    tagline: 'Govern multi-team programs with hiring, finance, and compliance telemetry.',
    focusAreas: ['Hiring', 'Governance'],
    metrics: [
      { label: 'Seats', value: 'Unlimited' },
      { label: 'Insights', value: 'Executive' },
    ],
    primaryCTA: 'Navigate company HQ',
  },
  freelancer: {
    tagline: 'Showcase portfolio, respond to briefs, and manage client billing.',
    focusAreas: ['Portfolio', 'Billing'],
    metrics: [
      { label: 'Opportunities', value: 'Curated' },
      { label: 'Payments', value: 'Instant' },
    ],
    primaryCTA: 'Open freelancer studio',
  },
  headhunter: {
    tagline: 'Manage candidate pipelines, share slates, and automate status updates.',
    focusAreas: ['Pipeline', 'Analytics'],
    metrics: [
      { label: 'Talent cloud', value: 'Synced' },
      { label: 'Reporting', value: 'Live' },
    ],
    primaryCTA: 'Enter search operations',
  },
  mentor: {
    tagline: 'Host sessions, track mentee wins, and recommend strategic templates.',
    focusAreas: ['Sessions', 'Playbooks'],
    metrics: [
      { label: 'Programs', value: 'Active' },
      { label: 'Outcomes', value: 'Tracked' },
    ],
    primaryCTA: 'Visit mentor lounge',
  },
  admin: {
    tagline: 'Enforce policy, monitor telemetry, and orchestrate platform governance.',
    focusAreas: ['Security', 'Audits'],
    metrics: [
      { label: 'Controls', value: 'Delegated' },
      { label: 'Status', value: 'Realtime' },
    ],
    primaryCTA: 'Manage platform admin',
  },
});

export default function RoleSwitcher({ options, currentKey, onSelect }) {
  if (!options.length) {
    return null;
  }

  const activeOption = options.find((option) => option.key === currentKey) ?? options[0];
  const ActiveIcon = personaIcons[activeOption.key] ?? UserCircleIcon;
  const activeBlueprint = personaBlueprints[activeOption.key] ?? personaBlueprints.default;

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
                  <p className="text-xs text-slate-500">{activeBlueprint.tagline}</p>
                  <div className="flex flex-wrap gap-2">
                    {activeBlueprint.focusAreas.map((area) => (
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
                {activeBlueprint.primaryCTA}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
              {activeBlueprint.metrics.map((metric) => (
                <div key={`${activeOption.key}-${metric.label}`} className="space-y-1">
                  <dt>{metric.label}</dt>
                  <dd className="text-xs font-semibold text-slate-700">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {options.map((option) => {
            const OptionIcon = personaIcons[option.key] ?? UserCircleIcon;
            const blueprint = personaBlueprints[option.key] ?? personaBlueprints.default;
            return (
              <Menu.Item key={option.key}>
                {({ active }) => (
                  <Link
                    to={option.to}
                    onClick={onSelect}
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
                        <OptionIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className={classNames('text-sm font-semibold', option.key === activeOption.key ? 'text-white' : 'text-slate-900')}>
                          {option.label}
                        </p>
                        <p className={classNames('text-xs', option.key === activeOption.key ? 'text-slate-100/80' : 'text-slate-500')}>
                          {blueprint.tagline}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {blueprint.focusAreas.map((area) => (
                            <span
                              key={`${option.key}-${area}`}
                              className={classNames(
                                'rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em]',
                                option.key === activeOption.key
                                  ? 'bg-white/10 text-white'
                                  : 'bg-white/80 text-slate-500',
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
                          option.timelineEnabled
                            ? option.key === activeOption.key
                              ? 'bg-emerald-400/20 text-white'
                              : 'bg-emerald-100 text-emerald-700'
                            : option.key === activeOption.key
                              ? 'bg-amber-400/20 text-white'
                              : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {option.timelineEnabled ? 'Timeline live' : 'Timeline pending'}
                      </span>
                    </div>
                    <dl
                      className={classNames(
                        'grid grid-cols-2 gap-3 text-[0.65rem] uppercase tracking-[0.3em]',
                        option.key === activeOption.key ? 'text-slate-100/80' : 'text-slate-400',
                      )}
                    >
                      {blueprint.metrics.map((metric) => (
                        <div key={`${option.key}-${metric.label}`} className="space-y-1">
                          <dt>{metric.label}</dt>
                          <dd className={classNames('text-xs font-semibold', option.key === activeOption.key ? 'text-white' : 'text-slate-600')}>
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
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
