import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function SlideOut({ dispute, onClose }) {
  if (!dispute) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <button
        type="button"
        aria-label="Close dispute"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-rose-500">Case</p>
            <p className="text-lg font-semibold text-slate-900">{dispute.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{dispute.status?.replace(/_/g, ' ') ?? 'open'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Stage</p>
              <p className="mt-1 text-sm text-slate-700">{dispute.stage?.replace(/_/g, ' ') ?? 'review'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Priority</p>
              <p className="mt-1 text-sm text-slate-700">{dispute.priority ?? 'medium'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Opened</p>
              <p className="mt-1 text-sm text-slate-700">{formatDate(dispute.openedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Transaction</p>
              <p className="mt-1 text-sm text-slate-700">#{dispute.transactionId}</p>
            </div>
            {dispute.summary ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
                <p className="mt-1 text-sm text-slate-700">{dispute.summary}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EscrowDisputesPanel({ disputes }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-rose-50 p-2 text-rose-600">
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Disputes</h2>
            <p className="text-xs text-slate-500">Tap a card for full context.</p>
          </div>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
          {disputes?.length ?? 0} open
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {(disputes ?? []).length ? (
          disputes.map((dispute) => (
            <button
              key={dispute.id}
              type="button"
              onClick={() => setSelected(dispute)}
              className="w-full rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-left shadow-sm transition hover:border-rose-200 hover:shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-rose-700">Case {dispute.id}</p>
                  <p className="text-xs uppercase tracking-wide text-rose-500">{dispute.stage?.replace(/_/g, ' ')}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600">
                  {dispute.priority ?? 'medium'}
                </span>
              </div>
              <p
                className="mt-3 text-sm text-slate-700 overflow-hidden"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {dispute.summary || 'Details captured in panel.'}
              </p>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-rose-200 p-4 text-sm text-rose-600">
            No disputes in queue.
          </div>
        )}
      </div>

      <SlideOut dispute={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
