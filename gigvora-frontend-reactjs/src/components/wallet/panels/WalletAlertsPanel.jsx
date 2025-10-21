import PropTypes from 'prop-types';
import WalletStatusPill from '../WalletStatusPill.jsx';

const toneMap = {
  critical: 'border-rose-200 bg-rose-50 text-rose-600',
  warning: 'border-amber-200 bg-amber-50 text-amber-600',
  info: 'border-sky-200 bg-sky-50 text-sky-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-600',
};

function WalletAlertsPanel({ alerts }) {
  return (
    <div className="flex flex-col gap-4" id="wallet-alerts" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Alerts</h3>
        <WalletStatusPill value={alerts.length ? 'attention' : 'clear'} />
      </div>
      {alerts.length ? (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, index) => (
            <div
              key={alert.id ?? `${alert.message}-${index}`}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneMap[alert.severity] ?? toneMap.warning}`}
              role={alert.severity === 'critical' ? 'alert' : undefined}
            >
              {alert.message}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          All clear. Compliance is in good standing.
        </div>
      )}
    </div>
  );
}

const alertShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  message: PropTypes.string.isRequired,
  severity: PropTypes.oneOf(['critical', 'warning', 'info', 'success']),
});

WalletAlertsPanel.propTypes = {
  alerts: PropTypes.arrayOf(alertShape).isRequired,
};

export default WalletAlertsPanel;
