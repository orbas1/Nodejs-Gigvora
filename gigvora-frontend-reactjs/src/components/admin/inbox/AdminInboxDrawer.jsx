import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';

export default function AdminInboxDrawer({ open, title, onClose, widthClass = 'max-w-xl', children, footer }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={classNames(
        'fixed inset-0 z-50 flex items-stretch justify-end overflow-hidden transition',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div
        className={classNames(
          'absolute inset-0 bg-slate-900/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => onClose?.()}
      />
      <div
        className={classNames(
          'relative flex h-full w-full transform bg-white shadow-2xl transition-transform',
          widthClass,
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-full w-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Close panel"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? <footer className="border-t border-slate-200 px-6 py-4">{footer}</footer> : null}
        </div>
      </div>
    </div>
  );
}
