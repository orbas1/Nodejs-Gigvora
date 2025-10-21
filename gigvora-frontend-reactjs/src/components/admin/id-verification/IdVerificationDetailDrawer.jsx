import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

function normalizeUrlSegment(baseUrl, key) {
  if (!baseUrl || !key) {
    return null;
  }
  const sanitizedBase = `${baseUrl}`.replace(/\/$/, '');
  const sanitizedKey = `${key}`.replace(/^\//, '');
  return `${sanitizedBase}/${sanitizedKey}`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function relativeTime(value) {
  if (!value) {
    return 'Unknown';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
}

function trimValue(value) {
  return `${value ?? ''}`.trim();
}

function trimOrNull(value) {
  const trimmed = trimValue(value);
  return trimmed ? trimmed : null;
}

function toOptionalNumber(value) {
  const numeric = Number(trimValue(value));
  return Number.isFinite(numeric) ? numeric : null;
}

export default function IdVerificationDetailDrawer({
  open,
  verification,
  onClose,
  onUpdate,
  storage,
}) {
  const [draft, setDraft] = useState(() => buildDraft(verification));
  const [note, setNote] = useState('');
  const [docRequest, setDocRequest] = useState('');
  const [escalationNote, setEscalationNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setDraft(buildDraft(verification));
    setNote('');
    setDocRequest('');
    setEscalationNote('');
    setStatusMessage(null);
    setErrorMessage(null);
  }, [verification?.id]);

  const evidenceBaseUrl = useMemo(() => storage?.publicBaseUrl ?? null, [storage?.publicBaseUrl]);

  if (!open) {
    return null;
  }

  const handleFieldChange = (field) => (event) => {
    const value = event?.target?.value;
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmitCore = async (event) => {
    event.preventDefault();
    if (!verification?.id) return;
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const issuingCountry = trimOrNull(draft.issuingCountry);
      await onUpdate?.(verification.id, {
        status: draft.status,
        reviewerId: toOptionalNumber(draft.reviewerId),
        reviewNotes: trimOrNull(draft.reviewNotes),
        declinedReason: trimOrNull(draft.declinedReason),
        documentFrontKey: trimOrNull(draft.documentFrontKey),
        documentBackKey: trimOrNull(draft.documentBackKey),
        selfieKey: trimOrNull(draft.selfieKey),
        typeOfId: trimOrNull(draft.typeOfId),
        idNumberLast4: trimOrNull(draft.idNumberLast4),
        issuingCountry: issuingCountry ? issuingCountry.toUpperCase() : null,
        addressLine1: trimValue(draft.addressLine1),
        addressLine2: trimOrNull(draft.addressLine2),
        city: trimValue(draft.city),
        state: trimOrNull(draft.state),
        postalCode: trimValue(draft.postalCode),
        country: trimValue(draft.country).toUpperCase(),
      });
      setStatusMessage('Verification updated');
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message ?? 'Unable to update verification.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitNote = async (event) => {
    event.preventDefault();
    if (!note.trim() || !verification?.id) {
      return;
    }
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await onUpdate?.(verification.id, { note: note.trim() });
      setNote('');
      setStatusMessage('Reviewer note logged');
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message ?? 'Unable to add note.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitDocRequest = async (event) => {
    event.preventDefault();
    if (!docRequest.trim() || !verification?.id) {
      return;
    }
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await onUpdate?.(verification.id, {
        documentRequest: {
          note: docRequest.trim(),
        },
      });
      setDocRequest('');
      setStatusMessage('Document request sent');
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message ?? 'Unable to request additional documents.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitEscalation = async (event) => {
    event.preventDefault();
    if (!escalationNote.trim() || !verification?.id) {
      return;
    }
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await onUpdate?.(verification.id, {
        escalate: {
          note: escalationNote.trim(),
        },
      });
      setEscalationNote('');
      setStatusMessage('Case escalated');
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message ?? 'Unable to escalate verification.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
      <button type="button" onClick={onClose} className="flex-1" aria-label="Close identity verification drawer" />
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{verification?.fullName ?? 'Identity verification'}</h2>
            <p className="mt-1 text-sm text-slate-600">
              User #{verification?.userId} • Profile #{verification?.profileId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close verification drawer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-8 p-6">
          {statusMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {statusMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
          ) : null}

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Applicant details</h3>
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2">
              <DetailItem label="Full name" value={verification?.fullName} />
              <DetailItem label="Email" value={verification?.user?.email ?? '—'} />
              <DetailItem label="Submitted" value={`${formatDate(verification?.submittedAt)} (${relativeTime(verification?.submittedAt)})`} />
              <DetailItem label="Status" value={verification?.status?.replace(/_/g, ' ')} />
              <DetailItem label="Type of ID" value={verification?.typeOfId ?? '—'} />
              <DetailItem label="Issuing country" value={verification?.issuingCountry ?? '—'} />
              <DetailItem label="DOB" value={formatDate(verification?.dateOfBirth)} />
              <DetailItem label="Address" value={formatAddress(verification)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Documents</h3>
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-3">
              <DocumentPreview
                label="Document front"
                fileKey={draft.documentFrontKey}
                onChange={handleFieldChange('documentFrontKey')}
                baseUrl={evidenceBaseUrl}
              />
              <DocumentPreview
                label="Document back"
                fileKey={draft.documentBackKey}
                onChange={handleFieldChange('documentBackKey')}
                baseUrl={evidenceBaseUrl}
              />
              <DocumentPreview
                label="Selfie"
                fileKey={draft.selfieKey}
                onChange={handleFieldChange('selfieKey')}
                baseUrl={evidenceBaseUrl}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Review controls</h3>
            <form onSubmit={handleSubmitCore} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                  <select
                    value={draft.status}
                    onChange={handleFieldChange('status')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewer ID</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 42"
                    value={draft.reviewerId ?? ''}
                    onChange={handleFieldChange('reviewerId')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review notes</label>
                <textarea
                  value={draft.reviewNotes ?? ''}
                  onChange={handleFieldChange('reviewNotes')}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Summary of verification checks"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decline reason</label>
                <textarea
                  value={draft.declinedReason ?? ''}
                  onChange={handleFieldChange('declinedReason')}
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  placeholder="Describe why this verification was rejected"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address line 1</label>
                  <input
                    type="text"
                    value={draft.addressLine1 ?? ''}
                    onChange={handleFieldChange('addressLine1')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Address line 1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address line 2</label>
                  <input
                    type="text"
                    value={draft.addressLine2 ?? ''}
                    onChange={handleFieldChange('addressLine2')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Address line 2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                  <input
                    type="text"
                    value={draft.city ?? ''}
                    onChange={handleFieldChange('city')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Address city"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">State / region</label>
                  <input
                    type="text"
                    value={draft.state ?? ''}
                    onChange={handleFieldChange('state')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Address state"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Postal code</label>
                  <input
                    type="text"
                    value={draft.postalCode ?? ''}
                    onChange={handleFieldChange('postalCode')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Postal code"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issuing country</label>
                  <input
                    type="text"
                    value={draft.issuingCountry ?? ''}
                    onChange={handleFieldChange('issuingCountry')}
                    maxLength={4}
                    className="mt-2 w-full uppercase tracking-wide rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Issuing country code"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country</label>
                  <input
                    type="text"
                    value={draft.country ?? ''}
                    onChange={handleFieldChange('country')}
                    maxLength={4}
                    className="mt-2 w-full uppercase tracking-wide rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="Address country"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <p className="text-xs text-slate-500">
                  Status updates automatically log an audit trail entry.
                </p>
              </div>
            </form>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <ActionCard
              title="Add reviewer note"
              description="Log an internal note for other reviewers."
              onSubmit={handleSubmitNote}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              submitLabel="Save note"
            />
            <ActionCard
              title="Request documents"
              description="Ask the applicant to upload additional proof or a clearer scan."
              onSubmit={handleSubmitDocRequest}
              value={docRequest}
              onChange={(event) => setDocRequest(event.target.value)}
              disabled={busy}
              submitLabel="Send request"
            />
            <ActionCard
              title="Escalate case"
              description="Escalate to the trust & safety rota for manual intervention."
              onSubmit={handleSubmitEscalation}
              value={escalationNote}
              onChange={(event) => setEscalationNote(event.target.value)}
              disabled={busy}
              submitLabel="Escalate"
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Activity log</h3>
            <div className="space-y-3">
              {Array.isArray(verification?.events) && verification.events.length ? (
                verification.events.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {event.eventType.replace(/_/g, ' ')}
                          {event.toStatus ? ` → ${event.toStatus.replace(/_/g, ' ')}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.actor?.name || event.actor?.email || 'System'} • {formatDate(event.createdAt)} ({relativeTime(event.createdAt)})
                        </p>
                        {event.note ? <p className="mt-2 text-sm text-slate-600">{event.note}</p> : null}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No activity logged yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildDraft(verification) {
  if (!verification) {
    return {
      status: 'pending',
      reviewerId: '',
      reviewNotes: '',
      declinedReason: '',
      documentFrontKey: '',
      documentBackKey: '',
      selfieKey: '',
      typeOfId: '',
      idNumberLast4: '',
      issuingCountry: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    };
  }
  return {
    status: verification.status ?? 'pending',
    reviewerId: verification.reviewerId ?? '',
    reviewNotes: verification.reviewNotes ?? '',
    declinedReason: verification.declinedReason ?? '',
    documentFrontKey: verification.documentFrontKey ?? '',
    documentBackKey: verification.documentBackKey ?? '',
    selfieKey: verification.selfieKey ?? '',
    typeOfId: verification.typeOfId ?? '',
    idNumberLast4: verification.idNumberLast4 ?? '',
    issuingCountry: verification.issuingCountry ?? '',
    addressLine1: verification.addressLine1 ?? '',
    addressLine2: verification.addressLine2 ?? '',
    city: verification.city ?? '',
    state: verification.state ?? '',
    postalCode: verification.postalCode ?? '',
    country: verification.country ?? '',
  };
}

function formatAddress(verification) {
  const parts = [
    verification?.addressLine1,
    verification?.addressLine2,
    verification?.city,
    verification?.state,
    verification?.postalCode,
    verification?.country,
  ]
    .map((part) => (part ? part.toString().trim() : ''))
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value ?? '—'}</p>
    </div>
  );
}

function DocumentPreview({ label, fileKey, onChange, baseUrl }) {
  const previewUrl = normalizeUrlSegment(baseUrl, fileKey);
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type="text"
        value={fileKey ?? ''}
        onChange={onChange}
        placeholder="storage/object/key.jpg"
        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
      {previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-sky-600 transition hover:text-sky-800"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" /> Open asset
        </a>
      ) : null}
    </div>
  );
}

function ActionCard({ title, description, value, onChange, onSubmit, disabled, submitLabel }) {
  const safeValue = typeof value === 'string' ? value : value ?? '';
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <textarea
        value={safeValue}
        onChange={onChange}
        rows={3}
        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
      />
      <button
        type="submit"
        disabled={disabled || !safeValue.trim()}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}
