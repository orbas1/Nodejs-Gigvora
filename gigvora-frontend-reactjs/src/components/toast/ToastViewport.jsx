import { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const toneConfig = {
  success: {
    Icon: CheckCircleIcon,
    container: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  },
  error: {
    Icon: ExclamationTriangleIcon,
    container: 'border-rose-200/80 bg-rose-50 text-rose-700',
  },
  info: {
    Icon: InformationCircleIcon,
    container: 'border-slate-200 bg-white text-slate-700',
  },
};

function withAlpha(color, alphaHex = '4d') {
  if (!color || typeof color !== 'string') {
    return color;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}${alphaHex}`;
  }
  return color;
}

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
      content: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
      className: PropTypes.string,
      style: PropTypes.object,
      accent: PropTypes.string,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          onPress: PropTypes.func,
          href: PropTypes.string,
          variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
        }),
      ),
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
      <div
        className={clsx(
          'pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-soft backdrop-blur',
          config.container,
          toast.className,
        )}
        style={{
          ...toast.style,
          borderColor: toast.accent ?? toast.style?.borderColor,
          boxShadow:
            toast.style?.boxShadow ??
            (toast.accent && /^#[0-9a-fA-F]{6}$/.test(toast.accent)
              ? `0 18px 40px -24px ${withAlpha(toast.accent, '66')}`
              : undefined),
          backgroundImage:
            toast.style?.backgroundImage ??
            (toast.accent && /^#[0-9a-fA-F]{6}$/.test(toast.accent)
              ? `linear-gradient(135deg, ${withAlpha(toast.accent, '14')} 0%, rgba(255,255,255,0.96) 65%)`
              : undefined),
        }}
      >
        {renderContent({ toast, Icon, title, message, onDismiss })}
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
    content: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    className: PropTypes.string,
    style: PropTypes.object,
    accent: PropTypes.string,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        onPress: PropTypes.func,
        href: PropTypes.string,
        variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
      }),
    ),
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

function renderContent({ toast, Icon, title, message, onDismiss }) {
  if (toast.content) {
    const content =
      typeof toast.content === 'function'
        ? toast.content({ toast, dismiss: () => onDismiss(toast.id) })
        : toast.content;
    if (content) {
      return (
        <div className="relative text-sm text-slate-800">
          <DismissButton onDismiss={onDismiss} id={toast.id} className="absolute right-0 top-0" />
          <div className="flex flex-col gap-3 pr-8">{content}</div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
        <div className="flex-1 text-sm">
          {title ? <p className="font-semibold text-inherit">{title}</p> : null}
          {message ? <p className={title ? 'mt-1 text-inherit/90' : 'text-inherit/90'}>{message}</p> : null}
        </div>
        <DismissButton onDismiss={onDismiss} id={toast.id} />
      </div>
      {toast.actions && toast.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2 pl-8">
          {toast.actions.map((action, index) => (
            <ToastAction key={`${toast.id}-action-${index}`} action={action} dismiss={() => onDismiss(toast.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DismissButton({ onDismiss, id, className }) {
  return (
    <button
      type="button"
      onClick={() => onDismiss(id)}
      className={clsx(
        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-inherit transition hover:bg-black/5',
        className,
      )}
    >
      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Dismiss notification</span>
    </button>
  );
}

DismissButton.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
};

function ToastAction({ action, dismiss }) {
  const { label, onPress, href, variant = 'primary' } = action;
  const baseClasses =
    'inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white/80';
  const variantClasses = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500',
    secondary: 'bg-white/80 text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-white focus-visible:ring-slate-400',
    ghost: 'bg-transparent text-slate-900 hover:bg-slate-900/5 focus-visible:ring-slate-400',
  };

  const handleClick = (event) => {
    if (onPress) {
      onPress(event);
    }
    if (!event.defaultPrevented) {
      dismiss();
    }
  };

  if (href) {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={clsx(baseClasses, variantClasses[variant] ?? variantClasses.primary)}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(baseClasses, variantClasses[variant] ?? variantClasses.primary)}
    >
      {label}
    </button>
  );
}

ToastAction.propTypes = {
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onPress: PropTypes.func,
    href: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost']),
  }).isRequired,
  dismiss: PropTypes.func.isRequired,
};
