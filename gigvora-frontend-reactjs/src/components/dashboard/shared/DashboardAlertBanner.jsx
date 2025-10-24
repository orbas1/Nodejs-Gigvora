import PropTypes from 'prop-types';
import {
  BellAlertIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';

const TONE_CONFIG = {
  info: {
    icon: BellAlertIcon,
    container: 'border-sky-200 bg-sky-50 text-sky-700',
    badge: 'bg-sky-100 text-sky-600',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    container: 'border-amber-200 bg-amber-50 text-amber-700',
    badge: 'bg-amber-100 text-amber-600',
  },
  success: {
    icon: ShieldCheckIcon,
    container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-600',
  },
  highlight: {
    icon: SparklesIcon,
    container: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-600',
  },
};

export default function DashboardAlertBanner({ tone, title, message, actions, badge }) {
  const config = TONE_CONFIG[tone] ?? TONE_CONFIG.info;
  const Icon = config.icon;

  return (
    <div
      className={classNames(
        'flex flex-col gap-3 rounded-3xl border px-5 py-4 shadow-soft backdrop-blur',
        config.container,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Icon className="h-5 w-5" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em]">{badge || 'Alert'}</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {typeof message === 'string' ? <p className="text-sm leading-relaxed">{message}</p> : message}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

DashboardAlertBanner.propTypes = {
  tone: PropTypes.oneOf(['info', 'warning', 'success', 'highlight']),
  title: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  actions: PropTypes.node,
  badge: PropTypes.string,
};

DashboardAlertBanner.defaultProps = {
  tone: 'info',
  actions: null,
  badge: undefined,
};
