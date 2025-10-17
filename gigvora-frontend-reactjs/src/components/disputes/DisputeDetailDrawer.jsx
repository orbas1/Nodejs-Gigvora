import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChevronDoubleUpIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { readFileAsBase64, humanFileSize } from '../../utils/file.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

function humanize(value) {
  if (!value) return '';
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${amount}`;
  }
}

const ALLOWED_STATUS_VALUES = new Set(['open', 'awaiting_customer', 'under_review', 'settled']);

export default function DisputeDetailDrawer({ open, inline = false, dispute, metadata, busy, onClose, onSubmit }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    notes: '',
    actionType: 'comment',
    stage: dispute?.stage ?? '',
    status: dispute?.status ?? '',
    customerDeadlineAt: dispute?.customerDeadlineAt ?? '',
    providerDeadlineAt: dispute?.providerDeadlineAt ?? '',
    resolutionNotes: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && dispute) {
      setForm({
        notes: '',
        actionType: 'comment',
        stage: dispute.stage ?? '',
        status: dispute.status ?? '',
        customerDeadlineAt: dispute.customerDeadlineAt ?? '',
        providerDeadlineAt: dispute.providerDeadlineAt ?? '',
        resolutionNotes: '',
      });
      setSelectedFile(null);
      setError(null);
    }
  }, [open, dispute]);

  const stages = useMemo(() => metadata?.stages ?? [], [metadata]);
  const statuses = useMemo(
    () => (metadata?.statuses ?? []).filter((option) => ALLOWED_STATUS_VALUES.has(option.value ?? option)),
    [metadata],
  );
  const actionTypes = useMemo(() => metadata?.actionTypes ?? [], [metadata]);

  const events = useMemo(() => dispute?.events ?? [], [dispute]);
  const attachments = useMemo(() => dispute?.attachments ?? [], [dispute]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.notes.trim() && !selectedFile) {
      setError('Add a note or upload evidence before submitting.');
      return;
    }
    setError(null);
    try {
      let evidence = null;
      if (selectedFile) {
        const content = await readFileAsBase64(selectedFile);
        evidence = {
          content,
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
        };
      }
      await onSubmit({
        notes: form.notes.trim(),
        actionType: form.actionType || 'comment',
        stage: form.stage || undefined,
        status: form.status || undefined,
        customerDeadlineAt: form.customerDeadlineAt || undefined,
        providerDeadlineAt: form.providerDeadlineAt || undefined,
        resolutionNotes: form.resolutionNotes || undefined,
        evidence,
      });
      setForm((previous) => ({ ...previous, notes: '', resolutionNotes: '' }));
      setSelectedFile(null);
    } catch (submissionError) {
      setError(submissionError.message || 'Failed to update dispute.');
    }
  };

  if (!dispute) {
    return null;
  }

  const disputeStatusTone = useMemo(() => {
    const status = dispute?.status;
    if (!status) return 'bg-slate-100 text-slate-600';
    if (status === 'awaiting_customer') return 'bg-amber-100 text-amber-700';
    if (status === 'settled') return 'bg-emerald-100 text-emerald-700';
    if (status === 'closed') return 'bg-slate-100 text-slate-600';
    return 'bg-blue-100 text-blue-700';
  }, [dispute]);

  const TitleElement = inline ? 'h2' : Dialog.Title;

  const panelContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-slate-200 p-6">
        <div>
          <TitleElement className="text-xl font-semibold text-slate-900">
            Dispute #{dispute?.id ?? '—'}
          </TitleElement>
          <p className="mt-1 text-sm text-slate-600">
            Stage {humanize(dispute?.stage)} · Status{' '}
            <span className={classNames('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', disputeStatusTone)}>
              {humanize(dispute?.status)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
          disabled={busy}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700">Transaction</h3>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {dispute?.transaction?.displayName ?? `Escrow ${dispute?.transaction?.reference ?? '—'}`}
            </p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Amount</dt>
                <dd>{formatCurrency(dispute?.transaction?.amount, dispute?.transaction?.currencyCode)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Reference</dt>
                <dd>{dispute?.transaction?.reference ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Opened</dt>
                <dd>{formatAbsolute(dispute?.openedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Last update</dt>
                <dd>{formatRelativeTime(dispute?.updatedAt)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700">Metrics</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.daysOpen ?? 0} days open</span>
              </li>
              <li className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.eventCount ?? 0} timeline entries</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.attachmentCount ?? 0} evidence files</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
            <p className="mt-2 whitespace-pre-line rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              {dispute?.summary ?? 'No summary captured.'}
            </p>
          </section>

          {attachments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Evidence</h3>
              <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <PaperClipIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-800">{attachment.fileName}</p>
                        <p className="text-xs text-slate-500">
                          Uploaded {formatRelativeTime(attachment.uploadedAt)} · {attachment.contentType}
                        </p>
                      </div>
                    </div>
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-accent hover:text-accent"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
            <ol className="mt-3 space-y-4">
              {events.map((event) => (
                <li key={event.id} className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="absolute -left-2 top-4 h-4 w-4 rounded-full border-2 border-white bg-accent" aria-hidden="true" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{humanize(event.actionType)}</span>
                    <span>{formatAbsolute(event.eventAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{event.notes || 'No notes provided.'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {event.actor && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        <ChevronDoubleUpIcon className="h-3 w-3" aria-hidden="true" />
                        {event.actor.firstName ? `${event.actor.firstName} ${event.actor.lastName ?? ''}`.trim() : `Actor ${event.actor.id}`}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{humanize(event.actorType)}</span>
                    {event.evidenceFileName && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Evidence attached</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Stage
              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                <option value="">No change</option>
                {stages.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                <option value="">No change</option>
                {statuses.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Action type
              <select
                name="actionType"
                value={form.actionType}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                {actionTypes.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Your deadline
              <input
                type="datetime-local"
                name="customerDeadlineAt"
                value={form.customerDeadlineAt ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Partner deadline
              <input
                type="datetime-local"
                name="providerDeadlineAt"
                value={form.providerDeadlineAt ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              />
            </label>
          </div>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Share updates or clarifications."
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Resolution notes
            <textarea
              name="resolutionNotes"
              value={form.resolutionNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Capture agreed outcomes."
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={busy}
            />
          </label>

          <div className="rounded-3xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-medium text-slate-700">Attach new evidence</p>
            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                <span>Upload evidence</span>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={busy} />
              </label>
              {selectedFile && <span className="text-xs text-slate-600">{selectedFile.name} · {humanFileSize(selectedFile.size)}</span>}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              disabled={busy}
            >
              Close
            </button>
            <button
              type="submit"
              className={classNames(
                'rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition',
                form.notes.trim() || selectedFile
                  ? 'bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40'
                  : 'bg-slate-400 cursor-not-allowed',
              )}
              disabled={busy || (!form.notes.trim() && !selectedFile)}
            >
              {busy ? 'Saving…' : 'Submit update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (inline) {
    return <div className="flex h-full flex-col">{panelContent}</div>;
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-2xl">
                  {panelContent}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
