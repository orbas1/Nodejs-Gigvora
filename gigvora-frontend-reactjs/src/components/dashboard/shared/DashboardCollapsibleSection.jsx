import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';

const TONES = {
  default: 'border-slate-200 bg-white',
  indigo: 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white',
  slate: 'border-slate-200 bg-slate-50/80',
  emerald: 'border-emerald-200 bg-emerald-50/70',
  amber: 'border-amber-200 bg-amber-50/70',
};

function resolveToneClassName(tone) {
  if (!tone) {
    return TONES.default;
  }
  return TONES[tone] ?? TONES.default;
}

export default function DashboardCollapsibleSection({
  id,
  anchorId,
  title,
  subtitle,
  description,
  badge,
  meta,
  tone,
  defaultOpen,
  children,
  onToggle,
  actions,
}) {
  const [open, setOpen] = useState(() => defaultOpen !== false);
  const bodyId = useId();
  const resolvedAnchorId = anchorId || id;
  const headerId = useMemo(() => `${resolvedAnchorId || bodyId}-header`, [resolvedAnchorId, bodyId]);

  const handleToggle = () => {
    setOpen((current) => {
      const next = !current;
      if (typeof onToggle === 'function') {
        onToggle(next);
      }
      return next;
    });
  };

  return (
    <section
      id={resolvedAnchorId}
      aria-labelledby={headerId}
      className={classNames(
        'space-y-5 rounded-4xl border p-6 shadow-soft transition',
        resolveToneClassName(tone),
        open ? 'opacity-100' : 'opacity-80 hover:shadow-md',
      )}
      data-collapsed={open ? 'false' : 'true'}
    >
      <header id={headerId} className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{badge || 'Dashboard'}</p>
            {subtitle ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {subtitle}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              aria-expanded={open}
              aria-controls={bodyId}
            >
              <ChevronDownIcon
                className={classNames('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
              />
              <span className="ml-2">{open ? 'Collapse' : 'Expand'}</span>
            </button>
          </div>
          {description ? <p className="max-w-4xl text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-500 lg:items-end">
          {meta}
          {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
        </div>
      </header>
      <div id={bodyId} hidden={!open} className="space-y-6">
        {children}
      </div>
    </section>
  );
}

DashboardCollapsibleSection.propTypes = {
  id: PropTypes.string,
  anchorId: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.node,
  badge: PropTypes.string,
  meta: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'indigo', 'slate', 'emerald', 'amber']),
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onToggle: PropTypes.func,
  actions: PropTypes.node,
};

DashboardCollapsibleSection.defaultProps = {
  id: undefined,
  anchorId: undefined,
  subtitle: undefined,
  description: undefined,
  badge: undefined,
  meta: null,
  tone: 'default',
  defaultOpen: true,
  onToggle: undefined,
  actions: null,
};
