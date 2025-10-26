import { useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';

const WIDTH_MAP = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

const VARIANT_CONFIG = {
  modal: {
    root: 'fixed inset-0 z-[120] flex items-center justify-center px-4 py-8',
    surface: 'relative flex max-h-full w-full flex-col overflow-hidden',
    backdropClassName: 'gv-overlay-backdrop backdrop-blur-sm',
  },
  panel: {
    root: 'fixed inset-0 z-[120] flex items-center justify-center px-4 py-10',
    surface: 'relative flex max-h-full w-full flex-col overflow-hidden',
    backdropClassName: 'gv-overlay-backdrop backdrop-blur-sm',
  },
  drawer: {
    root: 'fixed inset-0 z-[120] flex justify-end',
    surface: 'relative flex h-full max-h-full w-full flex-col overflow-hidden border-l border-[var(--gv-color-border)]',
    backdropClassName: 'gv-overlay-backdrop-contrast backdrop-blur-sm',
  },
};

function CloseButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[var(--gv-color-border)] px-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gv-color-text-muted)] transition hover:border-[var(--gv-color-border-strong)] hover:text-[var(--gv-color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gv-color-primary)] focus-visible:ring-offset-2"
    >
      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

CloseButton.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string,
};

CloseButton.defaultProps = {
  onClick: undefined,
  label: 'Close',
};

export default function OverlayFrame({
  open,
  onClose,
  title,
  description,
  children,
  width = 'md',
  variant = 'modal',
  footer,
  labelledBy,
  describedBy,
  bodyClassName,
  className,
}) {
  const instanceId = useId();
  useEffect(() => {
    if (!open || typeof window === 'undefined') {
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

  const variantConfig = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.modal;
  const widthClass = WIDTH_MAP[width] ?? WIDTH_MAP.md;
  const shouldRenderHeader = Boolean(title || description);

  const headerId = labelledBy || (title ? `${instanceId}-title` : undefined);
  const descriptionId = describedBy || (description ? `${instanceId}-description` : undefined);

  return (
    <div className={classNames(variantConfig.root)}>
      <div
        className={classNames('absolute inset-0', variantConfig.backdropClassName)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headerId}
        aria-describedby={descriptionId}
        className={classNames(
          'gv-overlay-surface',
          variant === 'drawer' ? 'h-full rounded-none rounded-l-[var(--gv-radius-lg)]' : 'rounded-[var(--gv-radius-lg)]',
          widthClass,
          variantConfig.surface,
          className,
        )}
      >
        {shouldRenderHeader ? (
          <header className="gv-overlay-section flex items-start justify-between gap-4 px-6 py-5">
            <div className="space-y-1">
              {title ? (
                <h2 id={headerId} className="text-lg font-semibold text-[var(--gv-color-text)]">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="text-sm text-[var(--gv-color-text-muted)]">
                  {description}
                </p>
              ) : null}
            </div>
            {onClose ? <CloseButton onClick={onClose} /> : null}
          </header>
        ) : null}
        {!shouldRenderHeader && onClose ? (
          <div className="absolute right-6 top-6 hidden sm:block">
            <CloseButton onClick={onClose} />
          </div>
        ) : null}
        <div className={classNames('custom-scrollbar flex-1 overflow-y-auto px-6 py-6', bodyClassName)}>{children}</div>
        {footer ? (
          <footer className="flex flex-col gap-3 border-t border-[var(--gv-color-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

OverlayFrame.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.node,
  width: PropTypes.oneOf(Object.keys(WIDTH_MAP)),
  variant: PropTypes.oneOf(Object.keys(VARIANT_CONFIG)),
  footer: PropTypes.node,
  labelledBy: PropTypes.string,
  describedBy: PropTypes.string,
  bodyClassName: PropTypes.string,
  className: PropTypes.string,
};

OverlayFrame.defaultProps = {
  open: false,
  onClose: undefined,
  title: null,
  description: null,
  children: null,
  width: 'md',
  variant: 'modal',
  footer: null,
  labelledBy: undefined,
  describedBy: undefined,
  bodyClassName: undefined,
  className: undefined,
};
