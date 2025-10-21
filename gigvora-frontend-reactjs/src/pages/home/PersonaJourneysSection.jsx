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

const volunteerRoute = roleDashboardMapping.volunteer ?? '/search?category=volunteering';

const personaCards = [
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
  },
  {
    key: 'agency',
    title: 'Agencies',
    description: 'Run your squads like clockwork with CRM views, pods, and cashflow that sings.',
    icon: GlobeAltIcon,
    route: roleDashboardMapping.agency ?? '/dashboard/agency',
    ctaLabel: 'Scale your agency ops',
    steps: [
      { label: 'Publish your service pods', icon: Squares2X2Icon },
      { label: 'Spin up collab rooms', icon: UserGroupIcon },
      { label: 'Track revenue pulses', icon: ChartBarIcon },
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
  },
];

export function PersonaJourneysSection({ loading, error, onSelectPersona }) {
  const disabled = loading || error;

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
            {personaCards.map((persona) => {
              const Icon = persona.icon;

              return (
                <article
                  key={persona.key}
                  className={clsx(
                    'group relative flex min-h-[19rem] min-w-[18rem] flex-none snap-center flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition-all duration-300 ease-out md:min-h-[21rem] md:min-w-0',
                    disabled
                      ? 'pointer-events-none opacity-60'
                      : 'md:hover:-translate-y-3 md:hover:rotate-[0.6deg] md:hover:shadow-xl',
                  )}
                  aria-disabled={disabled || undefined}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-white via-white to-slate-50" aria-hidden="true" />
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" aria-hidden="true">
                    <span className="absolute left-[-40%] top-0 h-full w-1/2 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-all duration-500 ease-out md:group-hover:translate-x-[140%] md:group-hover:opacity-100" />
                  </div>

                  <div className="relative flex flex-1 flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <Icon className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{persona.title}</h3>
                        <p className="text-sm text-slate-500">{persona.description}</p>
                      </div>
                    </div>

                    <ul className="space-y-3 text-sm text-slate-600">
                      {persona.steps.map((step) => {
                        const StepIcon = step.icon;
                        return (
                          <li key={step.label} className="flex items-center gap-3 rounded-2xl bg-slate-50/70 px-4 py-2">
                            <StepIcon className="h-5 w-5 text-accent" aria-hidden="true" />
                            <span className="font-medium text-slate-700">{step.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="relative mt-6 flex justify-end">
                    <Link
                      to={persona.route}
                      onClick={() => onSelectPersona?.(persona)}
                      className="inline-flex items-center justify-center rounded-full border border-transparent bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition-colors duration-200 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      {persona.ctaLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
