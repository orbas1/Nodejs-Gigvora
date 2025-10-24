import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ArrowTopRightOnSquareIcon, PlayIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';
import { formatMetricNumber, formatMetricPercent } from '../../utils/metrics.js';

function CreationPreviewList({ items }) {
  if (!Array.isArray(items) || !items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5 text-sm text-indigo-700">
        Publish a draft to unlock previews in this dashboard.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id ?? item.title} className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title ?? 'Draft item'}</p>
              <p className="text-xs text-indigo-600">{item.typeLabel ?? item.type ?? 'Creation asset'}</p>
            </div>
            {item.status ? (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {item.status}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {item.updatedAt
              ? `Updated ${formatRelativeTime(item.updatedAt)}`
              : item.scheduledAt
              ? `Scheduled ${formatRelativeTime(item.scheduledAt)}`
              : 'Awaiting scheduling'}
          </p>
          {item.summary ? <p className="mt-3 text-sm text-slate-600">{item.summary}</p> : null}
        </li>
      ))}
    </ul>
  );
}

CreationPreviewList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
};

CreationPreviewList.defaultProps = {
  items: undefined,
};

function MentorshipStats({ mentorship }) {
  const stats = [
    {
      label: 'Active mentorships',
      value: formatMetricNumber(mentorship?.activePairings ?? mentorship?.activePrograms ?? 0),
    },
    {
      label: 'Mentee satisfaction',
      value:
        mentorship?.satisfaction != null
          ? formatMetricPercent(mentorship.satisfaction)
          : mentorship?.nps != null
          ? formatMetricPercent((Number(mentorship.nps) + 100) / 2)
          : '—',
    },
    {
      label: 'Upcoming sessions',
      value: formatMetricNumber(mentorship?.upcomingSessions ?? mentorship?.calendar?.upcomingCount ?? 0),
    },
    {
      label: 'Mentor bench',
      value: formatMetricNumber(mentorship?.mentorPool ?? mentorship?.mentors?.length ?? 0),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{stat.label}</p>
          <p className="mt-2 text-xl font-semibold text-emerald-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

MentorshipStats.propTypes = {
  mentorship: PropTypes.object,
};

MentorshipStats.defaultProps = {
  mentorship: null,
};

function MentorshipConnections({ mentorship }) {
  const highlights = Array.isArray(mentorship?.highlights)
    ? mentorship.highlights
    : mentorship?.recentWins ?? mentorship?.insights ?? [];

  const upcoming = Array.isArray(mentorship?.upcomingSessionsDetails)
    ? mentorship.upcomingSessionsDetails
    : mentorship?.calendar?.upcoming ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Mentorship pipeline</h3>
        <Link
          to="/dashboard/company/mentorship"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <AcademicCapIcon className="h-4 w-4" />
          Open mentorship hub
        </Link>
      </div>

      <MentorshipStats mentorship={mentorship} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Highlights</h4>
          {Array.isArray(highlights) && highlights.length ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {highlights.slice(0, 4).map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Pair mentees with mentors to surface highlights and success stories automatically.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Upcoming sessions</h4>
          {Array.isArray(upcoming) && upcoming.length ? (
            <ul className="mt-3 space-y-3 text-sm text-emerald-900">
              {upcoming.slice(0, 4).map((session) => (
                <li key={session.id ?? session.startsAt} className="rounded-xl border border-emerald-100 bg-white/70 p-3">
                  <p className="font-semibold">{session.title ?? session.topic ?? 'Mentorship session'}</p>
                  <p className="text-xs text-emerald-600">
                    {session.startsAt ? formatRelativeTime(session.startsAt) : 'Schedule upcoming sessions to see them here.'}
                  </p>
                  {session.mentor ? (
                    <p className="mt-1 text-xs text-emerald-600">Mentor: {session.mentor}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-emerald-600">
              No sessions scheduled yet. Use the mentorship hub to publish office hours or pairing programs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

MentorshipConnections.propTypes = {
  mentorship: PropTypes.object,
};

MentorshipConnections.defaultProps = {
  mentorship: null,
};

export default function CreationStudioMentorshipPanel({ creationStudio, mentorship }) {
  const previews = creationStudio?.previewItems ?? creationStudio?.recent ?? creationStudio?.spotlight ?? [];
  const mentorshipData = mentorship ?? creationStudio?.mentorship ?? null;

  return (
    <section
      id="creation-studio-previews"
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Creation studio previews</p>
              <h2 className="text-2xl font-semibold text-slate-900">Recent assets</h2>
            </div>
            <Link
              to="/dashboard/company/creation-studio"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Open studio workspace
            </Link>
          </div>

          <CreationPreviewList items={Array.isArray(previews) ? previews.slice(0, 4) : []} />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Mentorship connections</p>
              <h2 className="text-2xl font-semibold text-slate-900">Empower candidates</h2>
            </div>
            <Link
              to="/explorer/mentorships"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <PlayIcon className="h-4 w-4" />
              Browse mentors
            </Link>
          </div>

          <MentorshipConnections mentorship={mentorshipData} />
        </div>
      </div>
    </section>
  );
}

CreationStudioMentorshipPanel.propTypes = {
  creationStudio: PropTypes.object,
  mentorship: PropTypes.object,
};

CreationStudioMentorshipPanel.defaultProps = {
  creationStudio: null,
  mentorship: null,
};
