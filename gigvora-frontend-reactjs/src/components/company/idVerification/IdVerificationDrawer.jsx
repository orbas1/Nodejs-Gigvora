import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

const EVENT_LABELS = {
  submission_created: 'Submission created',
  status_changed: 'Status changed',
  assignment_updated: 'Reviewer updated',
  document_updated: 'Documents updated',
  note_recorded: 'Note recorded',
  metadata_updated: 'Details updated',
};

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

function formatDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

function buildInitialState(verification) {
  if (!verification) {
    return {
      status: 'submitted',
      reviewerId: '',
      reviewNotes: '',
      declinedReason: '',
      verificationProvider: 'manual_review',
      typeOfId: '',
      idNumberLast4: '',
      issuingCountry: '',
      issuedAt: '',
      expiresAt: '',
      fullName: '',
      dateOfBirth: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      documentFrontKey: '',
      documentBackKey: '',
      selfieKey: '',
      metadataInput: '{}',
      statusNotes: '',
      submittedAt: '',
      reviewedAt: '',
    };
  }
  return {
    status: verification.status ?? 'submitted',
    reviewerId: verification.reviewer?.id ?? verification.reviewerId ?? '',
    reviewNotes: verification.reviewNotes ?? '',
    declinedReason: verification.declinedReason ?? '',
    verificationProvider: verification.verificationProvider ?? 'manual_review',
    typeOfId: verification.typeOfId ?? '',
    idNumberLast4: verification.idNumberLast4 ?? '',
    issuingCountry: verification.issuingCountry ?? '',
    issuedAt: formatDateInput(verification.issuedAt),
    expiresAt: formatDateInput(verification.expiresAt),
    fullName: verification.fullName ?? '',
    dateOfBirth: formatDateInput(verification.dateOfBirth),
    addressLine1: verification.addressLine1 ?? '',
    addressLine2: verification.addressLine2 ?? '',
    city: verification.city ?? '',
    state: verification.state ?? '',
    postalCode: verification.postalCode ?? '',
    country: verification.country ?? '',
    documentFrontKey: verification.documentFrontKey ?? '',
    documentBackKey: verification.documentBackKey ?? '',
    selfieKey: verification.selfieKey ?? '',
    metadataInput: JSON.stringify(verification.metadata ?? {}, null, 2),
    statusNotes: '',
    submittedAt: verification.submittedAt ? formatDateTimeInput(verification.submittedAt) : '',
    reviewedAt: verification.reviewedAt ? formatDateTimeInput(verification.reviewedAt) : '',
  };
}

function EventTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }
  return (
    <ul className="space-y-3 text-sm text-slate-600">
      {events.map((event) => {
        const label = EVENT_LABELS[event.eventType] ?? event.eventType;
        return (
          <li key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{label}</span>
              <span>{event.createdAt ? formatRelativeTime(event.createdAt) : ''}</span>
            </div>
            {event.notes ? <p className="mt-1 text-sm text-slate-700">{event.notes}</p> : null}
            {event.metadata ? (
              <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-white p-2 text-xs text-slate-500">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            ) : null}
            <div className="mt-2 text-xs text-slate-400">
              {event.actor?.firstName || event.actor?.email
                ? `By ${[event.actor?.firstName, event.actor?.lastName].filter(Boolean).join(' ') || event.actor?.email}`
                : 'System'}
              {event.createdAt ? ` • ${formatAbsolute(event.createdAt)}` : ''}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

EventTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      eventType: PropTypes.string,
      notes: PropTypes.string,
      metadata: PropTypes.object,
      createdAt: PropTypes.string,
      actor: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
      }),
    }),
  ),
};

EventTimeline.defaultProps = {
  events: [],
};

export default function IdVerificationDrawer({
  open,
  verification,
  statusOptions = [],
  reviewerOptions = [],
  workspaceId,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [form, setForm] = useState(() => buildInitialState(verification));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(verification));
      setError(null);
    }
  }, [verification, open]);

  const statusList = useMemo(
    () => (statusOptions.length ? statusOptions : ['pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired']),
    [statusOptions],
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSubmit || loading) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let metadata = undefined;
      if (form.metadataInput) {
        try {
          metadata = JSON.parse(form.metadataInput);
        } catch (parseError) {
          throw new Error('Metadata must be valid JSON.');
        }
      }

      const payload = {
        workspaceId,
        status: form.status,
        reviewNotes: form.reviewNotes,
        declinedReason: form.declinedReason,
        reviewerId: form.reviewerId === '' ? null : Number(form.reviewerId),
        verificationProvider: form.verificationProvider,
        typeOfId: form.typeOfId,
        idNumberLast4: form.idNumberLast4,
        issuingCountry: form.issuingCountry,
        issuedAt: form.issuedAt ? new Date(form.issuedAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        documentFrontKey: form.documentFrontKey,
        documentBackKey: form.documentBackKey,
        selfieKey: form.selfieKey,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        metadata,
        statusNotes: form.statusNotes,
        submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : undefined,
        reviewedAt: form.reviewedAt ? new Date(form.reviewedAt).toISOString() : undefined,
      };

      await onSubmit(payload);
      setSaving(false);
      onClose?.();
    } catch (err) {
      setError(err.message ?? 'Unable to update verification.');
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  const busy = saving || loading;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end">
      <div className="fixed inset-0 bg-slate-900/40" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div className="relative h-[90vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:h-full sm:max-w-2xl sm:rounded-l-3xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden" aria-busy={busy}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID check</p>
              <h2 className="text-xl font-semibold text-slate-900">{verification?.fullName ?? 'Workspace member'}</h2>
              {verification?.user?.email ? (
                <p className="text-sm text-slate-500">{verification.user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <fieldset disabled={busy} className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
                ) : null}

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        {statusList.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reviewerId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reviewer
                      </label>
                      <select
                        id="reviewerId"
                        name="reviewerId"
                        value={form.reviewerId ?? ''}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="">Unassigned</option>
                        {reviewerOptions.map((reviewer) => (
                          <option key={reviewer.userId} value={reviewer.userId}>
                            {reviewer.name ?? reviewer.email ?? `Member ${reviewer.userId}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="reviewNotes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Review notes
                      </label>
                      <textarea
                        id="reviewNotes"
                        name="reviewNotes"
                        value={form.reviewNotes}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Add remediation steps or context for the applicant"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="statusNotes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status update note
                      </label>
                      <input
                        id="statusNotes"
                        name="statusNotes"
                        value={form.statusNotes}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Optional note for status change"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="declinedReason" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Decline reason
                      </label>
                      <textarea
                        id="declinedReason"
                        name="declinedReason"
                        value={form.declinedReason}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Why was this verification declined?"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="typeOfId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Document type
                      </label>
                      <input
                        id="typeOfId"
                        name="typeOfId"
                        value={form.typeOfId}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Passport, National ID…"
                      />
                    </div>
                    <div>
                      <label htmlFor="idNumberLast4" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ID last 4
                      </label>
                      <input
                        id="idNumberLast4"
                        name="idNumberLast4"
                        value={form.idNumberLast4}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="1234"
                      />
                    </div>
                    <div>
                      <label htmlFor="issuingCountry" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Issuing country
                      </label>
                      <input
                        id="issuingCountry"
                        name="issuingCountry"
                        value={form.issuingCountry}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="US"
                      />
                    </div>
                    <div>
                      <label htmlFor="verificationProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Provider
                      </label>
                      <input
                        id="verificationProvider"
                        name="verificationProvider"
                        value={form.verificationProvider}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="issuedAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Issued at
                      </label>
                      <input
                        type="date"
                        id="issuedAt"
                        name="issuedAt"
                        value={form.issuedAt}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="expiresAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Expires at
                      </label>
                      <input
                        type="date"
                        id="expiresAt"
                        name="expiresAt"
                        value={form.expiresAt}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date of birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="addressLine1" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Address line 1
                      </label>
                      <input
                        id="addressLine1"
                        name="addressLine1"
                        value={form.addressLine1}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="addressLine2" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Address line 2
                      </label>
                      <input
                        id="addressLine2"
                        name="addressLine2"
                        value={form.addressLine2}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        State / region
                      </label>
                      <input
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Postal code
                      </label>
                      <input
                        id="postalCode"
                        name="postalCode"
                        value={form.postalCode}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="documentFrontKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Front document key
                      </label>
                      <input
                        id="documentFrontKey"
                        name="documentFrontKey"
                        value={form.documentFrontKey}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="documentBackKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Back document key
                      </label>
                      <input
                        id="documentBackKey"
                        name="documentBackKey"
                        value={form.documentBackKey}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="selfieKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Selfie key
                      </label>
                      <input
                        id="selfieKey"
                        name="selfieKey"
                        value={form.selfieKey}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metadata</h3>
                  <textarea
                    id="metadataInput"
                    name="metadataInput"
                    value={form.metadataInput}
                    onChange={handleChange}
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    spellCheck={false}
                  />
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timestamps</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="submittedAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Submitted at
                      </label>
                      <input
                        type="datetime-local"
                        id="submittedAt"
                        name="submittedAt"
                        value={form.submittedAt}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="reviewedAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reviewed at
                      </label>
                      <input
                        type="datetime-local"
                        id="reviewedAt"
                        name="reviewedAt"
                        value={form.reviewedAt}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Activity</h3>
                  <EventTimeline events={verification?.events ?? []} />
                </section>
              </div>
            </fieldset>
            {loading ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
                  <ArrowPathIcon className="h-4 w-4 animate-spin text-accent" />
                  Loading verification…
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Created {verification?.createdAt ? formatAbsolute(verification.createdAt) : '—'}</span>
              <span>Updated {verification?.updatedAt ? formatAbsolute(verification.updatedAt) : '—'}</span>
            </div>
            <div className="mt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

IdVerificationDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  verification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    status: PropTypes.string,
    reviewer: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
    reviewerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    reviewNotes: PropTypes.string,
    declinedReason: PropTypes.string,
    verificationProvider: PropTypes.string,
    typeOfId: PropTypes.string,
    idNumberLast4: PropTypes.string,
    issuingCountry: PropTypes.string,
    issuedAt: PropTypes.string,
    expiresAt: PropTypes.string,
    fullName: PropTypes.string,
    dateOfBirth: PropTypes.string,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string,
    documentFrontKey: PropTypes.string,
    documentBackKey: PropTypes.string,
    selfieKey: PropTypes.string,
    metadata: PropTypes.object,
    statusNotes: PropTypes.string,
    submittedAt: PropTypes.string,
    reviewedAt: PropTypes.string,
    events: PropTypes.array,
  }),
  statusOptions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  })])),
  reviewerOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
};

IdVerificationDrawer.defaultProps = {
  verification: null,
  statusOptions: [],
  reviewerOptions: [],
  workspaceId: null,
  onSubmit: undefined,
  loading: false,
};
