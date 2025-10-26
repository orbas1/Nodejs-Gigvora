import PropTypes from 'prop-types';
import { ShieldCheckIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../components/DataStatus.jsx';
import useIdentityVerification from '../../hooks/useIdentityVerification.js';
import IdentityVerificationSection from '../identityVerification/IdentityVerificationSection.jsx';
import { formatDateLabel } from '../../utils/date.js';

function StatusPill({ status }) {
  const tones = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    in_review: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-rose-50 text-rose-600 border-rose-200',
    pending: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  const tone = tones[status] ?? tones.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
      <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
      {status?.replace(/_/g, ' ') ?? 'pending'}
    </span>
  );
}

StatusPill.propTypes = {
  status: PropTypes.string,
};

function RequirementList({ requirements }) {
  if (!requirements) {
    return null;
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review SLA</dt>
        <dd className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          {requirements.reviewSlaHours ?? 48} hours
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accepted ID types</dt>
        <dd className="mt-1 text-sm text-slate-700">{requirements.acceptedIdTypes?.join(', ') ?? 'Government-issued ID'}</dd>
      </div>
    </dl>
  );
}

RequirementList.propTypes = {
  requirements: PropTypes.shape({
    reviewSlaHours: PropTypes.number,
    acceptedIdTypes: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default function IdentityVerificationFlow({ userId, profileId }) {
  const identityResource = useIdentityVerification({ userId, profileId });
  const { data, loading, error, refresh } = identityResource;

  const current = data?.current ?? {};
  const nextActions = data?.nextActions ?? [];
  const history = data?.history ?? [];

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Identity verification</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Keep your compliance profile review-ready</h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload government-issued identification, capture biometrics, and review audit history to maintain a verified status
            for payouts and sensitive workflows.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <StatusPill status={current.status} />
          {current.lastUpdated ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Updated {formatDateLabel(current.lastUpdated, { includeTime: true })}
            </div>
          ) : null}
        </div>
      </header>

      <RequirementList requirements={data?.requirements} />

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={data?.lastUpdated}
        onRefresh={refresh}
        statusLabel="Verification data"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <IdentityVerificationSection identityResource={identityResource} />
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Next actions</h3>
              {nextActions.length ? (
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {nextActions.map((action) => (
                    <li key={action.code} className="rounded-lg bg-white px-3 py-2 shadow-inner">
                      <p className="font-medium text-slate-700">{action.title}</p>
                      {action.description ? <p className="text-xs text-slate-500">{action.description}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">You&apos;re all set—no pending actions.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Recent history</h3>
              {history.length ? (
                <ol className="mt-2 space-y-2 text-xs text-slate-600">
                  {history.slice(0, 5).map((event) => (
                    <li key={event.id} className="rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{event.status}</span>
                        {event.updatedAt ? <span>{formatDateLabel(event.updatedAt, { includeTime: true })}</span> : null}
                      </div>
                      {event.reviewNotes ? <p className="mt-1 text-slate-500">{event.reviewNotes}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No historical submissions yet.</p>
              )}
            </div>
          </aside>
        </div>
      </DataStatus>
    </section>
  );
}

IdentityVerificationFlow.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  profileId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
