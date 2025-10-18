import { useEffect } from 'react';
import PropTypes from 'prop-types';

export default function Modal({ open, onClose, title, description, children, wide = false }) {
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-full w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${
          wide ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="custom-scrollbar overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  wide: PropTypes.bool,
};

Modal.defaultProps = {
  open: false,
  onClose: undefined,
  title: '',
  description: '',
  children: null,
  wide: false,
};
