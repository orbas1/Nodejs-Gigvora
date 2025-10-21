import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function WalletDrawer({ title, subtitle, open, onClose, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = typeof document !== 'undefined' ? document.body.style.overflow : undefined;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    if (panelRef.current && typeof panelRef.current.focus === 'function') {
      panelRef.current.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = previousOverflow ?? '';
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 px-4 py-6 sm:px-8"
      onMouseDown={handleBackdropClick}
      role="presentation"
      data-testid="wallet-drawer-backdrop"
    >
      <div
        ref={panelRef}
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate text-xl font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close panel"
          >
            <span className="text-lg">×</span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</footer> : null}
      </div>
    </div>
  );
}

WalletDrawer.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
};

WalletDrawer.defaultProps = {
  subtitle: null,
  open: false,
  children: null,
  footer: null,
};

export default WalletDrawer;
