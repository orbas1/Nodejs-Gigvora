import PropTypes from 'prop-types';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const VARIANT_CLASSES = {
  surface: 'rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft',
  translucent: 'rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-soft backdrop-blur',
  minimal: '',
  dark: 'rounded-3xl border border-slate-900/10 bg-slate-900 text-white p-6 shadow-xl',
};

export default function AdminGovernanceSection({
  id,
  kicker,
  title,
  description,
  badge,
  meta,
  actions,
  variant,
  className,
  contentClassName,
  children,
}) {
  const variantClassName = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.surface;
  return (
    <section id={id} className={joinClassNames('space-y-6', variantClassName, className)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          {kicker ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{kicker}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {badge}
              </span>
            ) : null}
          </div>
          {description ? <p className="text-sm text-slate-600 dark:text-slate-200">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {meta}
          {actions}
        </div>
      </header>
      <div className={joinClassNames('space-y-4', contentClassName)}>{children}</div>
    </section>
  );
}

AdminGovernanceSection.propTypes = {
  id: PropTypes.string,
  kicker: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  badge: PropTypes.node,
  meta: PropTypes.node,
  actions: PropTypes.node,
  variant: PropTypes.oneOf(['surface', 'translucent', 'minimal', 'dark']),
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  children: PropTypes.node,
};

AdminGovernanceSection.defaultProps = {
  id: undefined,
  kicker: undefined,
  description: undefined,
  badge: undefined,
  meta: null,
  actions: null,
  variant: 'surface',
  className: undefined,
  contentClassName: undefined,
  children: null,
};
