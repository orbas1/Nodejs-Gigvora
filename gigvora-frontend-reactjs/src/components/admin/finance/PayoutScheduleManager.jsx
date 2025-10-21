import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CalendarDaysIcon, ClockIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_SCHEDULE = {
  name: '',
  scheduleType: 'weekly',
  cadence: 'weekly',
  dayOfWeek: '',
  dayOfMonth: '',
  leadTimeDays: '',
  payoutWindow: '',
  status: 'draft',
  nextRunOn: '',
  autoApprove: false,
  fundingSource: '',
  notes: '',
};

const defaultFormatDate = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
};

function ScheduleModal({ open, schedule, onClose, onSubmit, saving, error }) {
  const [form, setForm] = useState(schedule ?? DEFAULT_SCHEDULE);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm({
      ...DEFAULT_SCHEDULE,
      ...schedule,
      dayOfMonth: schedule?.dayOfMonth ?? '',
      leadTimeDays: schedule?.leadTimeDays ?? '',
    });
  }, [open, schedule]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      scheduleType: form.scheduleType.trim() || 'weekly',
      cadence: form.cadence.trim() || form.scheduleType,
      dayOfWeek: form.dayOfWeek || undefined,
      dayOfMonth: form.dayOfMonth === '' ? undefined : Number(form.dayOfMonth),
      leadTimeDays: form.leadTimeDays === '' ? undefined : Number(form.leadTimeDays),
      payoutWindow: form.payoutWindow || undefined,
      status: form.status || 'draft',
      nextRunOn: form.nextRunOn || undefined,
      autoApprove: Boolean(form.autoApprove),
      fundingSource: form.fundingSource || undefined,
      notes: form.notes || undefined,
    };
    onSubmit(payload);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{schedule ? 'Edit payout schedule' : 'Create payout schedule'}</h3>
            <p className="mt-1 text-sm text-slate-600">Control payout automation windows, lead times, and funding sources.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Schedule name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Schedule type</span>
              <select
                name="scheduleType"
                value={form.scheduleType}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="adhoc">Ad-hoc</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Cadence</span>
              <input
                type="text"
                name="cadence"
                value={form.cadence}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Day of week</span>
              <select
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Not set</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <option key={day} value={day.toLowerCase()}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Day of month</span>
              <input
                type="number"
                name="dayOfMonth"
                value={form.dayOfMonth}
                onChange={handleChange}
                min="1"
                max="31"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Lead time (days)</span>
              <input
                type="number"
                name="leadTimeDays"
                value={form.leadTimeDays}
                onChange={handleChange}
                min="0"
                max="30"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Payout window</span>
              <input
                type="text"
                name="payoutWindow"
                value={form.payoutWindow}
                onChange={handleChange}
                placeholder="e.g. 09:00-14:00 UTC"
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Next run</span>
              <input
                type="date"
                name="nextRunOn"
                value={form.nextRunOn ?? ''}
                onChange={handleChange}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="autoApprove"
              checked={form.autoApprove}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-approve eligible payouts
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Funding source</span>
            <input
              type="text"
              name="fundingSource"
              value={form.fundingSource}
              onChange={handleChange}
              placeholder="Primary treasury wallet"
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700">Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayoutScheduleManager({
  payoutSchedules,
  onCreate,
  onUpdate,
  onDelete,
  formatDate = defaultFormatDate,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const normalizedSchedules = useMemo(() => (Array.isArray(payoutSchedules) ? payoutSchedules : []), [payoutSchedules]);

  const openModal = (schedule = null) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSchedule(null);
    setError('');
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');
    try {
      if (editingSchedule) {
        await onUpdate(editingSchedule.id, payload);
      } else {
        await onCreate(payload);
      }
      setModalOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      setError(err?.message ?? 'Unable to save payout schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Archive this payout schedule?');
      if (!confirmed) {
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      await onDelete(schedule.id);
    } catch (err) {
      setError(err?.message ?? 'Unable to delete payout schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="finance-payout-schedules" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Payout automation schedules</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Govern the cadence of freelancer, partner, and affiliate payouts with clear lead times and funding sources.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" /> New schedule
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {normalizedSchedules.length ? (
          normalizedSchedules.map((schedule) => {
            const badgeStyles = schedule.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : schedule.status === 'paused'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-200 text-slate-600';
            return (
              <article key={schedule.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{schedule.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeStyles}`}>
                      {schedule.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span className="font-medium text-slate-800">{schedule.cadence}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <ClockIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <span>
                        {schedule.dayOfWeek ? schedule.dayOfWeek : 'Any day'} •
                        {schedule.payoutWindow ? ` ${schedule.payoutWindow}` : ' Business hours'}
                      </span>
                    </div>
                    {schedule.fundingSource ? (
                      <div className="mt-1 text-xs text-slate-500">Funding: {schedule.fundingSource}</div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    <div>Lead time: {schedule.leadTimeDays != null ? `${schedule.leadTimeDays} days` : 'Same day'}</div>
                    <div>Next run: {schedule.nextRunOn ? formatDate(schedule.nextRunOn) : 'Not scheduled'}</div>
                    <div>Auto-approve: {schedule.autoApprove ? 'Enabled' : 'Manual review'}</div>
                  </div>
                  {schedule.notes ? <p className="text-xs text-slate-500">{schedule.notes}</p> : null}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(schedule)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(schedule)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                    disabled={saving}
                  >
                    Archive
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
            No payout schedules configured yet.
          </div>
        )}
      </div>

      <ScheduleModal
        open={modalOpen}
        schedule={editingSchedule}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
        error={error}
      />
    </section>
  );
}

PayoutScheduleManager.propTypes = {
  payoutSchedules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      scheduleType: PropTypes.string,
      cadence: PropTypes.string,
      dayOfWeek: PropTypes.string,
      dayOfMonth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      leadTimeDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      payoutWindow: PropTypes.string,
      status: PropTypes.string,
      nextRunOn: PropTypes.string,
      autoApprove: PropTypes.bool,
      fundingSource: PropTypes.string,
      notes: PropTypes.string,
    }),
  ),
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  formatDate: PropTypes.func,
};

PayoutScheduleManager.defaultProps = {
  payoutSchedules: [],
  onCreate: undefined,
  onUpdate: undefined,
  onDelete: undefined,
  formatDate: defaultFormatDate,
};
