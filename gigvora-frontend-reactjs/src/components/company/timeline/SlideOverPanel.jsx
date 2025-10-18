import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SlideOverPanel({ open, title, children, footer, width, onClose }) {
  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" onMouseDown={handleBackdropClick}>
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" />
      <div className="relative ml-auto flex h-full w-full max-w-full" style={{ maxWidth: width }}>
        <div className="flex h-full w-full flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close panel"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

SlideOverPanel.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
  width: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

SlideOverPanel.defaultProps = {
  open: false,
  children: null,
  footer: null,
  width: '36rem',
};
