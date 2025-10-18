import { useEffect, useMemo, useState } from 'react';

const CONNECTION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'blocked', label: 'Blocked' },
];

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export default function CompanyConnectionsManager({
  connections,
  onCreateConnection,
  onUpdateConnection,
  onRemoveConnection,
}) {
  const [formState, setFormState] = useState({
    targetEmail: '',
    relationshipType: '',
    status: 'pending',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingConnectionId, setSavingConnectionId] = useState(null);

  const initialDrafts = useMemo(() => {
    const next = {};
    connections.forEach((connection) => {
      next[connection.id] = {
        relationshipType: connection.relationshipType ?? '',
        status: connection.status ?? 'pending',
        contactEmail: connection.contactEmail ?? connection.target?.email ?? '',
        contactPhone: connection.contactPhone ?? '',
        notes: connection.notes ?? '',
        lastInteractedAt: formatDateInput(connection.lastInteractedAt),
      };
    });
    return next;
  }, [connections]);

  const [drafts, setDrafts] = useState(initialDrafts);

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.targetEmail) {
      return;
    }
    try {
      setSubmitting(true);
      await onCreateConnection?.({
        targetEmail: formState.targetEmail,
        relationshipType: formState.relationshipType,
        status: formState.status,
        contactEmail: formState.contactEmail,
        contactPhone: formState.contactPhone,
        notes: formState.notes,
      });
      setFormState({ targetEmail: '', relationshipType: '', status: 'pending', contactEmail: '', contactPhone: '', notes: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleDraftChange = (connectionId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [connectionId]: {
        ...(current[connectionId] ?? initialDrafts[connectionId] ?? {}),
        [field]: value,
      },
    }));
  };

  const hasChanges = (connectionId) => {
    const draft = drafts[connectionId];
    const baseline = initialDrafts[connectionId];
    if (!draft || !baseline) {
      return false;
    }
    return (
      draft.relationshipType !== baseline.relationshipType ||
      draft.status !== baseline.status ||
      (draft.contactEmail || '') !== (baseline.contactEmail || '') ||
      (draft.contactPhone || '') !== (baseline.contactPhone || '') ||
      (draft.notes || '') !== (baseline.notes || '') ||
      (draft.lastInteractedAt || '') !== (baseline.lastInteractedAt || '')
    );
  };

  const handleSaveDraft = async (connectionId) => {
    const draft = drafts[connectionId];
    if (!draft) {
      return;
    }
    try {
      setSavingConnectionId(connectionId);
      await onUpdateConnection?.(connectionId, {
        relationshipType: draft.relationshipType,
        status: draft.status,
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        notes: draft.notes,
        lastInteractedAt: draft.lastInteractedAt ? `${draft.lastInteractedAt}T00:00:00.000Z` : null,
      });
    } finally {
      setSavingConnectionId(null);
    }
  };

  const handleRemove = (connectionId) => {
    if (window.confirm('Remove this connection?')) {
      onRemoveConnection?.(connectionId);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Network</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="targetEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Connection email
            </label>
            <input
              id="targetEmail"
              name="targetEmail"
              type="email"
              required
              value={formState.targetEmail}
              onChange={handleFieldChange}
              placeholder="partner@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="relationshipType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Relationship type
            </label>
            <input
              id="relationshipType"
              name="relationshipType"
              value={formState.relationshipType}
              onChange={handleFieldChange}
              placeholder="Agency partner, Hiring manager, etc."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formState.status}
              onChange={handleFieldChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CONNECTION_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="contactEmail" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preferred email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formState.contactEmail}
              onChange={handleFieldChange}
              placeholder="partner@agency.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="contactPhone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone (optional)
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              value={formState.contactPhone}
              onChange={handleFieldChange}
              placeholder="+1 555 123 4567"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </label>
            <input
              id="notes"
              name="notes"
              value={formState.notes}
              onChange={handleFieldChange}
              placeholder="Add mutual program context"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !formState.targetEmail}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Add connection'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Connection
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Relationship
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last interaction
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {connections.length ? (
              connections.map((connection) => {
                const draft = drafts[connection.id] ?? initialDrafts[connection.id] ?? {
                  relationshipType: '',
                  status: 'pending',
                  contactEmail: '',
                  contactPhone: '',
                  notes: '',
                  lastInteractedAt: '',
                };

                return (
                  <tr key={connection.id} className="align-top">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{connection.target?.name ?? connection.target?.email}</div>
                      <div className="text-xs text-slate-500">{connection.target?.email ?? '—'}</div>
                      {connection.targetCompanyProfile?.companyName ? (
                        <div className="text-xs text-slate-500">
                          {connection.targetCompanyProfile.companyName}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={draft.relationshipType}
                        onChange={(event) => handleDraftChange(connection.id, 'relationshipType', event.target.value)}
                        placeholder="Relationship"
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={draft.status}
                        onChange={(event) => handleDraftChange(connection.id, 'status', event.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {CONNECTION_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={draft.lastInteractedAt}
                          onChange={(event) => handleDraftChange(connection.id, 'lastInteractedAt', event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <p className="text-xs text-slate-500">{formatDate(connection.lastInteractedAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="space-y-2">
                        <input
                          type="email"
                          value={draft.contactEmail}
                          onChange={(event) => handleDraftChange(connection.id, 'contactEmail', event.target.value)}
                          placeholder="name@example.com"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <input
                          type="tel"
                          value={draft.contactPhone}
                          onChange={(event) => handleDraftChange(connection.id, 'contactPhone', event.target.value)}
                          placeholder="+1 555 123 4567"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <textarea
                          rows={2}
                          value={draft.notes}
                          onChange={(event) => handleDraftChange(connection.id, 'notes', event.target.value)}
                          placeholder="Internal context"
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveDraft(connection.id)}
                          disabled={!hasChanges(connection.id) || savingConnectionId === connection.id}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingConnectionId === connection.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(connection.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No network entries yet. Add partners to stay coordinated.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
