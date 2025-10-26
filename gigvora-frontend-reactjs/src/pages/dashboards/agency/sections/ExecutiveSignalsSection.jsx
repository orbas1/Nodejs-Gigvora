import PropTypes from 'prop-types';
import DashboardInsightsBand from '../../../../components/dashboard/shared/DashboardInsightsBand.jsx';
import DashboardAlertBanner from '../../../../components/dashboard/shared/DashboardAlertBanner.jsx';

export default function ExecutiveSignalsSection({
  anchorId = 'agency-executive',
  title = 'Executive signal board',
  subtitle = 'Blended health indicators across brand, delivery, and finance.',
  signals = [],
  alerts = [],
  loading = false,
  onRefresh,
}) {
  const shouldRender = signals.length > 0 || alerts.length > 0;
  if (!shouldRender) {
    return null;
  }

  return (
    <section id={anchorId} className="space-y-4">
      {signals.length ? (
        <DashboardInsightsBand
          title={title}
          subtitle={subtitle}
          insights={signals}
          loading={loading}
          onRefresh={onRefresh}
        />
      ) : null}

      {alerts.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.map((alert) => (
            <DashboardAlertBanner
              key={`${alert.title}-${alert.tone}`}
              tone={alert.tone}
              title={alert.title}
              message={alert.message}
              actions={alert.actions}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

ExecutiveSignalsSection.propTypes = {
  anchorId: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  signals: PropTypes.arrayOf(PropTypes.object),
  alerts: PropTypes.arrayOf(PropTypes.shape({
    tone: PropTypes.oneOf(['info', 'warning', 'success', 'danger']).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.node),
  })),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

ExecutiveSignalsSection.defaultProps = {
  anchorId: 'agency-executive',
  title: 'Executive signal board',
  subtitle: 'Blended health indicators across brand, delivery, and finance.',
  signals: [],
  alerts: [],
  loading: false,
  onRefresh: undefined,
};
