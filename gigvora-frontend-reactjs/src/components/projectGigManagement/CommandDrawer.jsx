import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
};

export default function CommandDrawer({ open, title, subtitle, onClose, children, footer, size = 'md' }) {
  if (!open) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex" onClick={handleOverlayClick}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <aside
        className={`relative ml-auto flex h-full w-full flex-col bg-white shadow-2xl ${SIZE_CLASS[size] ?? SIZE_CLASS.md}`}
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close drawer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <footer className="border-t border-slate-200 px-6 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}

CommandDrawer.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onClose: PropTypes.func,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};

CommandDrawer.defaultProps = {
  open: false,
  subtitle: null,
  onClose: undefined,
  children: null,
  footer: null,
  size: 'md',
};
