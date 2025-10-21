import PropTypes from 'prop-types';
import DataStatus from './DataStatus.jsx';
import { formatRelativeTime } from '../utils/date.js';

function PipelineRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function OpportunityBreakdown({ opportunities }) {
  const entries = Object.entries(opportunities ?? {});
  if (!entries.length) {
    return <p className="text-sm text-slate-500">No linked roles yet.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-slate-600">
      {entries.map(([type, count]) => (
        <li key={type} className="flex items-center justify-between">
          <span className="capitalize">{type}</span>
          <span className="font-semibold text-slate-900">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function OpportunityMatchesPanel({ matches, autoAssignments }) {
  const items = Array.isArray(matches) ? matches.slice(0, 4) : [];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Opportunity matches</h4>
          <p className="mt-1 text-xs text-slate-500">
            Auto-curated pairings between employer briefs and fellows based on current skills and learning goals.
          </p>
        </div>
        {autoAssignments ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Auto-assign ready: {autoAssignments}
          </span>
        ) : null}
      </div>
      {items.length ? (
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {items.map((match) => {
            const percentage = Math.round((match.bestCandidate?.score ?? 0) * 100);
            const matchedSkills = match.bestCandidate?.matchedSkills ?? [];
            const learningMatches = match.bestCandidate?.learningMatches ?? [];
            return (
              <li key={match.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{match.opportunity?.title ?? 'Experience opportunity'}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {match.targetType} • {match.bestCandidate?.name ?? 'Candidate'}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      match.autoAssigned
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {match.autoAssigned ? 'Auto-assign ready' : 'Recommended'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Match score{' '}
                  <span className="font-semibold text-slate-900">{Number.isFinite(percentage) ? `${percentage}%` : 'N/A'}</span>
                  {matchedSkills.length ? ` • Skills: ${matchedSkills.join(', ')}` : ''}
                </div>
                {learningMatches.length ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Learning goals matched: {learningMatches.join(', ')}
                  </div>
                ) : null}
                {match.opportunity?.summary ? (
                  <div className="mt-2 text-xs text-slate-500">{match.opportunity.summary}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Once companies flag jobs or projects for Launchpad, we will surface fellows who either match the required skills or
          are actively seeking to build them.
        </p>
      )}
    </div>
  );
}

export default function LaunchpadPlacementsInsights({ dashboard, loading, error, onRefresh, launchpad }) {
  const pipeline = dashboard?.pipeline ?? {};
  const placements = dashboard?.placements ?? {};
  const employerBriefs = dashboard?.employerBriefs ?? [];
  const interviews = dashboard?.upcomingInterviews ?? [];
  const matches = dashboard?.matches ?? [];
  const autoAssignments = dashboard?.totals?.autoAssignments ?? 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Programme insights</h3>
          <p className="mt-1 text-sm text-slate-600">
            Pipeline and placement telemetry to keep cohorts and employer partners on track.
          </p>
        </div>
        <DataStatus
          loading={loading}
          fromCache={false}
          lastUpdated={dashboard?.refreshedAt ? new Date(dashboard.refreshedAt) : null}
          onRefresh={() => onRefresh?.()}
        />
      </div>
      {error ? (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error.message || 'Unable to load launchpad insights right now.'}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
          <h4 className="text-sm font-semibold text-slate-900">Pipeline</h4>
          <p className="mt-1 text-xs text-slate-500">
            Tracking {dashboard?.totals?.applications ?? 0} active submissions
            {launchpad?.title ? ` for ${launchpad.title}` : ''}.
          </p>
          <div className="mt-4 space-y-2">
            <PipelineRow label="Screening" value={pipeline.screening ?? 0} />
            <PipelineRow label="Interviews" value={pipeline.interview ?? 0} />
            <PipelineRow label="Accepted" value={pipeline.accepted ?? 0} />
            <PipelineRow label="Waitlisted" value={pipeline.waitlisted ?? 0} />
            <PipelineRow label="Completed" value={pipeline.completed ?? 0} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
          <h4 className="text-sm font-semibold text-slate-900">Placements</h4>
          <p className="mt-1 text-xs text-slate-500">
            {placements.in_progress ?? 0} in play • {placements.completed ?? 0} completed • conversion{' '}
            <span className="font-semibold text-slate-900">{dashboard?.totals?.conversionRate ?? 0}%</span>
          </p>
          <div className="mt-4 space-y-2">
            <PipelineRow label="Scheduled" value={placements.scheduled ?? 0} />
            <PipelineRow label="In delivery" value={placements.in_progress ?? 0} />
            <PipelineRow label="Completed" value={placements.completed ?? 0} />
            <PipelineRow label="Cancelled" value={placements.cancelled ?? 0} />
          </div>
          <div className="mt-6">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opportunity mix</h5>
            <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 p-3">
              <OpportunityBreakdown opportunities={dashboard?.opportunities} />
            </div>
          </div>
        </div>
        <div className="space-y-4 lg:col-span-1 xl:col-span-2">
          <OpportunityMatchesPanel matches={matches} autoAssignments={autoAssignments} />
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
            <h4 className="text-sm font-semibold text-slate-900">Upcoming interviews</h4>
            {interviews.length ? (
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {interviews.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold text-slate-900">
                      {item.applicant ? `${item.applicant.firstName} ${item.applicant.lastName}` : 'Candidate'}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {item.applicant?.email ?? 'Email supplied post-confirmation'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Interview {item.interviewScheduledAt ? formatRelativeTime(item.interviewScheduledAt) : 'TBC'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No interviews scheduled yet.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
            <h4 className="text-sm font-semibold text-slate-900">Active employer briefs</h4>
            {employerBriefs.length ? (
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {employerBriefs.map((brief) => (
                  <li key={brief.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="font-semibold text-slate-900">{brief.organizationName}</div>
                    <div className="text-xs text-slate-500">
                      {brief.engagementTypes?.join(', ') || 'Flexible engagement'} • Headcount {brief.headcount ?? 'TBC'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Updated {formatRelativeTime(brief.updatedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No active briefs submitted in the last cycle.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

LaunchpadPlacementsInsights.propTypes = {
  dashboard: PropTypes.shape({
    pipeline: PropTypes.object,
    placements: PropTypes.object,
    employerBriefs: PropTypes.array,
    upcomingInterviews: PropTypes.array,
    matches: PropTypes.array,
    totals: PropTypes.shape({
      autoAssignments: PropTypes.number,
      applications: PropTypes.number,
      conversionRate: PropTypes.number,
    }),
    refreshedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    opportunities: PropTypes.object,
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRefresh: PropTypes.func,
  launchpad: PropTypes.shape({
    title: PropTypes.string,
  }),
};
