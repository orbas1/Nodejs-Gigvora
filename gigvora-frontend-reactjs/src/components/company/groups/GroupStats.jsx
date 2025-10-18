import PropTypes from 'prop-types';
import { UserGroupIcon, LockClosedIcon, UserPlusIcon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  return new Intl.NumberFormat().format(value ?? 0);
}

const CARDS = [
  {
    key: 'total',
    label: 'Groups',
    icon: UserGroupIcon,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'active',
    label: 'Active members',
    icon: UserPlusIcon,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'privateCount',
    label: 'Private circles',
    icon: LockClosedIcon,
    color: 'bg-slate-50 text-slate-600',
  },
];

export default function GroupStats({ metrics }) {
  return (
    <div className="grid gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatNumber(metrics?.[card.key] ?? 0)}</p>
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                <Icon className="h-6 w-6" />
              </span>
            </div>
          </div>
        );
      })}
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-600">
        {formatNumber(metrics?.pending ?? 0)} pending approvals
      </div>
    </div>
  );
}

GroupStats.propTypes = {
  metrics: PropTypes.shape({
    total: PropTypes.number,
    active: PropTypes.number,
    pending: PropTypes.number,
    privateCount: PropTypes.number,
  }),
};

GroupStats.defaultProps = {
  metrics: { total: 0, active: 0, pending: 0, privateCount: 0 },
};
