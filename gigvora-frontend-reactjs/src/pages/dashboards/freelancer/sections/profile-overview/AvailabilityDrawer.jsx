import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Open' },
  { value: 'limited', label: 'Limited' },
  { value: 'unavailable', label: 'Away' },
  { value: 'on_leave', label: 'Leave' },
];

function buildDraft(availability = {}, hourlyRate) {
  return {
    status: availability.status || 'limited',
    hoursPerWeek: availability.hoursPerWeek != null ? String(availability.hoursPerWeek) : '',
    openToRemote: Boolean(availability.openToRemote ?? true),
    notes: availability.notes || '',
    hourlyRate: hourlyRate != null ? String(hourlyRate) : '',
  };
}

export default function AvailabilityDrawer({ open, availability, hourlyRate, onClose, onSave, saving }) {
  const [draft, setDraft] = useState(buildDraft(availability, hourlyRate));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(availability, hourlyRate));
      setError(null);
    }
  }, [open, availability, hourlyRate]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    const hours = draft.hoursPerWeek === '' ? null : Number(draft.hoursPerWeek);
    if (hours != null && (Number.isNaN(hours) || hours < 0 || hours > 80)) {
      setError('Hours per week must be between 0 and 80.');
      return;
    }
    const rate = draft.hourlyRate === '' ? null : Number(draft.hourlyRate);
    if (rate != null && (Number.isNaN(rate) || rate < 0)) {
      setError('Hourly rate must be a positive number.');
      return;
    }
    await onSave({
      availabilityStatus: draft.status,
      hoursPerWeek: hours,
      openToRemote: Boolean(draft.openToRemote),
      availabilityNotes: draft.notes?.trim() || null,
      hourlyRate: rate,
    });
  };

  const disableClose = saving;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={disableClose ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Availability</Dialog.Title>
                  </div>
                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 text-sm text-slate-700">
                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                      <select
                        value={draft.status}
                        onChange={handleChange('status')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Hours per week</span>
                      <input
                        type="number"
                        min="0"
                        max="80"
                        value={draft.hoursPerWeek}
                        onChange={handleChange('hoursPerWeek')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.openToRemote}
                        onChange={handleChange('openToRemote')}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      Remote ready
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Hourly rate</span>
                      <input
                        type="number"
                        min="0"
                        value={draft.hourlyRate}
                        onChange={handleChange('hourlyRate')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                      <textarea
                        rows={3}
                        value={draft.notes}
                        onChange={handleChange('notes')}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </label>
                    {error ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={disableClose}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

AvailabilityDrawer.propTypes = {
  open: PropTypes.bool,
  availability: PropTypes.shape({
    status: PropTypes.string,
    hoursPerWeek: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openToRemote: PropTypes.bool,
    notes: PropTypes.string,
  }),
  hourlyRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
};

AvailabilityDrawer.defaultProps = {
  open: false,
  availability: {},
  hourlyRate: null,
  onClose: () => {},
  onSave: () => {},
  saving: false,
};
