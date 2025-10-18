import { XMarkIcon } from '@heroicons/react/24/outline';

export default function OverlayModal({ open, onClose, title, children, maxWidth = 'max-w-3xl' }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className={`relative w-full ${maxWidth} rounded-3xl bg-white p-6 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          {title ? <h3 className="text-lg font-semibold text-slate-900">{title}</h3> : <span />}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
          >
            <XMarkIcon className="h-4 w-4" />
            Close
          </button>
        </div>
        <div className="mt-6 max-h-[70vh] overflow-y-auto pr-2">{children}</div>
      </div>
    </div>
  );
}
