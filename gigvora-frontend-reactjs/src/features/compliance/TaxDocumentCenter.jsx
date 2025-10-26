import { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowUpOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../../components/DataStatus.jsx';
import useTaxDocuments from '../../hooks/useTaxDocuments.js';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const FALLBACK = {
  summary: {
    totalFilings: 0,
    outstandingFilings: 0,
    overdueFilings: 0,
    submittedFilings: 0,
    nextDeadline: null,
    updatedAt: null,
  },
  reminders: [],
};

function SummaryCard({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${tone ?? 'border-slate-200 bg-white text-slate-700'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  tone: PropTypes.string,
};

function downloadBase64({ data, fileName, contentType }) {
  const base64 = data.includes('base64,') ? data.split('base64,')[1] : data;
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([buffer], { type: contentType ?? 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName ?? 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DocumentTable({ documents, onUpload, onAcknowledge, onDownload }) {
  const inputRefs = useRef(new Map());

  const handleFileChange = useCallback(
    async (filingId, event) => {
      const [file] = event.target.files ?? [];
      if (file) {
        await onUpload(filingId, file);
        event.target.value = '';
      }
    },
    [onUpload],
  );

  const triggerUpload = (filingId) => {
    const input = inputRefs.current.get(filingId);
    if (input) {
      input.click();
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Document</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Due</th>
            <th scope="col" className="px-4 py-3">Reminders</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
          {documents.map((doc) => (
            <tr key={doc.filingId}>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-800">{doc.name}</div>
                <div className="text-xs text-slate-500">{doc.jurisdiction ?? 'Global'}</div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {doc.dueDate ? (
                  <div>
                    <p>{formatDateLabel(doc.dueDate)}</p>
                    <p className="text-xs text-slate-500">{formatRelativeTime(doc.dueDate)}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">N/A</span>
                )}
              </td>
              <td className="px-4 py-3">
                {doc.reminders?.length ? (
                  <ul className="space-y-1 text-xs text-slate-500">
                    {doc.reminders.map((reminder) => (
                      <li key={reminder.id}>
                        <span className="font-semibold text-slate-700">{reminder.reminderType.replace(/_/g, ' ')}</span> ·
                        {formatDateLabel(reminder.dueAt)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-500">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDownload(doc.filingId)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerUpload(doc.filingId)}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    Upload
                  </button>
                  <input
                    ref={(element) => {
                      if (element) {
                        inputRefs.current.set(doc.filingId, element);
                      }
                    }}
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/*"
                    onChange={(event) => handleFileChange(doc.filingId, event)}
                  />
                  {doc.requiresAction ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(doc.filingId)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
                    >
                      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Mark submitted
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

DocumentTable.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUpload: PropTypes.func.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
};

function ReminderBoard({ reminders, onSnooze }) {
  if (!reminders.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <p>No upcoming alerts.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div key={reminder.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{reminder.reminderType.replace(/_/g, ' ')}</p>
              <p className="text-xs text-amber-700">Due {formatDateLabel(reminder.dueAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => onSnooze(reminder.id)}
              className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 hover:bg-amber-100"
            >
              Snooze 7d
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

ReminderBoard.propTypes = {
  reminders: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSnooze: PropTypes.func.isRequired,
};

export default function TaxDocumentCenter({ freelancerId, lookbackYears }) {
  const { data, loading, error, refresh, acknowledge, upload, download, snooze, actionState } = useTaxDocuments({
    freelancerId,
    lookbackYears,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const documents = useMemo(() => {
    const source = data?.documents ?? [];
    return source.filter((doc) => {
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchesSearch = search
        ? [doc.name, doc.jurisdiction].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [data?.documents, statusFilter, search]);

  const handleAcknowledge = useCallback(
    async (filingId) => {
      await acknowledge(filingId, {});
    },
    [acknowledge],
  );

  const handleUpload = useCallback(
    async (filingId, file) => {
      await upload(filingId, { file });
    },
    [upload],
  );

  const handleDownload = useCallback(
    async (filingId) => {
      const response = await download(filingId);
      if (response?.payload) {
        downloadBase64({
          data: response.payload.data,
          fileName: response.payload.fileName,
          contentType: response.payload.contentType,
        });
      }
    },
    [download],
  );

  const handleSnooze = useCallback(
    async (reminderId) => {
      await snooze(reminderId, { days: 7 });
    },
    [snooze],
  );

  const summary = data?.summary ?? FALLBACK.summary;

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Tax documents</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Centralise tax filings and submission evidence</h2>
          <p className="mt-2 text-sm text-slate-600">
            Track statutory obligations across regions, upload evidence packages, and acknowledge filings as they move to
            completion.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <p className="font-semibold uppercase tracking-wide">Next deadline</p>
          <p>{summary.nextDeadline ? formatDateLabel(summary.nextDeadline) : 'No upcoming deadlines'}</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total filings" value={summary.totalFilings ?? 0} />
        <SummaryCard label="Outstanding" value={summary.outstandingFilings ?? 0} tone="border-amber-200 bg-amber-50 text-amber-800" />
        <SummaryCard label="Overdue" value={summary.overdueFilings ?? 0} tone="border-rose-200 bg-rose-50 text-rose-700" />
        <SummaryCard label="Submitted" value={summary.submittedFilings ?? 0} tone="border-emerald-200 bg-emerald-50 text-emerald-700" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-full border px-3 py-1 ${statusFilter === 'all' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}
          >
            All statuses
          </button>
          {['not_started', 'in_progress', 'submitted', 'overdue'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1 capitalize ${
                statusFilter === status ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <InformationCircleIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by jurisdiction or name"
            className="w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-sm shadow-inner sm:w-64"
          />
        </label>
      </div>

      <DataStatus
        loading={loading || actionState.status === 'pending'}
        error={error ?? actionState.error}
        lastUpdated={summary.updatedAt}
        onRefresh={refresh}
        statusLabel="Tax documents"
      >
        <DocumentTable
          documents={documents}
          onUpload={handleUpload}
          onAcknowledge={handleAcknowledge}
          onDownload={handleDownload}
        />

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Upcoming alerts</h3>
          <ReminderBoard reminders={data?.reminders ?? []} onSnooze={handleSnooze} />
        </div>
      </DataStatus>
    </section>
  );
}

TaxDocumentCenter.propTypes = {
  freelancerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lookbackYears: PropTypes.number,
};
