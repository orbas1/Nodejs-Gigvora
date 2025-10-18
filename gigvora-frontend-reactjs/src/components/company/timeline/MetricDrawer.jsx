import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SlideOverPanel from './SlideOverPanel.jsx';

function formatInputDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  if (value === '' || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function MetricDrawer({ open, mode, initialValue, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState({
    metricDate: '',
    impressions: '',
    clicks: '',
    reactions: '',
    comments: '',
    shares: '',
    saves: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        metricDate: formatInputDate(initialValue?.metricDate ?? new Date()),
        impressions: initialValue?.impressions ?? '',
        clicks: initialValue?.clicks ?? '',
        reactions: initialValue?.reactions ?? '',
        comments: initialValue?.comments ?? '',
        shares: initialValue?.shares ?? '',
        saves: initialValue?.saves ?? '',
        notes: initialValue?.notes ?? '',
      });
    }
  }, [open, initialValue]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      metricDate: form.metricDate || null,
      impressions: toNumber(form.impressions),
      clicks: toNumber(form.clicks),
      reactions: toNumber(form.reactions),
      comments: toNumber(form.comments),
      shares: toNumber(form.shares),
      saves: toNumber(form.saves),
      notes: form.notes.trim() || null,
    });
  };

  return (
    <SlideOverPanel
      open={open}
      title={mode === 'create' ? 'Add metrics' : 'Update metrics'}
      onClose={onClose}
      width="30rem"
      footer={
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="timeline-metric-form"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save metrics'}
          </button>
        </div>
      }
    >
      <form id="timeline-metric-form" className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="metric-date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="metric-date"
            name="metricDate"
            type="date"
            value={form.metricDate}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {['impressions', 'clicks', 'reactions', 'comments', 'shares', 'saves'].map((field) => (
            <div key={field}>
              <label htmlFor={`metric-${field}`} className="text-sm font-medium text-slate-700">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={`metric-${field}`}
                name={field}
                value={form[field]}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div>
          <label htmlFor="metric-notes" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="metric-notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Context"
          />
        </div>

        {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
      </form>
    </SlideOverPanel>
  );
}

MetricDrawer.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.shape({
    metricDate: PropTypes.string,
    impressions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clicks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reactions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    comments: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    shares: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    saves: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notes: PropTypes.string,
  }),
  saving: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

MetricDrawer.defaultProps = {
  open: false,
  initialValue: null,
  saving: false,
  error: null,
};
