import { ClockIcon, SignalIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available now' },
  { value: 'limited', label: 'Limited capacity' },
  { value: 'unavailable', label: 'Currently unavailable' },
  { value: 'on_leave', label: 'On leave' },
];

export default function ProfileAvailabilityCard({
  availabilityDraft,
  onAvailabilityChange,
  canEdit,
  lastUpdatedAt,
}) {
  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Availability</h3>
        <SignalIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={availabilityDraft.status}
            onChange={(event) => onAvailabilityChange('status', event.target.value)}
            disabled={!canEdit}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClockIcon className="h-4 w-4" aria-hidden="true" /> Hours per week
          </span>
          <input
            type="number"
            min="0"
            max="168"
            value={availabilityDraft.hoursPerWeek}
            onChange={(event) => onAvailabilityChange('hoursPerWeek', event.target.value)}
            disabled={!canEdit}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote friendly</span>
          <select
            value={availabilityDraft.openToRemote ? 'true' : 'false'}
            onChange={(event) => onAvailabilityChange('openToRemote', event.target.value === 'true')}
            disabled={!canEdit}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="true">Open to remote and hybrid roles</option>
            <option value="false">Prefer on-site engagements</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Working timezone</span>
          <input
            type="text"
            value={availabilityDraft.timezone}
            onChange={(event) => onAvailabilityChange('timezone', event.target.value)}
            placeholder="e.g. Europe/London"
            disabled={!canEdit}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes for collaborators</span>
        <textarea
          rows={3}
          value={availabilityDraft.notes}
          onChange={(event) => onAvailabilityChange('notes', event.target.value)}
          disabled={!canEdit}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Travel plans, onboarding lead times, or preferred project cadence"
        />
      </label>

      <p className="text-xs text-slate-500">{lastUpdatedAt ? `Last updated ${lastUpdatedAt}.` : 'Share your current capacity.'}</p>
    </section>
  );
}

ProfileAvailabilityCard.propTypes = {
  availabilityDraft: PropTypes.shape({
    status: PropTypes.string,
    hoursPerWeek: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    openToRemote: PropTypes.bool,
    notes: PropTypes.string,
    timezone: PropTypes.string,
  }).isRequired,
  onAvailabilityChange: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  lastUpdatedAt: PropTypes.string,
};

ProfileAvailabilityCard.defaultProps = {
  canEdit: false,
  lastUpdatedAt: undefined,
};
