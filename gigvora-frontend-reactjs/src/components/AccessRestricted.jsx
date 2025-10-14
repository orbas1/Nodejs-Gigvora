import PropTypes from 'prop-types';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const toneClasses = {
  rose: {
    container: 'border-rose-200 bg-rose-50/70',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600',
  },
  sky: {
    container: 'border-sky-200 bg-sky-50/70',
    text: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700 focus-visible:outline-sky-600',
  },
  amber: {
    container: 'border-amber-200 bg-amber-50/70',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600',
  },
};

export default function AccessRestricted({
  title,
  description,
  badge,
  actionLabel,
  onAction,
  actionHref,
  tone = 'rose',
  icon: Icon = ShieldExclamationIcon,
}) {
  const tonePreset = toneClasses[tone] ?? toneClasses.rose;
  const isLink = typeof actionHref === 'string' && actionHref.length > 0;

  return (
    <section className={`rounded-3xl border ${tonePreset.container} p-10 text-center shadow-soft`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
        <Icon className={`h-8 w-8 ${tonePreset.text}`} aria-hidden="true" />
      </div>
      {badge ? (
        <p className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${tonePreset.badge}`}>
          {badge}
        </p>
      ) : null}
      <h2 className={`mt-6 text-2xl font-black tracking-tight ${tonePreset.text}`}>{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">{description}</p>
      {actionLabel && (
        <div className="mt-8">
          {isLink ? (
            <a
              href={actionHref}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tonePreset.button}`}
            >
              {actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tonePreset.button}`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

AccessRestricted.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  badge: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionHref: PropTypes.string,
  tone: PropTypes.oneOf(['rose', 'sky', 'amber']),
  icon: PropTypes.elementType,
};
