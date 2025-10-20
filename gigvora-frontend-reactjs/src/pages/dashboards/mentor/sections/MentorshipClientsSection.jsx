import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const CLIENT_STATUSES = ['Active', 'Onboarding', 'Paused', 'Graduated', 'Churned'];
const CLIENT_TIERS = ['Flagship', 'Growth', 'Trial', 'Past'];
const CHANNELS = ['Explorer', 'Referral', 'Corporate program', 'Community'];

const DEFAULT_FORM = {
  name: '',
  company: '',
  role: '',
  status: 'Active',
  tier: 'Growth',
  channel: 'Explorer',
  value: '',
  currency: '£',
  onboardedAt: '',
  lastSessionAt: '',
  nextSessionAt: '',
  tags: '',
  notes: '',
};

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return '—';
  }
}

export default function MentorshipClientsSection({
  clients,
  summary,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  saving,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!editingId) {
      setForm(DEFAULT_FORM);
    }
  }, [editingId]);

  const orderedClients = useMemo(() => {
    return [...(clients ?? [])].sort((a, b) => {
      const aTime = a.nextSessionAt ? new Date(a.nextSessionAt).getTime() : 0;
      const bTime = b.nextSessionAt ? new Date(b.nextSessionAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [clients]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      name: form.name,
      company: form.company,
      role: form.role,
      status: form.status,
      tier: form.tier,
      channel: form.channel,
      value: form.value ? Number.parseFloat(form.value) : undefined,
      currency: form.currency,
      onboardedAt: form.onboardedAt || undefined,
      lastSessionAt: form.lastSessionAt || undefined,
      nextSessionAt: form.nextSessionAt || undefined,
      tags: form.tags,
      notes: form.notes,
    };

    try {
      if (editingId) {
        await onUpdateClient?.(editingId, payload);
        setFeedback({ type: 'success', message: 'Client updated.' });
      } else {
        await onCreateClient?.(payload);
        setFeedback({ type: 'success', message: 'Client added to portfolio.' });
      }
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save client.' });
    }
  };

  const handleEdit = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name || '',
      company: client.company || '',
      role: client.role || '',
      status: client.status || 'Active',
      tier: client.tier || 'Growth',
      channel: client.channel || 'Explorer',
      value: client.value != null ? String(client.value) : '',
      currency: client.currency || '£',
      onboardedAt: client.onboardedAt ? client.onboardedAt.slice(0, 16) : '',
      lastSessionAt: client.lastSessionAt ? client.lastSessionAt.slice(0, 16) : '',
      nextSessionAt: client.nextSessionAt ? client.nextSessionAt.slice(0, 16) : '',
      tags: Array.isArray(client.tags) ? client.tags.join(', ') : client.tags || '',
      notes: client.notes || '',
    });
    setFeedback(null);
  };

  const handleReset = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFeedback(null);
  };

  const handleDelete = async (clientId) => {
    if (!clientId) return;
    setFeedback(null);
    try {
      await onDeleteClient?.(clientId);
      if (editingId === clientId) {
        handleReset();
      }
      setFeedback({ type: 'success', message: 'Client removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove client.' });
    }
  };

  const statusDistribution = useMemo(() => {
    const distribution = new Map();
    Object.entries(summary?.byStatus ?? {}).forEach(([status, count]) => {
      distribution.set(status, count);
    });
    return Array.from(distribution.entries());
  }, [summary]);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Mentorship clients</p>
          <h2 className="text-2xl font-semibold text-slate-900">Curate high-impact client relationships</h2>
          <p className="text-sm text-slate-600">
            Track your flagship mentees, surface those needing action, and orchestrate onboarding rituals. Keep your portfolio
            healthy with proactive nudges and context-rich handovers.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active relationships</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{summary?.total ?? 0}</p>
            <p className="text-xs text-slate-500">{summary?.flagship ?? 0} flagship cohorts</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pipeline value</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {summary?.pipelineValue ? `£${summary.pipelineValue.toLocaleString()}` : '£0'}
            </p>
            <p className="text-xs text-slate-500">Inclusive of signed and onboarding mentees</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Update client record' : 'Add mentorship client'}
            </h3>
            <button type="button" onClick={handleReset} className="text-xs font-semibold text-accent hover:underline">
              Reset
            </button>
          </div>

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Name
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Company
              <input
                type="text"
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Role
              <input
                type="text"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Channel
              <select
                value={form.channel}
                onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Relationship tier
              <select
                value={form.tier}
                onChange={(event) => setForm((current) => ({ ...current, tier: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CLIENT_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Contract value
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.currency}
                  onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                  className="w-16 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Onboarded
              <input
                type="datetime-local"
                value={form.onboardedAt}
                onChange={(event) => setForm((current) => ({ ...current, onboardedAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Last session
              <input
                type="datetime-local"
                value={form.lastSessionAt}
                onChange={(event) => setForm((current) => ({ ...current, lastSessionAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Next session
              <input
                type="datetime-local"
                value={form.nextSessionAt}
                onChange={(event) => setForm((current) => ({ ...current, nextSessionAt: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Tags
            <input
              type="text"
              value={form.tags}
              placeholder="Leadership, influence, async"
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <span className="text-xs font-normal text-slate-500">Comma separated focus areas for quick filtering.</span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Relationship notes
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving client…' : editingId ? 'Update client' : 'Add client'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status distribution</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {statusDistribution.length ? (
                statusDistribution.map(([status, count]) => (
                  <div key={status} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{status}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{count}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No clients recorded yet.</p>
              )}
            </div>
          </div>

          <ul className="space-y-4">
            {orderedClients.map((client) => (
              <li key={client.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{client.name}</p>
                    <p className="text-sm text-slate-500">
                      {client.role ? `${client.role} · ` : ''}
                      {client.company || 'Independent'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(client)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(client.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-500">Status:</span> {client.status}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Tier:</span> {client.tier}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Channel:</span> {client.channel}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Contract value:</span>{' '}
                    {client.currency || '£'}
                    {client.value ? Number(client.value).toLocaleString() : '0'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Last session:</span> {formatDateTime(client.lastSessionAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Next session:</span> {formatDateTime(client.nextSessionAt)}
                  </p>
                </div>
                {client.notes ? <p className="text-sm text-slate-600">{client.notes}</p> : null}
                {client.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
            {!orderedClients.length ? (
              <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No clients tracked yet. Publish your first mentorship relationship to get started.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

MentorshipClientsSection.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      tier: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      channel: PropTypes.string,
      lastSessionAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      nextSessionAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      tags: PropTypes.arrayOf(PropTypes.string),
      notes: PropTypes.string,
    }),
  ),
  summary: PropTypes.shape({
    total: PropTypes.number,
    flagship: PropTypes.number,
    pipelineValue: PropTypes.number,
    byStatus: PropTypes.objectOf(PropTypes.number),
  }),
  onCreateClient: PropTypes.func,
  onUpdateClient: PropTypes.func,
  onDeleteClient: PropTypes.func,
  saving: PropTypes.bool,
};

MentorshipClientsSection.defaultProps = {
  clients: [],
  summary: null,
  onCreateClient: undefined,
  onUpdateClient: undefined,
  onDeleteClient: undefined,
  saving: false,
};
