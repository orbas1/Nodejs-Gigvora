import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EscrowDrawer({ title, subtitle, open, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-2xl flex-col rounded-l-3xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            aria-label="Close panel"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

EscrowDrawer.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  footer: PropTypes.node,
};

EscrowDrawer.defaultProps = {
  subtitle: null,
  open: false,
  onClose: () => {},
  children: null,
  footer: null,
};
