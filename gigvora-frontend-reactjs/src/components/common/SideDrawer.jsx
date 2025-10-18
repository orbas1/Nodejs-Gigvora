import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SideDrawer({ open, onClose, title, children, widthClass = 'max-w-xl' }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="hidden flex-1 bg-slate-900/40 lg:block" onClick={onClose} aria-hidden="true" />
      <div className={`relative w-full ${widthClass} bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
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
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
