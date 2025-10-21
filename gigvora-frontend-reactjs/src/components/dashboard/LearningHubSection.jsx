import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import DataStatus from '../DataStatus.jsx';

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold text-slate-900">{value ?? '—'}</dd>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  helper: PropTypes.string,
};

StatCard.defaultProps = {
  value: undefined,
  helper: undefined,
};

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
  return (
    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

ProgressBar.defaultProps = {
  value: 0,
};

function CourseCard({ course }) {
  const enrollment = course.enrollment;
  const modules = Array.isArray(course.modules) ? course.modules : [];
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-lg font-semibold text-slate-900">{course.title}</h4>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              {course.difficulty}
            </span>
          </div>
          {course.summary ? <p className="text-sm text-slate-600">{course.summary}</p> : null}
          {course.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {enrollment ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="flex items-center justify-between text-sm font-semibold text-blue-700">
              <span>In progress</span>
              <span>{Math.round(enrollment.progress ?? 0)}%</span>
            </p>
            <ProgressBar value={enrollment.progress ?? 0} />
            <p className="mt-2 text-xs text-blue-600">{enrollment.status === 'completed' ? 'Completed' : 'Active'} • Last accessed {enrollment.lastAccessedAt ? new Date(enrollment.lastAccessedAt).toLocaleDateString() : 'recently'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            <p>Not yet enrolled. Review modules and upcoming mentoring slots to plan your learning sprint.</p>
          </div>
        )}
        {modules.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modules</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {modules.slice(0, 4).map((module) => (
                <li key={module.id} className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-blue-400" />
                  <span>
                    {module.title}
                    {module.durationMinutes ? (
                      <span className="ml-2 text-xs text-slate-400">{module.durationMinutes} min</span>
                    ) : null}
                  </span>
                </li>
              ))}
              {modules.length > 4 ? (
                <li className="text-xs uppercase tracking-wide text-slate-400">+{modules.length - 4} more modules</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    summary: PropTypes.string,
    difficulty: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    modules: PropTypes.array,
    enrollment: PropTypes.shape({
      progress: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      status: PropTypes.string,
      lastAccessedAt: PropTypes.string,
    }),
  }).isRequired,
};

function MentoringList({ sessions }) {
  if (!sessions?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ClockIcon className="h-4 w-4 text-blue-500" /> Upcoming & recent mentoring
      </p>
      <ul className="mt-3 space-y-3">
        {sessions.map((session) => {
          const scheduled = session.scheduledAt ? new Date(session.scheduledAt) : null;
          const formattedDate = scheduled ? scheduled.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBA';
          return (
            <li key={session.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-semibold text-slate-700">{session.topic}</span>
                <span className="text-xs uppercase tracking-wide text-blue-500">{session.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{formattedDate} • Mentor: {session.mentor ? `${session.mentor.firstName} ${session.mentor.lastName}` : 'TBA'}</p>
              {session.agenda ? <p className="mt-2 text-xs text-slate-500">Agenda: {session.agenda}</p> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

MentoringList.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      topic: PropTypes.string,
      scheduledAt: PropTypes.string,
      status: PropTypes.string,
      agenda: PropTypes.string,
      mentor: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
    }),
  ),
};

MentoringList.defaultProps = {
  sessions: undefined,
};

function DiagnosticsList({ diagnostics }) {
  if (!diagnostics?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ChartBarIcon className="h-4 w-4 text-blue-500" /> Skill gap diagnostics
      </p>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {diagnostics.map((diagnostic) => (
          <li key={diagnostic.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            {diagnostic.summary ? <p className="font-semibold text-slate-700">{diagnostic.summary}</p> : null}
            {diagnostic.strengths?.length ? (
              <p className="mt-2 text-xs text-emerald-600">Strengths: {diagnostic.strengths.join(', ')}</p>
            ) : null}
            {diagnostic.gaps?.length ? (
              <p className="mt-1 text-xs text-amber-600">Focus: {diagnostic.gaps.join(', ')}</p>
            ) : null}
            {diagnostic.recommendedActions?.length ? (
              <p className="mt-1 text-xs text-slate-500">Next actions: {diagnostic.recommendedActions.join(', ')}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

DiagnosticsList.propTypes = {
  diagnostics: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      summary: PropTypes.string,
      strengths: PropTypes.arrayOf(PropTypes.string),
      gaps: PropTypes.arrayOf(PropTypes.string),
      recommendedActions: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
};

DiagnosticsList.defaultProps = {
  diagnostics: undefined,
};

function RecommendationsList({ recommendations }) {
  if (!recommendations?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <SparklesIcon className="h-4 w-4 text-blue-500" /> AI service recommendations
      </p>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {recommendations.map((recommendation) => (
          <li key={recommendation.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-700">{recommendation.title}</p>
              {recommendation.confidenceScore != null ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  Confidence {Math.round(recommendation.confidenceScore)}%
                </span>
              ) : null}
            </div>
            {recommendation.description ? <p className="mt-1 text-xs text-slate-500">{recommendation.description}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

RecommendationsList.propTypes = {
  recommendations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      confidenceScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
};

RecommendationsList.defaultProps = {
  recommendations: undefined,
};

function CertificationsList({ certifications }) {
  if (!certifications?.length) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <CheckBadgeIcon className="h-4 w-4 text-blue-500" /> Certifications
      </p>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {certifications.map((certification) => (
          <li key={certification.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-700">{certification.name}</p>
                {certification.issuingOrganization ? (
                  <p className="text-xs text-slate-500">{certification.issuingOrganization}</p>
                ) : null}
              </div>
              {certification.expirationDate ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                  Expires {new Date(certification.expirationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

CertificationsList.propTypes = {
  certifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      issuingOrganization: PropTypes.string,
      expirationDate: PropTypes.string,
    }),
  ),
};

CertificationsList.defaultProps = {
  certifications: undefined,
};

export default function LearningHubSection({
  data,
  isLoading,
  error,
  fromCache,
  onRefresh,
  summaryCards,
  upcomingRenewal,
}) {
  const serviceLines = data?.serviceLines ?? [];
  const recommendations = data?.recommendations ?? [];
  const hasContent = serviceLines.length > 0 || recommendations.length > 0;

  return (
    <section id="learning-hub" className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_45px_-28px_rgba(30,64,175,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Capability growth</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Learning and certification hub</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Access curated learning paths, peer mentoring, diagnostics, and certification management tied to the service
              lines that power your Gigvora storefront.
            </p>
          </div>
          <DataStatus
            loading={isLoading}
            fromCache={fromCache}
            lastUpdated={data?.generatedAt}
            onRefresh={onRefresh}
          />
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">We could not refresh your learning data.</p>
            <p className="mt-1 text-rose-600/80">{error.message || 'Please try again in a few moments.'}</p>
          </div>
        ) : null}
        {summaryCards?.length ? (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </dl>
        ) : null}
        {upcomingRenewal ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-6 w-6" />
              <div>
                <p className="font-semibold">{upcomingRenewal.name}</p>
                <p className="text-xs text-amber-600/80">
                  {upcomingRenewal.organization ? `${upcomingRenewal.organization} • ` : ''}
                  {upcomingRenewal.formattedDate ? `renew by ${upcomingRenewal.formattedDate}` : 'renewal due soon'}
                </p>
              </div>
            </div>
            {upcomingRenewal.daysRemaining != null ? (
              <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                {upcomingRenewal.daysRemaining} days remaining
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasContent ? null : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          <AcademicCapIcon className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-lg font-semibold text-slate-700">No learning activity yet</p>
          <p className="mt-1 text-sm text-slate-500">As you enroll in courses and log diagnostics, we will orchestrate personalised recommendations here.</p>
        </div>
      )}

      {serviceLines.map((line) => {
        const stats = line.stats ?? {
          total: 0,
          completed: 0,
          inProgress: 0,
          mentoringScheduled: 0,
          certifications: 0,
          completionRate: 0,
        };
        return (
        <article
          key={line.id ?? line.slug}
          id={`learning-hub-${line.slug ?? 'general'}`}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-28px_rgba(30,64,175,0.35)] sm:p-8"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">{line.name}</h3>
              {line.description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{line.description}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {stats.inProgress} in progress
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {stats.completed} completed
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  {stats.mentoringScheduled} mentoring
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {stats.certifications} certifications
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
              <p className="font-semibold uppercase tracking-wide">Learning completion</p>
              <p className="mt-1 text-lg font-semibold">{stats.completionRate}%</p>
              <p className="mt-1 text-blue-600/80">{stats.total} total courses tracked</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {line.courses?.length ? line.courses.map((course) => <CourseCard key={course.id} course={course} />) : null}
            <MentoringList sessions={line.mentoringSessions} />
            <DiagnosticsList diagnostics={line.diagnostics} />
            <CertificationsList certifications={line.certifications} />
            <RecommendationsList recommendations={line.recommendations} />
          </div>
        </article>
        );
      })}

      {recommendations.length > 0 && serviceLines.length === 0 ? (
        <RecommendationsList recommendations={recommendations} />
      ) : null}
    </section>
  );
}

LearningHubSection.propTypes = {
  data: PropTypes.shape({
    generatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    serviceLines: PropTypes.array,
    recommendations: PropTypes.array,
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  fromCache: PropTypes.bool,
  onRefresh: PropTypes.func,
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      helper: PropTypes.string,
    }),
  ),
  upcomingRenewal: PropTypes.shape({
    name: PropTypes.string,
    organization: PropTypes.string,
    formattedDate: PropTypes.string,
    daysRemaining: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};

LearningHubSection.defaultProps = {
  data: undefined,
  isLoading: false,
  error: undefined,
  fromCache: false,
  onRefresh: undefined,
  summaryCards: undefined,
  upcomingRenewal: undefined,
};
