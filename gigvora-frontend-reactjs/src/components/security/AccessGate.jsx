import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

function resolveActionProps(action) {
  if (!action) {
    return null;
  }

  const { to, href, label, onClick, variant = 'primary' } = action;
  const baseClassName =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

  const variantClassName =
    variant === 'secondary'
      ? 'border border-slate-200 bg-white/80 text-slate-700 hover:border-blue-200 hover:text-blue-600'
      : 'bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accentDark';

  const className = `${baseClassName} ${variantClassName}`;

  if (to) {
    return {
      component: Link,
      props: { to, className, onClick },
    };
  }

  if (href) {
    return {
      component: 'a',
      props: {
        href,
        className,
        onClick,
        target: action.target ?? '_blank',
        rel: action.rel ?? 'noreferrer',
      },
    };
  }

  return {
    component: 'button',
    props: {
      type: 'button',
      className,
      onClick,
    },
  };
}

export default function AccessGate({
  title,
  description,
  requirements = [],
  primaryAction,
  secondaryAction,
}) {
  const primary = resolveActionProps(primaryAction);
  const secondary = resolveActionProps(secondaryAction ? { ...secondaryAction, variant: 'secondary' } : null);
  const PrimaryComponent = primary?.component;
  const SecondaryComponent = secondary?.component;

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 px-6 py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center"
        aria-hidden="true"
      >
        <div className="h-64 w-full max-w-4xl rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-[-10%] -z-10 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)] sm:block"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-accent shadow-xl shadow-accent/10">
          <ShieldExclamationIcon className="h-8 w-8" aria-hidden="true" />
        </span>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="text-base text-slate-600 sm:text-lg">{description}</p>
        </div>
        {requirements.length ? (
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Requirements</p>
            <ul className="mt-4 space-y-3 text-left">
              {requirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600"
                >
                  <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {PrimaryComponent ? (
            <PrimaryComponent {...primary.props}>{primaryAction.label}</PrimaryComponent>
          ) : null}
          {SecondaryComponent ? (
            <SecondaryComponent {...secondary.props}>{secondaryAction.label}</SecondaryComponent>
          ) : null}
        </div>
      </div>
    </section>
  );
}

AccessGate.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  requirements: PropTypes.arrayOf(PropTypes.string),
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func,
    target: PropTypes.string,
    rel: PropTypes.string,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
    href: PropTypes.string,
    onClick: PropTypes.func,
    target: PropTypes.string,
    rel: PropTypes.string,
  }),
};

AccessGate.defaultProps = {
  requirements: [],
  primaryAction: null,
  secondaryAction: null,
};
