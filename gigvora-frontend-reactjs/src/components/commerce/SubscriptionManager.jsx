import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BellAlertIcon,
  EnvelopeIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import useSavedSearches from '../../hooks/useSavedSearches.js';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly summary' },
  { value: 'immediate', label: 'Immediate alerts' },
];

const DEFAULT_FORM = {
  name: '',
  category: 'talent',
  query: '',
  filters: '',
  frequency: 'daily',
  notifyByEmail: true,
  notifyInApp: true,
};

function formatRelative(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) return rtf.format(hours, 'hour');
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
}

export default function SubscriptionManager({ enabled = true }) {
  const {
    items,
    loading,
    error,
    createSavedSearch,
    updateSavedSearch,
    deleteSavedSearch,
    runSavedSearch,
    refresh,
    canUseServer,
  } = useSavedSearches({ enabled });

  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const summary = useMemo(() => {
    if (!items.length) {
      return { total: 0, email: 0, inApp: 0, nextRun: null };
    }
    const email = items.filter((item) => item.notifyByEmail).length;
    const inApp = items.filter((item) => item.notifyInApp !== false).length;
    const nextRun = [...items]
      .map((item) => item.nextRunAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];
    return { total: items.length, email, inApp, nextRun };
  }, [items]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || saving) return;

    const payload = {
      name: form.name,
      category: form.category,
      query: form.query || undefined,
      filters: form.filters ? { expression: form.filters } : undefined,
      frequency: form.frequency,
      notifyByEmail: Boolean(form.notifyByEmail),
      notifyInApp: Boolean(form.notifyInApp),
    };

    try {
      setSaving(true);
      await createSavedSearch(payload);
      setForm(() => ({ ...DEFAULT_FORM }));
      setFeedback({ type: 'success', message: 'Subscription created.' });
    } catch (exception) {
      setFeedback({ type: 'error', message: exception.message || 'Unable to save subscription.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item, key) => {
    try {
      await updateSavedSearch(item.id, { [key]: !item[key] });
      setFeedback({ type: 'success', message: 'Notification preferences updated.' });
    } catch (exception) {
      setFeedback({ type: 'error', message: exception.message || 'Unable to update subscription.' });
    }
  };

  const handleRun = async (item) => {
    try {
      await runSavedSearch(item.id);
      setFeedback({ type: 'success', message: 'Subscription queued for delivery.' });
    } catch (exception) {
      setFeedback({ type: 'error', message: exception.message || 'Unable to run subscription.' });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Remove this subscription?')) return;
    try {
      await deleteSavedSearch(item.id);
      setFeedback({ type: 'success', message: 'Subscription removed.' });
    } catch (exception) {
      setFeedback({ type: 'error', message: exception.message || 'Unable to remove subscription.' });
    }
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Subscriptions</p>
          <h2 className="text-xl font-semibold text-slate-900">Automation & saved search manager</h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitor active digests, fine-tune alert cadence, and orchestrate Explorer follow-ups without leaving finance ops.
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total subscriptions</p>
            <p className="text-lg font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email alerts</p>
            <p className="text-lg font-semibold text-slate-900">{summary.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In-app nudges</p>
            <p className="text-lg font-semibold text-slate-900">{summary.inApp}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next run</p>
            <p className="text-lg font-semibold text-slate-900">{summary.nextRun ? formatRelative(summary.nextRun) : 'Queued'}</p>
          </div>
        </div>
      </header>

      {feedback ? (
        <div
          role="status"
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Create subscription</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Name
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Category
            <input
              type="text"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder="talent / gigs / finance"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Query or segment
            <input
              type="text"
              value={form.query}
              onChange={(event) => setForm((current) => ({ ...current, query: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder={'role:"VP Product" AND stage:scale'}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Advanced filters
            <input
              type="text"
              value={form.filters}
              onChange={(event) => setForm((current) => ({ ...current, filters: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              placeholder="JSON expression or DSL"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Frequency
            <select
              value={form.frequency}
              onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            <input
              id="notify-email"
              type="checkbox"
              checked={form.notifyByEmail}
              onChange={(event) => setForm((current) => ({ ...current, notifyByEmail: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="notify-email" className="flex items-center gap-2">
              <EnvelopeIcon className="h-4 w-4 text-slate-500" /> Email alerts
            </label>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
            <input
              id="notify-in-app"
              type="checkbox"
              checked={form.notifyInApp}
              onChange={(event) => setForm((current) => ({ ...current, notifyInApp: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="notify-in-app" className="flex items-center gap-2">
              <BellAlertIcon className="h-4 w-4 text-slate-500" /> In-app notifications
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create subscription'}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {canUseServer
            ? 'Live subscriptions sync with Explorer via API.'
            : 'Local demo mode: subscriptions stored in your browser.'}
        </span>
        <button
          type="button"
          onClick={() => refresh({ force: true })}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      <DataStatus loading={loading} error={error} empty={!loading && items.length === 0}>
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500">
                    {item.category || 'general'} • Next run {formatRelative(item.nextRunAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggle(item, 'notifyByEmail')}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
                      item.notifyByEmail ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <EnvelopeIcon className="h-4 w-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(item, 'notifyInApp')}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition ${
                      item.notifyInApp !== false ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <BellAlertIcon className="h-4 w-4" /> In-app
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRun(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 font-semibold text-white transition hover:bg-slate-700"
                  >
                    <PlayCircleIcon className="h-4 w-4" /> Run now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <TrashIcon className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
              {item.query || item.filters ? (
                <div className="mt-3 rounded-2xl bg-white/80 p-4 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Filters</p>
                  {item.query ? <p className="mt-1 break-words"><strong>Query:</strong> {item.query}</p> : null}
                  {item.filters ? (
                    <p className="mt-1 break-words">
                      <strong>Rules:</strong> {JSON.stringify(item.filters)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </DataStatus>
    </section>
  );
}

SubscriptionManager.propTypes = {
  enabled: PropTypes.bool,
};

