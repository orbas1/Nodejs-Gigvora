import { useId } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ModalShell({ title, subtitle, open, onClose, children, actions }) {
  if (!open) {
    return null;
  }

  const titleId = useId();
  const descriptionId = subtitle ? `${titleId}-description` : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div
        className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-8 py-6">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-200 hover:text-slate-900"
            >
            <XMarkIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
        {actions ? <div className="flex justify-end gap-3 border-t border-slate-200 px-8 py-5">{actions}</div> : null}
      </div>
    </div>
  );
}

ModalShell.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
};

ModalShell.defaultProps = {
  subtitle: null,
  open: false,
  children: null,
  actions: null,
};
