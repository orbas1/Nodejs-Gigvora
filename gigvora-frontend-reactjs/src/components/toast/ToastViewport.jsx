import { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const toneConfig = {
  success: {
    Icon: CheckCircleIcon,
    container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  error: {
    Icon: ExclamationTriangleIcon,
    container: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  info: {
    Icon: InformationCircleIcon,
    container: 'border-slate-200 bg-white text-slate-700',
  },
};

export default function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[1050] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

ToastViewport.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tone: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
      title: PropTypes.string,
      message: PropTypes.string,
      duration: PropTypes.number,
    }),
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

function ToastItem({ toast, onDismiss }) {
  const { id, tone, title, message, duration } = toast;
  const config = toneConfig[tone] ?? toneConfig.info;
  const { Icon } = config;

  useEffect(() => {
    if (!duration || duration === Infinity) {
      return undefined;
    }

    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [duration, id, onDismiss]);

  return (
    <Transition
      appear
      show
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="translate-y-3 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={`pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-soft ${config.container}`}>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
          <div className="flex-1 text-sm">
            {title ? <p className="font-semibold">{title}</p> : null}
            {message ? <p className={title ? 'mt-1' : undefined}>{message}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-inherit transition hover:bg-black/5"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Dismiss notification</span>
          </button>
        </div>
      </div>
    </Transition>
  );
}

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    duration: PropTypes.number,
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};
