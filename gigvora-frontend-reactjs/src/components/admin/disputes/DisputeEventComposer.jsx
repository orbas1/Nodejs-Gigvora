import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PaperClipIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';

const STAGE_OPTIONS = [
  { value: '', label: 'Keep current stage' },
  { value: 'intake', label: 'Intake' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Keep current status' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'under_review', label: 'Under review' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const ACTION_OPTIONS = [
  { value: 'comment', label: 'Comment' },
  { value: 'evidence_upload', label: 'Evidence uploaded' },
  { value: 'deadline_adjusted', label: 'Deadline adjusted' },
  { value: 'stage_advanced', label: 'Stage advanced' },
  { value: 'status_change', label: 'Status change' },
  { value: 'system_notice', label: 'System notice' },
];

const TRANSACTION_RESOLUTION_OPTIONS = [
  { value: '', label: 'No financial action' },
  { value: 'release', label: 'Release escrow to provider' },
  { value: 'refund', label: 'Refund escrow to customer' },
];

function toDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

function toIsoOrNull(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unable to read evidence file'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DisputeEventComposer({ dispute, onSubmit, loading, actorType, actorId }) {
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState('comment');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [customerDeadlineAt, setCustomerDeadlineAt] = useState('');
  const [providerDeadlineAt, setProviderDeadlineAt] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [transactionResolution, setTransactionResolution] = useState('');
  const [evidenceState, setEvidenceState] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    if (!dispute) {
      return;
    }
    setStage('');
    setStatus('');
    setCustomerDeadlineAt(toDateTimeInput(dispute.customerDeadlineAt));
    setProviderDeadlineAt(toDateTimeInput(dispute.providerDeadlineAt));
    setResolutionNotes(dispute.resolutionNotes ?? '');
    setTransactionResolution('');
    setNotes('');
    setActionType('comment');
    setEvidenceState(null);
    setFileError(null);
  }, [dispute]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setEvidenceState(null);
      setFileError(null);
      return;
    }
    setEvidenceLoading(true);
    setFileError(null);
    try {
      const content = await fileToBase64(file);
      setEvidenceState({
        content,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeLabel: `${Math.round(file.size / 1024)} KB`,
      });
      setActionType((current) => (current === 'comment' ? 'evidence_upload' : current));
    } catch (error) {
      setEvidenceState(null);
      setFileError(error.message);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      notes: notes || undefined,
      actionType,
      stage: stage || undefined,
      status: status || undefined,
      customerDeadlineAt: toIsoOrNull(customerDeadlineAt),
      providerDeadlineAt: toIsoOrNull(providerDeadlineAt),
      resolutionNotes: resolutionNotes || undefined,
      transactionResolution: transactionResolution || undefined,
      actorType: actorType ?? 'admin',
      actorId: actorId ?? undefined,
    };
    if (evidenceState) {
      payload.evidence = evidenceState;
    }
    onSubmit?.(payload);
  };

  const disableSubmit = loading || evidenceLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Update</h3>
        <button
          type="submit"
          disabled={disableSubmit}
          className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          {disableSubmit ? 'Saving…' : 'Publish update'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Stage
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value || 'current'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'current-status'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Customer deadline
          <input
            type="datetime-local"
            value={customerDeadlineAt}
            onChange={(event) => setCustomerDeadlineAt(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Provider deadline
          <input
            type="datetime-local"
            value={providerDeadlineAt}
            onChange={(event) => setProviderDeadlineAt(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Add notes"
          className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Action type
          <select
            value={actionType}
            onChange={(event) => setActionType(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Transaction action
          <select
            value={transactionResolution}
            onChange={(event) => setTransactionResolution(event.target.value)}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {TRANSACTION_RESOLUTION_OPTIONS.map((option) => (
              <option key={option.value || 'no-action'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Resolution notes
        <textarea
          value={resolutionNotes}
          onChange={(event) => setResolutionNotes(event.target.value)}
          rows={3}
          placeholder="Add resolution context"
          className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Attach evidence
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40">
          <span className="inline-flex items-center gap-2">
            <PaperClipIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            {evidenceState ? (
              <span className="font-medium text-slate-700">
                {evidenceState.fileName}{' '}
                <span className="text-xs text-slate-500">({evidenceState.sizeLabel})</span>
              </span>
            ) : (
              <span className="font-medium">Upload file</span>
            )}
          </span>
          <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.zip,.txt,.docx,.xlsx" />
        </label>
        {fileError ? <p className="text-xs text-rose-600">{fileError}</p> : null}
        {evidenceLoading ? <p className="text-xs text-slate-500">Encoding attachment…</p> : null}
      </div>
    </form>
  );
}

DisputeEventComposer.propTypes = {
  dispute: PropTypes.object,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  actorType: PropTypes.string,
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

DisputeEventComposer.defaultProps = {
  dispute: null,
  onSubmit: undefined,
  loading: false,
  actorType: 'admin',
  actorId: null,
};
