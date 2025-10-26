import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { readFileAsBase64 } from '../../../../../utils/file.js';

const INITIAL_FORM = {
  notes: '',
  actionType: 'comment',
  stage: '',
  status: '',
  customerDeadlineAt: '',
  providerDeadlineAt: '',
  transactionResolution: 'none',
  resolutionNotes: '',
  file: null,
};

function formatDate(value, options = { withTime: true }) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: options.withTime ? 'numeric' : undefined,
    minute: options.withTime ? '2-digit' : undefined,
  });
}

function Badge({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

export default function DisputeDrawer({ open, detail, loading, error, onClose, onSubmit }) {
  const dispute = detail?.dispute ?? null;
  const events = detail?.events ?? [];
  const resolutionOptions = detail?.resolutionOptions ?? [];
  const stages = detail?.availableStages ?? [];
  const statuses = detail?.availableStatuses ?? [];
  const actionTypes = detail?.availableActionTypes ?? [];

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
      setSubmitting(false);
      setFormError(null);
      return;
    }
    if (dispute) {
      setForm((prev) => ({
        ...INITIAL_FORM,
        stage: dispute.stage || '',
        status: dispute.status || '',
        transactionResolution: 'none',
        notes: prev.notes,
      }));
    }
  }, [open, dispute?.id]);

  const timeline = useMemo(
    () =>
      events
        .slice()
        .reverse()
        .map((event) => ({
          id: event.id,
          title: event.actionType.replace(/_/g, ' '),
          actor: event.actorType,
          at: event.eventAt,
          notes: event.notes,
          evidenceUrl: event.evidenceUrl,
          fileName: event.evidenceFileName,
        })),
    [events],
  );

  if (!open) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'file' ? event.target.files?.[0] ?? null : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!dispute) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      let evidence = null;
      if (form.file) {
        const content = await readFileAsBase64(form.file);
        evidence = {
          content,
          encoding: 'base64',
          fileName: form.file.name,
          contentType: form.file.type || 'application/octet-stream',
        };
      }

      const payload = {
        notes: form.notes?.trim() ? form.notes.trim() : undefined,
        actionType: form.actionType || 'comment',
        stage: form.stage || undefined,
        status: form.status || undefined,
        customerDeadlineAt: form.customerDeadlineAt || undefined,
        providerDeadlineAt: form.providerDeadlineAt || undefined,
        transactionResolution: form.transactionResolution,
        resolutionNotes: form.resolutionNotes?.trim() ? form.resolutionNotes.trim() : undefined,
        evidence,
      };

      await onSubmit(dispute.id, payload);
      setForm(INITIAL_FORM);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause : new Error('Unable to save update'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="h-full flex-1 bg-slate-900/40" onClick={onClose} aria-label="Close dispute panel" />
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Dispute</span>
              {dispute?.id ? <span className="font-semibold text-slate-700">#{dispute.id}</span> : null}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{dispute?.summary || 'Dispute'}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {dispute?.stage ? <Badge tone="bg-slate-900 text-white">{dispute.stage}</Badge> : null}
              {dispute?.status ? <Badge tone="bg-slate-100 text-slate-700">{dispute.status.replace(/_/g, ' ')}</Badge> : null}
              {dispute?.priority ? <Badge tone="bg-amber-100 text-amber-700">{dispute.priority}</Badge> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-8 px-8 py-8">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-6 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {error.message || 'Unable to load dispute details.'}
            </p>
          ) : null}

          {dispute ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/70 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
                  <dl className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Opened</dt>
                      <dd>{formatDate(dispute.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Last update</dt>
                      <dd>{formatDate(dispute.updatedAt)}</dd>
                    </div>
                    {dispute.customerDeadlineAt ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Client due</dt>
                        <dd className="text-amber-600">{formatDate(dispute.customerDeadlineAt)}</dd>
                      </div>
                    ) : null}
                    {dispute.providerDeadlineAt ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Your due</dt>
                        <dd className="text-amber-600">{formatDate(dispute.providerDeadlineAt)}</dd>
                      </div>
                    ) : null}
                    {dispute.transaction ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Transaction</dt>
                        <dd className="text-right text-slate-700">
                          <div className="font-semibold">{dispute.transaction.reference || `#${dispute.transaction.id}`}</div>
                          <div className="text-xs text-slate-500">{dispute.transaction.currencyCode} {dispute.transaction.amount}</div>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200/70 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timeline</h3>
                  <ol className="mt-4 space-y-4">
                    {timeline.length === 0 ? (
                      <li className="text-xs uppercase tracking-wide text-slate-400">No activity yet.</li>
                    ) : (
                      timeline.map((item) => (
                        <li key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold uppercase tracking-wide">{item.title}</span>
                            <span>{formatDate(item.at)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.notes || '—'}</p>
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium">{item.actor}</span>
                            {item.evidenceUrl ? (
                              <a
                                href={item.evidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-accent hover:text-accentDark"
                              >
                                {item.fileName || 'View file'}
                              </a>
                            ) : null}
                          </div>
                        </li>
                      ))
                    )}
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200/70 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add update</h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Saving…' : 'Save'}
                    </button>
                  </div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Note
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={handleChange('notes')}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="Add context"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                      <select
                        value={form.actionType}
                        onChange={handleChange('actionType')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        {actionTypes.map((option) => (
                          <option key={option} value={option}>
                            {option.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stage
                      <select
                        value={form.stage}
                        onChange={handleChange('stage')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">Keep</option>
                        {stages.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                      <select
                        value={form.status}
                        onChange={handleChange('status')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">Keep</option>
                        {statuses.map((option) => (
                          <option key={option} value={option}>
                            {option.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Resolution
                      <select
                        value={form.transactionResolution}
                        onChange={handleChange('transactionResolution')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="none">No payout change</option>
                        {resolutionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resolution note
                    <textarea
                      rows={3}
                      value={form.resolutionNotes}
                      onChange={handleChange('resolutionNotes')}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="Optional"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Client deadline
                      <input
                        type="datetime-local"
                        value={form.customerDeadlineAt}
                        onChange={handleChange('customerDeadlineAt')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Your deadline
                      <input
                        type="datetime-local"
                        value={form.providerDeadlineAt}
                        onChange={handleChange('providerDeadlineAt')}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evidence
                    <input
                      type="file"
                      onChange={handleChange('file')}
                      className="mt-2 w-full text-sm text-slate-600"
                      accept="image/*,application/pdf"
                    />
                    {form.file ? (
                      <p className="mt-1 text-xs text-slate-500">{form.file.name}</p>
                    ) : null}
                  </label>

                  {formError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                      {formError.message}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

DisputeDrawer.propTypes = {
  open: PropTypes.bool,
  detail: PropTypes.shape({
    dispute: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      summary: PropTypes.string,
      stage: PropTypes.string,
      status: PropTypes.string,
      priority: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string,
      customerDeadlineAt: PropTypes.string,
      providerDeadlineAt: PropTypes.string,
      transaction: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reference: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currencyCode: PropTypes.string,
      }),
    }),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        actionType: PropTypes.string.isRequired,
        actorType: PropTypes.string,
        eventAt: PropTypes.string,
        notes: PropTypes.string,
        evidenceUrl: PropTypes.string,
        evidenceFileName: PropTypes.string,
      }),
    ),
    resolutionOptions: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    availableStages: PropTypes.arrayOf(PropTypes.string),
    availableStatuses: PropTypes.arrayOf(PropTypes.string),
    availableActionTypes: PropTypes.arrayOf(PropTypes.string),
  }),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

DisputeDrawer.defaultProps = {
  open: false,
  detail: null,
  loading: false,
  error: null,
  onClose: () => {},
  onSubmit: () => Promise.resolve(),
};
