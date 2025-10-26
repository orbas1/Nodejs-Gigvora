import PropTypes from 'prop-types';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { BoltIcon, CheckCircleIcon, FireIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { classNames } from '../../utils/classNames.js';

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
};

Section.defaultProps = {
  description: null,
};

function DetailList({ items, emptyLabel }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-emerald-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

DetailList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string),
  emptyLabel: PropTypes.string,
};

DetailList.defaultProps = {
  items: [],
  emptyLabel: 'No information provided yet.',
};

function Stat({ label, value, icon: Icon, highlight }) {
  return (
    <div className={classNames('flex flex-col gap-1 rounded-2xl border p-4', highlight ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white')}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon ? <Icon className="h-4 w-4 text-accent" aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <span className="text-lg font-semibold text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  icon: PropTypes.elementType,
  highlight: PropTypes.bool,
};

Stat.defaultProps = {
  value: '—',
  icon: null,
  highlight: false,
};

function formatDate(value, fallback) {
  if (!value) return fallback;
  try {
    return format(new Date(value), 'PPP');
  } catch (error) {
    return fallback;
  }
}

export default function JobDetailPanel({
  job,
  loading,
  onBack,
  onApply,
  onToggleSave,
  onShare,
  onContact,
}) {
  if (loading) {
    return (
      <section className="flex h-full flex-col gap-4 rounded-4xl border border-slate-200 bg-white/80 p-6">
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
        <div className="flex flex-1 flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="flex h-full flex-col items-center justify-center gap-4 rounded-4xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50 p-8 text-center">
        <SparklesIcon className="h-10 w-10 text-accent" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-slate-900">Select a role to dive deeper</h2>
        <p className="max-w-md text-sm text-slate-600">
          Explore role rituals, interview expectations, compensation intelligence, and culture snapshots without leaving your marketplace flow.
        </p>
      </section>
    );
  }

  const {
    title,
    summary,
    company,
    location,
    salary,
    postedAt,
    applicationDeadline,
    applyUrl,
    matchScore,
    experienceLevel,
    workMode,
    commitment,
    pipeline,
    responsibilities,
    requirements,
    benefits,
    culture,
    tools,
    recruiter,
    metrics,
    insights,
    interviewProcess,
    about,
    mission,
    tags,
    contactEmail,
    attachments,
  } = job;

  const salaryLabel = salary
    ? (() => {
        const min = salary.min != null ? salary.min.toLocaleString() : null;
        const max = salary.max != null ? salary.max.toLocaleString() : null;
        const currency = salary.currency ?? 'USD';
        const cadence = salary.period ?? 'year';
        if (min && max) return `${currency} ${min} - ${max} / ${cadence}`;
        if (max) return `Up to ${currency} ${max} / ${cadence}`;
        if (min) return `Starting at ${currency} ${min} / ${cadence}`;
        return 'Competitive package';
      })()
    : job.compensationNote ?? 'Compensation to be shared during interview';

  const stats = [
    {
      label: 'Match score',
      value: matchScore != null ? `${Math.round(matchScore)}% alignment` : 'Calibrating',
      icon: StarIcon,
      highlight: Boolean(matchScore && matchScore >= 75),
    },
    {
      label: 'Applicants in pipeline',
      value: pipeline?.applicants ?? '—',
      icon: UserGroupIcon,
    },
    {
      label: 'Interviews this week',
      value: pipeline?.interviewing ?? metrics?.interviews ?? '—',
      icon: BoltIcon,
    },
    {
      label: 'Average recruiter response',
      value: insights?.responseTime ?? 'Under 48h',
      icon: FireIcon,
    },
  ];

  const recruiterCard = recruiter ? (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {recruiter.avatar ? (
        <img
          src={recruiter.avatar}
          alt={recruiter.name ? `${recruiter.name} avatar` : 'Recruiter avatar'}
          className="h-12 w-12 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
          {recruiter.name?.slice(0, 2) ?? 'HR'}
        </div>
      )}
      <div className="flex flex-1 flex-col text-sm text-slate-600">
        <span className="text-base font-semibold text-slate-900">{recruiter.name ?? 'Hiring partner'}</span>
        <span>{recruiter.title ?? 'Talent partner'}</span>
        {recruiter.timezone ? <span>Timezone: {recruiter.timezone}</span> : null}
        {recruiter.email ? (
          <button
            type="button"
            onClick={() => onContact?.(recruiter)}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-accent bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
            Message recruiter
          </button>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <section className="flex h-full flex-col gap-6 rounded-4xl border border-slate-200 bg-gradient-to-b from-white via-white/90 to-slate-50 p-6 shadow-xl shadow-slate-900/5">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            ) : null}
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <BuildingOffice2Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {company?.name ?? 'Confidential company'}
                </span>
                {location ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {location}
                  </span>
                ) : null}
                {workMode ? <span className="inline-flex items-center gap-2 capitalize">{workMode} work style</span> : null}
                {commitment ? <span className="inline-flex items-center gap-2 capitalize">{commitment.replace('_', ' ')}</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave?.(job)}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                job.saved
                  ? 'border-accent bg-accent text-white shadow-soft hover:bg-accentDark'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent'
              )}
            >
              <BookmarkIcon className="h-5 w-5" aria-hidden="true" />
              {job.saved ? 'Saved' : 'Save role'}
            </button>
            <button
              type="button"
              onClick={() => onShare?.(job)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5" aria-hidden="true" />
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                if (applyUrl && typeof window !== 'undefined') {
                  window.open(applyUrl, '_blank', 'noopener');
                  return;
                }
                onApply?.(job);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accentDark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              Apply now
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Posted {formatDate(postedAt, 'Recently posted')}
          </span>
          {applicationDeadline ? (
            <span className="inline-flex items-center gap-2 text-rose-500">
              <FireIcon className="h-4 w-4" aria-hidden="true" />
              Apply before {formatDate(applicationDeadline, 'deadline announced soon')}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {company?.verified ? 'Verified employer' : 'Awaiting verification'}
          </span>
          <span className="inline-flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {salaryLabel}
          </span>
        </div>
        <p className="text-sm text-slate-600">{summary ?? 'This mission-critical role powers strategic programs across the Gigvora network. Expect executive sponsorship, multi-disciplinary collaboration, and tailored success metrics within the first 90 days.'}</p>
        {tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          <Section title="Top insights" description="Understand momentum and readiness before you invest time.">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <Stat key={stat.label} {...stat} />
              ))}
            </div>
          </Section>

          <Section title="Impact you'll own" description="Responsibilities aligned to Gigvora's leadership principles.">
            <DetailList items={responsibilities} emptyLabel="Hiring team is finalizing the impact areas." />
          </Section>

          <Section title="What makes you stand out" description="Qualifications the team will actively calibrate on.">
            <DetailList items={requirements} emptyLabel="Bring your unique narrative—requirements are currently flexible." />
          </Section>

          <Section title="Benefits & culture" description="Perks, rituals, and signals that this team invests in talent.">
            <DetailList
              items={[...(benefits ?? []), ...(culture ?? [])]}
              emptyLabel="People experience team is preparing a refreshed benefits overview."
            />
          </Section>

          <Section title="Tools in play" description="Stacks and platforms you'll partner with daily.">
            <DetailList items={tools} emptyLabel="Tooling list will be shared during screening." />
          </Section>

          <Section title="Interview flow" description="Stay a step ahead with a transparent stage-by-stage journey.">
            <DetailList
              items={interviewProcess}
              emptyLabel="Talent partner will confirm interview choreography after application submission."
            />
          </Section>

          <Section title="Company pulse" description="Snapshot of mission, traction, and talent brand.">
            <div className="space-y-4 text-sm text-slate-600">
              {about ? <p>{about}</p> : null}
              {mission ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">Mission in focus</p>
                  <p className="mt-2 text-sm text-slate-700">{mission}</p>
                </div>
              ) : null}
              {company?.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accentDark"
                >
                  <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
                  Visit company site
                </a>
              ) : null}
            </div>
          </Section>

          {attachments?.length ? (
            <Section title="Resources" description="Prep with decks, product walkthroughs, and culture spotlights.">
              <ul className="space-y-3 text-sm text-slate-600">
                {attachments.map((attachment) => (
                  <li key={attachment.id ?? attachment.url} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{attachment.name ?? 'Attachment'}</span>
                      <span className="text-xs text-slate-500">{attachment.description ?? attachment.type ?? 'Supporting asset'}</span>
                    </div>
                    {attachment.url ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-accent bg-white px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                        Open
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recruiting summary</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center justify-between gap-2">
                <span>Current stage</span>
                <span className="font-semibold text-slate-900">{pipeline?.stageLabel ?? pipeline?.stage ?? 'Open pipeline'}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Target start</span>
                <span className="font-semibold text-slate-900">{formatDate(job.targetStartDate, 'Flexible')}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Team size</span>
                <span className="font-semibold text-slate-900">{insights?.teamSize ?? metrics?.teamSize ?? 'Scaling'}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Reporting into</span>
                <span className="font-semibold text-slate-900">{insights?.reportsTo ?? recruiter?.title ?? 'Leadership team'}</span>
              </li>
            </ul>
          </div>

          {recruiterCard}

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stay connected</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <p>Track follow-ups, record interview prep, and share insights with mentors inside Gigvora Workstreams.</p>
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accentDark"
                >
                  <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
                  {contactEmail}
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-accent bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <StarIcon className="h-7 w-7 text-accent" aria-hidden="true" />
              <div className="flex flex-col gap-2 text-sm text-slate-700">
                <p className="text-base font-semibold text-slate-900">Best next step</p>
                <p>Launch the smart apply drawer to tailor your narrative, attach spotlight projects, and lock in availability.</p>
                <button
                  type="button"
                  onClick={() => onApply?.(job)}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accentDark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <BoltIcon className="h-5 w-5" aria-hidden="true" />
                  Open apply drawer
                </button>
              </div>
            </div>
          </div>

          {company?.locations?.length ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Global footprint</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {company.locations.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <MapPinIcon className="mt-0.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

const CompanyShape = PropTypes.shape({
  name: PropTypes.string,
  logo: PropTypes.string,
  website: PropTypes.string,
  verified: PropTypes.bool,
  locations: PropTypes.arrayOf(PropTypes.string),
});

const RecruiterShape = PropTypes.shape({
  name: PropTypes.string,
  title: PropTypes.string,
  avatar: PropTypes.string,
  email: PropTypes.string,
  timezone: PropTypes.string,
});

const AttachmentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  description: PropTypes.string,
  type: PropTypes.string,
  url: PropTypes.string,
});

JobDetailPanel.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    summary: PropTypes.string,
    company: CompanyShape,
    location: PropTypes.string,
    salary: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      currency: PropTypes.string,
      period: PropTypes.string,
    }),
    compensationNote: PropTypes.string,
    postedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    applicationDeadline: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    targetStartDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    applyUrl: PropTypes.string,
    matchScore: PropTypes.number,
    experienceLevel: PropTypes.string,
    workMode: PropTypes.string,
    commitment: PropTypes.string,
    pipeline: PropTypes.shape({
      stage: PropTypes.string,
      stageLabel: PropTypes.string,
      applicants: PropTypes.number,
      interviewing: PropTypes.number,
    }),
    responsibilities: PropTypes.arrayOf(PropTypes.string),
    requirements: PropTypes.arrayOf(PropTypes.string),
    benefits: PropTypes.arrayOf(PropTypes.string),
    culture: PropTypes.arrayOf(PropTypes.string),
    tools: PropTypes.arrayOf(PropTypes.string),
    recruiter: RecruiterShape,
    metrics: PropTypes.shape({
      interviews: PropTypes.number,
      teamSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    insights: PropTypes.shape({
      responseTime: PropTypes.string,
      teamSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      reportsTo: PropTypes.string,
    }),
    interviewProcess: PropTypes.arrayOf(PropTypes.string),
    about: PropTypes.string,
    mission: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    contactEmail: PropTypes.string,
    attachments: PropTypes.arrayOf(AttachmentShape),
    saved: PropTypes.bool,
  }),
  loading: PropTypes.bool,
  onBack: PropTypes.func,
  onApply: PropTypes.func,
  onToggleSave: PropTypes.func,
  onShare: PropTypes.func,
  onContact: PropTypes.func,
};

JobDetailPanel.defaultProps = {
  job: null,
  loading: false,
  onBack: undefined,
  onApply: undefined,
  onToggleSave: undefined,
  onShare: undefined,
  onContact: undefined,
};
