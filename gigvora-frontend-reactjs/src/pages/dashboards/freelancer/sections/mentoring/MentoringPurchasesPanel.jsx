import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    return formatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

const DEFAULT_FORM = {
  mentorId: '',
  packageName: '',
  packageDescription: '',
  sessionsPurchased: 1,
  totalAmount: '',
  sessionsRedeemed: 0,
  currency: 'USD',
  status: 'pending',
  purchasedAt: '',
  expiresAt: '',
};

function NewPurchaseForm({ mentorOptions, onSubmit, pending }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.mentorId || !form.packageName || !form.totalAmount) {
      setError('Mentor, package name, and total amount are required.');
      return;
    }

    const payload = {
      mentorId: Number(form.mentorId),
      packageName: form.packageName.trim(),
      packageDescription: form.packageDescription.trim() || undefined,
      sessionsPurchased: Number(form.sessionsPurchased) || 1,
      sessionsRedeemed: Number(form.sessionsRedeemed) || 0,
      totalAmount: Number(form.totalAmount),
      currency: form.currency || undefined,
      status: form.status,
      purchasedAt: form.purchasedAt ? new Date(form.purchasedAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    try {
      await onSubmit(payload);
      setForm(DEFAULT_FORM);
    } catch (submitError) {
      setError(submitError?.message || 'Unable to record purchase.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">
          Mentor
          <select
            name="mentorId"
            value={form.mentorId}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select mentor</option>
            {mentorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Package name
          <input
            type="text"
            name="packageName"
            value={form.packageName}
            onChange={handleChange}
            placeholder="Leadership coaching sprint"
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">
          Sessions purchased
          <input
            type="number"
            min="1"
            name="sessionsPurchased"
            value={form.sessionsPurchased}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Sessions redeemed
          <input
            type="number"
            min="0"
            name="sessionsRedeemed"
            value={form.sessionsRedeemed}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Total amount
          <input
            type="number"
            min="0"
            step="0.01"
            name="totalAmount"
            value={form.totalAmount}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Currency
          <input
            type="text"
            name="currency"
            maxLength={3}
            value={form.currency}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 uppercase tracking-[0.3em] text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Purchased on
          <input
            type="date"
            name="purchasedAt"
            value={form.purchasedAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Expires on
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-700">
        Package description
        <textarea
          name="packageDescription"
          value={form.packageDescription}
          onChange={handleChange}
          rows={3}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setForm(DEFAULT_FORM)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          disabled={pending}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          disabled={pending}
        >
          Record purchase
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}

NewPurchaseForm.propTypes = {
  mentorOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })),
  onSubmit: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

function PurchaseRow({ order, mentorLabel, onSave, pending }) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    status: order.status,
    sessionsRedeemed: order.sessionsRedeemed ?? 0,
    packageDescription: order.packageDescription ?? '',
    expiresAt: order.expiresAt ? order.expiresAt.slice(0, 10) : '',
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const payload = {
      status: form.status,
      sessionsRedeemed: Number(form.sessionsRedeemed) || 0,
      packageDescription: form.packageDescription || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    try {
      await onSave(payload);
      setExpanded(false);
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update purchase.');
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{order.packageName}</p>
          <p className="text-xs text-slate-500">{mentorLabel}</p>
          <p className="text-xs text-slate-400">
            {formatDate(order.purchasedAt)} • {formatCurrency(order.totalAmount, order.currency)} • {order.sessionsRedeemed}/{order.sessionsPurchased} redeemed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {order.status}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((previous) => !previous)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            {expanded ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {order.packageDescription ? (
        <p className="mt-3 text-sm text-slate-600">{order.packageDescription}</p>
      ) : null}

      {expanded ? (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Sessions redeemed
            <input
              type="number"
              min="0"
              name="sessionsRedeemed"
              value={form.sessionsRedeemed}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Expires at
            <input
              type="date"
              name="expiresAt"
              value={form.expiresAt}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 sm:col-span-4">
            Notes
            <textarea
              name="packageDescription"
              value={form.packageDescription}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex items-center justify-end gap-3 sm:col-span-4">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              disabled={pending}
            >
              Save changes
            </button>
          </div>
          {error ? <p className="sm:col-span-4 text-sm text-rose-600">{error}</p> : null}
        </form>
      ) : null}
    </li>
  );
}

PurchaseRow.propTypes = {
  order: PropTypes.object.isRequired,
  mentorLabel: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

export default function MentoringPurchasesPanel({ purchases, mentorLookup, onCreate, onUpdate, pending }) {
  const mentorOptions = useMemo(
    () =>
      Array.from(mentorLookup?.values?.() ?? []).map((mentor) => ({
        value: mentor.id,
        label: mentor.name,
      })),
    [mentorLookup],
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Packages</p>
          <h3 className="text-lg font-semibold text-slate-900">Mentoring sessions purchased</h3>
        </div>
        <a
          href="/mentors"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          Explore mentors
        </a>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-800">Active packages</h4>
          <ul className="space-y-3">
            {(purchases?.orders ?? []).length ? (
              purchases.orders.map((order) => {
                const mentor = mentorLookup?.get(order.mentorId);
                const mentorLabel = mentor?.name || order.mentor?.name || 'Mentor';
                return (
                  <PurchaseRow
                    key={order.id}
                    order={order}
                    mentorLabel={mentorLabel}
                    onSave={(updates) => onUpdate(order.id, updates)}
                    pending={pending}
                  />
                );
              })
            ) : (
              <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                No mentorship packages recorded yet.
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h4 className="text-sm font-semibold text-slate-800">Record new purchase</h4>
          <p className="mt-1 text-xs text-slate-500">
            Add cohort packages, retainers, or ad-hoc session bundles so spend stays accurate.
          </p>
          <div className="mt-4">
            <NewPurchaseForm mentorOptions={mentorOptions} onSubmit={onCreate} pending={pending} />
          </div>
        </div>
      </div>
    </div>
  );
}

MentoringPurchasesPanel.propTypes = {
  purchases: PropTypes.shape({
    orders: PropTypes.arrayOf(PropTypes.object),
  }),
  mentorLookup: PropTypes.instanceOf(Map),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};
