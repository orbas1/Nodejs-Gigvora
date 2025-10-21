import PropTypes from 'prop-types';

export default function PageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="mb-12 space-y-6">
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-accentSoft bg-accentSoft/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">
          {eyebrow}
        </span>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
          {description ? <p className="max-w-2xl text-base text-slate-600 lg:text-lg">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      {meta ? <div className="text-sm text-slate-500">{meta}</div> : null}
    </header>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  meta: PropTypes.node,
};
