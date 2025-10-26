import PropTypes from 'prop-types';
import DashboardCollapsibleSection from '../../../../components/dashboard/shared/DashboardCollapsibleSection.jsx';
import DashboardInsightsBand from '../../../../components/dashboard/shared/DashboardInsightsBand.jsx';
import DashboardAlertBanner from '../../../../components/dashboard/shared/DashboardAlertBanner.jsx';

export default function PipelineHealthSection({
  anchorId = 'agency-analytics',
  title = 'Pipeline & finance health',
  badge = 'Signals',
  description = 'Monitor cross-functional delivery metrics and finance telemetry without leaving the control tower.',
  insights = [],
  alerts = [],
}) {
  if (!insights.length && !alerts.length) {
    return null;
  }

  return (
    <DashboardCollapsibleSection
      id={anchorId}
      anchorId={anchorId}
      title={title}
      badge={badge}
      description={description}
    >
      {insights.length ? (
        <DashboardInsightsBand
          title="Delivery and revenue pulse"
          subtitle="Live view across active gig programmes and billing."
          insights={insights}
        />
      ) : null}

      {alerts.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {alerts.map((alert) => (
            <DashboardAlertBanner
              key={`${alert.tone}-${alert.title}`}
              tone={alert.tone}
              title={alert.title}
              message={alert.message}
              actions={alert.actions}
            />
          ))}
        </div>
      ) : null}
    </DashboardCollapsibleSection>
  );
}

PipelineHealthSection.propTypes = {
  anchorId: PropTypes.string,
  title: PropTypes.string,
  badge: PropTypes.string,
  description: PropTypes.string,
  insights: PropTypes.arrayOf(PropTypes.object),
  alerts: PropTypes.arrayOf(PropTypes.shape({
    tone: PropTypes.oneOf(['info', 'warning', 'success', 'danger']).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.node),
  })),
};

PipelineHealthSection.defaultProps = {
  anchorId: 'agency-analytics',
  title: 'Pipeline & finance health',
  badge: 'Signals',
  description: 'Monitor cross-functional delivery metrics and finance telemetry without leaving the control tower.',
  insights: [],
  alerts: [],
};
