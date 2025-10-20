import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckBadgeIcon, DocumentCheckIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const VERIFICATION_STATUSES = ['Not started', 'In review', 'Action required', 'Approved'];
const DOCUMENT_TYPES = ['Passport', 'National ID', 'Driving licence', 'Business certificate'];
const DOCUMENT_STATUSES = ['Pending', 'In review', 'Approved', 'Action required'];

const DEFAULT_STATUS_FORM = {
  status: 'In review',
  notes: '',
};

const DEFAULT_DOCUMENT_FORM = {
  type: 'Passport',
  status: 'Pending',
  reference: '',
  notes: '',
};

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
  } catch (error) {
    return '—';
  }
}

export default function MentorVerificationSection({
  verification,
  onUpdateStatus,
  onCreateDocument,
  onUpdateDocument,
  onDeleteDocument,
  saving,
}) {
  const [statusForm, setStatusForm] = useState(DEFAULT_STATUS_FORM);
  const [documentForm, setDocumentForm] = useState(DEFAULT_DOCUMENT_FORM);
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (verification) {
      setStatusForm({
        status: verification.status || 'In review',
        notes: verification.notes || '',
      });
    }
  }, [verification]);

  useEffect(() => {
    if (!editingDocumentId) {
      setDocumentForm(DEFAULT_DOCUMENT_FORM);
    }
  }, [editingDocumentId]);

  const documents = useMemo(() => verification?.documents ?? [], [verification]);

  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await onUpdateStatus?.({ status: statusForm.status, notes: statusForm.notes });
      setFeedback({ type: 'success', message: 'Verification status updated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to update verification status.' });
    }
  };

  const handleDocumentSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      type: documentForm.type,
      status: documentForm.status,
      reference: documentForm.reference,
      notes: documentForm.notes,
    };
    try {
      if (editingDocumentId) {
        await onUpdateDocument?.(editingDocumentId, payload);
        setFeedback({ type: 'success', message: 'Verification document updated.' });
      } else {
        await onCreateDocument?.(payload);
        setFeedback({ type: 'success', message: 'Verification document submitted.' });
      }
      setEditingDocumentId(null);
      setDocumentForm(DEFAULT_DOCUMENT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save verification document.' });
    }
  };

  const handleDocumentEdit = (document) => {
    setEditingDocumentId(document.id);
    setDocumentForm({
      type: document.type || 'Passport',
      status: document.status || 'Pending',
      reference: document.reference || '',
      notes: document.notes || '',
    });
    setFeedback(null);
  };

  const handleDocumentDelete = async (documentId) => {
    if (!documentId) return;
    setFeedback(null);
    try {
      await onDeleteDocument?.(documentId);
      if (editingDocumentId === documentId) {
        setEditingDocumentId(null);
        setDocumentForm(DEFAULT_DOCUMENT_FORM);
      }
      setFeedback({ type: 'success', message: 'Verification document removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove verification document.' });
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">ID verification</p>
          <h2 className="text-2xl font-semibold text-slate-900">Stay compliant with up-to-date documentation</h2>
          <p className="text-sm text-slate-600">
            Track identity and business verification in one place. Upload refreshed documents, monitor compliance status, and
            respond to action items before they impact payouts.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <CheckBadgeIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleStatusSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Verification status</h3>
            <span className="text-xs font-semibold text-slate-500">Last submitted {formatTimestamp(verification?.lastSubmittedAt)}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={statusForm.status}
                onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {VERIFICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Notes
            <textarea
              rows={4}
              value={statusForm.notes}
              onChange={(event) => setStatusForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Updating status…' : 'Update verification status'}
          </button>
        </form>

        <form onSubmit={handleDocumentSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingDocumentId ? 'Update verification document' : 'Add verification document'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingDocumentId(null);
                setDocumentForm(DEFAULT_DOCUMENT_FORM);
                setFeedback(null);
              }}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Document type
              <select
                value={documentForm.type}
                onChange={(event) => setDocumentForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={documentForm.status}
                onChange={(event) => setDocumentForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {DOCUMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Reference
            <input
              type="text"
              value={documentForm.reference}
              onChange={(event) => setDocumentForm((current) => ({ ...current, reference: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Notes
            <textarea
              rows={4}
              value={documentForm.notes}
              onChange={(event) => setDocumentForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving document…' : editingDocumentId ? 'Update document' : 'Submit document'}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Verification documents</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Submitted
                </th>
                <th scope="col" className="px-4 py-3">
                  Notes
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((document) => (
                <tr key={document.id} className="align-top">
                  <td className="px-4 py-3 text-slate-700">{document.type}</td>
                  <td className="px-4 py-3 text-slate-500">{document.reference || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {document.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatTimestamp(document.submittedAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{document.notes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDocumentEdit(document)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDocumentDelete(document.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!documents.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                    No documents submitted yet. Upload your first identity document to get started.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Next action</h4>
        <p className="mt-2 text-base text-slate-900">{verification?.nextAction || 'All checks complete.'}</p>
      </div>
    </section>
  );
}

MentorVerificationSection.propTypes = {
  verification: PropTypes.shape({
    status: PropTypes.string,
    notes: PropTypes.string,
    lastSubmittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    nextAction: PropTypes.string,
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        type: PropTypes.string,
        status: PropTypes.string,
        reference: PropTypes.string,
        notes: PropTypes.string,
        submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  }),
  onUpdateStatus: PropTypes.func,
  onCreateDocument: PropTypes.func,
  onUpdateDocument: PropTypes.func,
  onDeleteDocument: PropTypes.func,
  saving: PropTypes.bool,
};

MentorVerificationSection.defaultProps = {
  verification: null,
  onUpdateStatus: undefined,
  onCreateDocument: undefined,
  onUpdateDocument: undefined,
  onDeleteDocument: undefined,
  saving: false,
};
