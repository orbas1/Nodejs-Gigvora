import { Switch } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, PauseCircleIcon, PlayCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import FeedbackPulse from '../../system/FeedbackPulse.jsx';

function StatusBadge({ live }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
      <PauseCircleIcon className="h-4 w-4" aria-hidden="true" /> Maintenance
    </span>
  );
}

export default function MaintenanceStatusCard({ status, updating, onToggle, onReviewFeedback }) {
  const live = status?.enabled !== true;
  const plannedReturn = status?.estimatedResumeAt ? new Date(status.estimatedResumeAt).toLocaleString() : 'TBC';
  const hasFeedback = Boolean(status?.feedback);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <StatusBadge live={live} />
          <h2 className="text-2xl font-semibold text-slate-900">Maintenance mode orchestration</h2>
          <p className="text-sm text-slate-600">
            Toggle the global kill-switch, publish status page copy, and orchestrate downstream comms for engineering, support,
            and customers.
          </p>
          <dl className="grid gap-4 text-xs text-slate-500 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Last updated</dt>
              <dd className="mt-1 text-slate-700">
                {status?.updatedAt ? new Date(status.updatedAt).toLocaleString() : 'Moments ago'}
              </dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Planned resume</dt>
              <dd className="mt-1 text-slate-700">{plannedReturn}</dd>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <dt className="font-semibold uppercase tracking-wide text-slate-400">Impact surface</dt>
              <dd className="mt-1 text-slate-700">{status?.impactSurface || 'Platform & APIs'}</dd>
            </div>
          </dl>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-900/90 p-6 text-white md:w-80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Kill switch</p>
            {live ? <PlayCircleIcon className="h-6 w-6 text-emerald-300" aria-hidden="true" /> : <PauseCircleIcon className="h-6 w-6 text-amber-200" aria-hidden="true" />}
          </div>
          <p className="text-sm text-white/80">
            Flip the switch to immediately place the Gigvora surface into maintenance mode. We automatically broadcast this to
            status.gigvora.com, trust centre, and API clients.
          </p>
          <Switch
            checked={!live}
            onChange={(value) => onToggle?.(!value ? { enabled: false } : { enabled: true })}
            disabled={updating}
            className={`${!live ? 'bg-amber-400' : 'bg-emerald-400'} relative inline-flex h-10 w-full items-center rounded-full transition`}
          >
            <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition ${!live ? 'translate-x-[calc(100%-2.5rem)]' : 'translate-x-2'}`} />
          </Switch>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/80">
            <p className="font-semibold">Status message</p>
            <p className="mt-1 text-white/70">{status?.message || 'All systems go. No disruptions announced.'}</p>
          </div>
          {status?.requiresCisoApproval && (
            <div className="rounded-2xl border border-amber-300 bg-amber-100/20 p-4 text-xs text-amber-100">
              <p className="font-semibold">CISO approval required</p>
              <p className="mt-1">Security must sign off on disabling platform access during incident response.</p>
            </div>
          )}
          {status?.incidentReference && (
            <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-xs text-white/80">
              <p className="font-semibold">Linked incident</p>
              <p className="mt-1">{status.incidentReference}</p>
            </div>
          )}
          {!live && (
            <div className="rounded-2xl border border-amber-400/60 bg-amber-50/10 p-4 text-xs text-amber-100">
              <p className="font-semibold uppercase tracking-wide">Maintenance message</p>
              <p className="mt-1 text-white">
                {status?.broadcastCopy || 'We are performing scheduled maintenance. Access will be restored shortly.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {status?.warnings?.length ? (
        <div className="mt-6 space-y-3">
          {status.warnings.map((warning) => (
            <div
              key={warning.id || warning.message}
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700"
            >
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
              <span>{warning.message ?? warning}</span>
            </div>
          ))}
        </div>
      ) : null}
      {hasFeedback ? (
        <div className="mt-8">
          <FeedbackPulse analytics={status.feedback} onReview={onReviewFeedback} />
        </div>
      ) : null}
    </section>
  );
}

MaintenanceStatusCard.propTypes = {
  status: PropTypes.shape({
    enabled: PropTypes.bool,
    message: PropTypes.string,
    updatedAt: PropTypes.string,
    estimatedResumeAt: PropTypes.string,
    impactSurface: PropTypes.string,
    warnings: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          message: PropTypes.string,
        }),
      ]),
    ),
    broadcastCopy: PropTypes.string,
    requiresCisoApproval: PropTypes.bool,
    incidentReference: PropTypes.string,
    feedback: PropTypes.shape({}),
  }).isRequired,
  updating: PropTypes.bool,
  onToggle: PropTypes.func,
  onReviewFeedback: PropTypes.func,
};

MaintenanceStatusCard.defaultProps = {
  updating: false,
  onToggle: undefined,
  onReviewFeedback: undefined,
};
