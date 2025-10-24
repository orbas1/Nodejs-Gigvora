import { useMemo } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentCheckIcon,
  CursorArrowRaysIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  HeartIcon,
  LightBulbIcon,
  MegaphoneIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { roleDashboardMapping } from '../../constants/navigation.js';

const ICON_LIBRARY = {};

function registerIcon(component, ...aliases) {
  aliases.forEach((alias) => {
    ICON_LIBRARY[alias.toLowerCase()] = component;
  });
}

registerIcon(SparklesIcon, 'sparkles', 'sparklesicon');
registerIcon(CursorArrowRaysIcon, 'cursorarrowrays', 'cursorarrowraysicon');
registerIcon(BanknotesIcon, 'banknotes', 'banknotesicon');
registerIcon(GlobeAltIcon, 'globealt', 'globealticon');
registerIcon(Squares2X2Icon, 'squares2x2', 'squares2x2icon');
registerIcon(UserGroupIcon, 'usergroup', 'usergroupicon');
registerIcon(ChartBarIcon, 'chartbar', 'chartbaricon');
registerIcon(BuildingOffice2Icon, 'buildingoffice2', 'buildingoffice2icon');
registerIcon(MegaphoneIcon, 'megaphone', 'megaphoneicon');
registerIcon(BoltIcon, 'bolt', 'bolticon');
registerIcon(ClipboardDocumentCheckIcon, 'clipboarddocumentcheck', 'clipboarddocumentcheckicon');
registerIcon(AcademicCapIcon, 'academiccap', 'academiccapicon');
registerIcon(CalendarDaysIcon, 'calendardays', 'calendardaysicon');
registerIcon(LightBulbIcon, 'lightbulb', 'lightbulbicon');
registerIcon(ChatBubbleBottomCenterTextIcon, 'chatbubblebottomcentertext', 'chatbubblebottomcentertexticon');
registerIcon(RocketLaunchIcon, 'rocketlaunch', 'rocketlaunchicon');
registerIcon(ChartBarSquareIcon, 'chartbarsquare', 'chartbarsquareicon');
registerIcon(HeartIcon, 'heart', 'hearticon');
registerIcon(HandRaisedIcon, 'handraised', 'handraisedicon');

function normaliseKey(value) {
  if (!value) return null;
  return `${value}`.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveIcon(icon, fallback) {
  if (!icon) {
    return fallback ?? SparklesIcon;
  }

  if (typeof icon === 'function') {
    return icon;
  }

  const normalised = normaliseKey(icon);
  if (normalised && ICON_LIBRARY[normalised]) {
    return ICON_LIBRARY[normalised];
  }

  return fallback ?? SparklesIcon;
}

const volunteerRoute = roleDashboardMapping.volunteer ?? '/search?category=volunteering';

const DEFAULT_PERSONA_CARDS = [
  {
    key: 'freelancer',
    title: 'Freelancers',
    description: 'Package your skills, meet dream collaborators, and keep the momentum flowing.',
    icon: SparklesIcon,
    route: roleDashboardMapping.freelancer ?? '/dashboard/freelancer',
    ctaLabel: 'Enter freelancer HQ',
    steps: [
      { label: 'Glow up your portfolio', icon: SparklesIcon },
      { label: 'Auto-match to gigs', icon: CursorArrowRaysIcon },
      { label: 'Celebrate payouts fast', icon: BanknotesIcon },
    ],
    metrics: [
      { label: 'Active missions', value: '1.8k' },
      { label: 'Avg. payout speed', value: '48 hrs' },
    ],
  },
  {
    key: 'agency',
    title: 'Agencies',
    description: 'Run your squads like clockwork with CRM views, pods, and cashflow that sings.',
    icon: GlobeAltIcon,
    route: roleDashboardMapping.agency ?? '/dashboard/agency',
    ctaLabel: 'Scale your agency ops',
    tone: 'midnight',
    steps: [
      { label: 'Publish your service pods', icon: Squares2X2Icon },
      { label: 'Spin up collab rooms', icon: UserGroupIcon },
      { label: 'Track revenue pulses', icon: ChartBarIcon },
    ],
    metrics: [
      { label: 'Pods launched', value: '320' },
      { label: 'Avg. cycle time', value: '6.5 days' },
    ],
  },
  {
    key: 'company',
    title: 'Companies',
    description: 'Brief the network, auto-build teams, and follow delivery from hello to handoff.',
    icon: BuildingOffice2Icon,
    route: roleDashboardMapping.company ?? '/dashboard/company',
    ctaLabel: 'Build your dream team',
    steps: [
      { label: 'Publish a playful brief', icon: MegaphoneIcon },
      { label: 'Auto-match experts', icon: BoltIcon },
      { label: 'Track delivery signals', icon: ClipboardDocumentCheckIcon },
    ],
    metrics: [
      { label: 'Teams assembled', value: '540' },
      { label: 'Launch success rate', value: '96%' },
    ],
  },
  {
    key: 'mentor',
    title: 'Mentors',
    description: 'Host office hours, drop wisdom nuggets, and watch mentees level up.',
    icon: AcademicCapIcon,
    route: roleDashboardMapping.mentor ?? '/dashboard/mentor',
    ctaLabel: 'Host mentor magic',
    steps: [
      { label: 'Set your office hours', icon: CalendarDaysIcon },
      { label: 'Match with seekers', icon: LightBulbIcon },
      { label: 'Share feedback loops', icon: ChatBubbleBottomCenterTextIcon },
    ],
    metrics: [
      { label: 'Sessions hosted', value: '4.3k' },
      { label: 'Avg. rating', value: '4.8/5' },
    ],
  },
  {
    key: 'launchpad',
    title: 'Launchpad leads',
    description: 'Kickstart cohorts, rally builders, and keep every sprint energised.',
    icon: RocketLaunchIcon,
    route: roleDashboardMapping.launchpad ?? '/dashboard/launchpad',
    ctaLabel: 'Launch a cohort',
    steps: [
      { label: 'Craft your cohort space', icon: SparklesIcon },
      { label: 'Invite your crew', icon: UserGroupIcon },
      { label: 'Track momentum arcs', icon: ChartBarSquareIcon },
    ],
    metrics: [
      { label: 'Cohorts active', value: '112' },
      { label: 'Avg. completion', value: '89%' },
    ],
  },
  {
    key: 'volunteer',
    title: 'Volunteers',
    description: 'Find causes, join missions, and leave every community brighter than before.',
    icon: HeartIcon,
    route: volunteerRoute,
    ctaLabel: 'Find a mission',
    steps: [
      { label: 'Spot causes you love', icon: HeartIcon },
      { label: 'Join micro-sprints', icon: HandRaisedIcon },
      { label: 'Share ripple stories', icon: SparklesIcon },
    ],
    metrics: [
      { label: 'Missions joined', value: '780' },
      { label: 'Impact hours', value: '26k' },
    ],
  },
];

function normaliseMetric(entry) {
  if (!entry) return null;

  const label = entry.label ?? entry.title ?? entry.name ?? entry.heading ?? null;
  const value = entry.value ?? entry.total ?? entry.metric ?? entry.count ?? entry.copy ?? null;

  if (!label || !value) {
    return null;
  }

  return { label, value };
}

function mergeMetrics({
  fallbackMetrics,
  overrideMetrics,
  personaKey,
  personaMetrics,
}) {
  if (Array.isArray(overrideMetrics) && overrideMetrics.length) {
    const mapped = overrideMetrics.map(normaliseMetric).filter(Boolean);
    if (mapped.length) {
      return mapped;
    }
  }

  if (Array.isArray(personaMetrics) && personaMetrics.length) {
    const mapped = personaMetrics
      .filter((metric) => {
        if (!metric) return false;
        const target = normaliseKey(metric.persona ?? metric.key ?? metric.id ?? metric.slug ?? metric.forPersona);
        return !target || target === personaKey;
      })
      .map(normaliseMetric)
      .filter(Boolean);
    if (mapped.length) {
      return mapped;
    }
  } else if (personaMetrics && typeof personaMetrics === 'object') {
    const direct = personaMetrics[personaKey] ?? personaMetrics[personaKey?.toUpperCase?.() ?? ''];
    if (direct) {
      const mapped = (Array.isArray(direct) ? direct : [direct]).map(normaliseMetric).filter(Boolean);
      if (mapped.length) {
        return mapped;
      }
    }
  }

  return Array.isArray(fallbackMetrics) ? fallbackMetrics.map(normaliseMetric).filter(Boolean) : [];
}

function mergeSteps(fallbackSteps, overrideSteps) {
  const base = Array.isArray(fallbackSteps) ? fallbackSteps : [];
  const overrides = Array.isArray(overrideSteps) ? overrideSteps : [];
  const maxLength = Math.max(base.length, overrides.length);
  const result = [];

  for (let index = 0; index < maxLength; index += 1) {
    const fallback = base[index] ?? base[base.length - 1] ?? null;
    const override = overrides[index] ?? null;

    const label = override?.label ?? override?.title ?? override?.name ?? override?.copy ?? fallback?.label;
    if (!label) {
      continue;
    }

    const fallbackIcon = fallback?.icon ?? SparklesIcon;
    const icon = resolveIcon(override?.icon, fallbackIcon);

    result.push({ label, icon });
  }

  return result;
}

function normalisePersonas(defaults, overrides, personaMetrics) {
  const overrideMap = new Map();

  if (Array.isArray(overrides)) {
    overrides.forEach((entry) => {
      const key = normaliseKey(entry?.key ?? entry?.id ?? entry?.slug ?? entry?.persona ?? entry?.name);
      if (key) {
        overrideMap.set(key, entry);
      }
    });
  } else if (overrides && typeof overrides === 'object') {
    Object.entries(overrides).forEach(([key, value]) => {
      const normalisedKey = normaliseKey(key);
      if (normalisedKey && value) {
        overrideMap.set(normalisedKey, value);
      }
    });
  }

  return defaults.map((persona) => {
    const personaKey = normaliseKey(persona.key);
    const override = personaKey ? overrideMap.get(personaKey) : null;

    const resolvedTitle = override?.title ?? override?.name ?? persona.title;
    const resolvedDescription = override?.description ?? override?.copy ?? persona.description;
    const resolvedRoute = override?.route ?? override?.href ?? override?.url ?? persona.route;
    const resolvedCta = override?.ctaLabel ?? override?.cta ?? override?.ctaText ?? persona.ctaLabel;
    const resolvedTone = override?.tone ?? override?.theme ?? persona.tone;
    const resolvedIcon = resolveIcon(override?.icon, persona.icon);
    const resolvedSteps = mergeSteps(persona.steps, override?.steps);
    const resolvedMetrics = mergeMetrics({
      fallbackMetrics: persona.metrics,
      overrideMetrics: override?.metrics,
      personaKey,
      personaMetrics,
    }).slice(0, 3);

    return {
      ...persona,
      icon: resolvedIcon,
      steps: resolvedSteps,
      metrics: resolvedMetrics,
      title: resolvedTitle,
      description: resolvedDescription,
      route: resolvedRoute,
      ctaLabel: resolvedCta,
      tone: resolvedTone,
      source: override?.source ?? persona.source ?? 'fallback',
    };
  });
}

export function PersonaJourneysSection({ loading, error, onSelectPersona, personas, personaMetrics }) {
  const disabled = loading || error;
  const displayPersonas = useMemo(
    () => normalisePersonas(DEFAULT_PERSONA_CARDS, personas, personaMetrics),
    [personas, personaMetrics],
  );

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Choose your adventure</h2>
          <p className="mt-4 text-base text-slate-600">
            Every role gets a guided runway—from matchmaking to delivery rituals—so your community keeps buzzing.
          </p>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Something went wonky while loading persona journeys. Please refresh and try again.
          </div>
        ) : null}

        <div className="mt-14">
          <div className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 pl-6 pr-10 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:pb-0 md:pl-0 md:pr-0 xl:grid-cols-3">
            {displayPersonas.map((persona) => {
              const Icon = persona.icon ?? SparklesIcon;
              const isMidnightTheme = persona.tone === 'midnight';
              const personaMetricsList = Array.isArray(persona.metrics) ? persona.metrics : [];

              return (
                <article
                  key={persona.key}
                  className={clsx(
                    'group relative flex min-h-[19rem] min-w-[18rem] flex-none snap-center flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all duration-300 ease-out md:min-h-[21rem] md:min-w-0',
                    disabled
                      ? 'pointer-events-none opacity-60'
                      : 'md:hover:-translate-y-3 md:hover:rotate-[0.6deg] md:hover:shadow-xl',
                    isMidnightTheme
                      ? 'border-slate-700 bg-slate-900/90 text-white'
                      : 'border-slate-200/80 bg-white/90 text-slate-900',
                  )}
                  aria-disabled={disabled || undefined}
                >
                  <div
                    className={clsx(
                      'pointer-events-none absolute inset-0 rounded-[1.75rem]',
                      isMidnightTheme
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'
                        : 'bg-gradient-to-br from-white via-white to-slate-50',
                    )}
                    aria-hidden="true"
                  />
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" aria-hidden="true">
                    <span className="absolute left-[-40%] top-0 h-full w-1/2 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-500 ease-out md:group-hover:translate-x-[140%] md:group-hover:opacity-100" />
                  </div>

                  <div className="relative flex flex-1 flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          'inline-flex h-12 w-12 items-center justify-center rounded-2xl',
                          isMidnightTheme ? 'bg-white/10 text-white' : 'bg-accent/10 text-accent',
                        )}
                      >
                        <Icon className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className={clsx('text-xl font-semibold', isMidnightTheme ? 'text-white' : 'text-slate-900')}>
                          {persona.title}
                        </h3>
                        <p className={clsx('text-sm', isMidnightTheme ? 'text-white/70' : 'text-slate-500')}>
                          {persona.description}
                        </p>
                      </div>
                    </div>

                    <ul className={clsx('space-y-3 text-sm', isMidnightTheme ? 'text-white/70' : 'text-slate-600')}>
                      {persona.steps.map((step) => {
                        const StepIcon = step.icon;
                        return (
                          <li
                            key={step.label}
                            className={clsx(
                              'flex items-center gap-3 rounded-2xl px-4 py-2',
                              isMidnightTheme ? 'bg-white/10 text-white/80' : 'bg-slate-50/70 text-slate-700',
                            )}
                          >
                            <StepIcon className={clsx('h-5 w-5', isMidnightTheme ? 'text-white/80' : 'text-accent')} aria-hidden="true" />
                            <span className={clsx('font-medium', isMidnightTheme ? 'text-white/90' : 'text-slate-700')}>
                              {step.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="relative mt-6 flex justify-end">
                    <Link
                      to={persona.route}
                      onClick={() => onSelectPersona?.(persona)}
                      className={clsx(
                        'inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold shadow-soft transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                        isMidnightTheme
                          ? 'border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
                          : 'border-transparent bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900',
                      )}
                    >
                      {persona.ctaLabel}
                    </Link>
                  </div>

                  {personaMetricsList.length ? (
                    <dl
                      className={clsx(
                        'relative mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2',
                        isMidnightTheme ? 'text-white/70' : 'text-slate-600',
                      )}
                      data-testid={`persona-metrics-${persona.key}`}
                    >
                      {personaMetricsList.map((metric) => (
                        <div
                          key={`${persona.key}-${metric.label}`}
                          className={clsx(
                            'rounded-2xl border px-4 py-3',
                            isMidnightTheme ? 'border-white/15 bg-white/5' : 'border-slate-200/80 bg-white/70',
                          )}
                        >
                          <dt className={clsx('text-xs font-semibold uppercase tracking-wide', isMidnightTheme ? 'text-white/60' : 'text-slate-500')}>
                            {metric.label}
                          </dt>
                          <dd className={clsx('mt-1 text-lg font-semibold', isMidnightTheme ? 'text-white' : 'text-slate-900')}>
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
