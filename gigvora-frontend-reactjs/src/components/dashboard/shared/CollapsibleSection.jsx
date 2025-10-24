import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function CollapsibleSection({
  id,
  title,
  description,
  badge,
  actions,
  defaultOpen,
  className,
  contentClassName,
  children,
}) {
  const generatedId = useId();
  const sectionId = id ?? generatedId;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={sectionId}
      className={clsx(
        'rounded-4xl border border-slate-200 bg-white shadow-soft transition-all',
        open ? 'p-8' : 'p-6',
        className,
      )}
      aria-expanded={open}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{badge}</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            aria-controls={`${sectionId}-content`}
          >
            {open ? (
              <>
                <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                Expand
              </>
            )}
          </button>
        </div>
      </header>
      {open ? (
        <div id={`${sectionId}-content`} className={clsx('mt-6 space-y-6', contentClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

CollapsibleSection.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  badge: PropTypes.string,
  actions: PropTypes.node,
  defaultOpen: PropTypes.bool,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
};

CollapsibleSection.defaultProps = {
  id: undefined,
  description: undefined,
  badge: 'Dashboard',
  actions: null,
  defaultOpen: true,
  className: undefined,
  contentClassName: undefined,
};
