import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import RuntimeOperationsControlPanel from '../../../components/admin/RuntimeOperationsControlPanel.jsx';
import NotificationPipelinePanel from '../../../components/admin/NotificationPipelinePanel.jsx';
import {
  fetchRuntimeOperationsSummary,
  normaliseRuntimeOperationsSummary,
  FALLBACK_RUNTIME_OPERATIONS_SUMMARY,
} from '../../../services/runtimeOperations.js';
import {
  fetchNotificationPipelineSnapshot,
  normaliseNotificationPipelineSnapshot,
  FALLBACK_NOTIFICATION_PIPELINE_SNAPSHOT,
} from '../../../services/notificationPipelines.js';

const MENU_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { id: 'runtime-ops', name: 'Runtime ops', sectionId: 'runtime-ops' },
      { id: 'maintenance', name: 'Maintenance', href: '/dashboard/admin/maintenance' },
      { id: 'release-ops', name: 'Release ops', href: '/dashboard/admin/release-operations' },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-overview', name: 'Admin overview', href: '/dashboard/admin' }],
  },
];

export default function AdminRuntimeOperationsPage() {
  const [summary, setSummary] = useState(FALLBACK_RUNTIME_OPERATIONS_SUMMARY);
  const [pipelineSnapshot, setPipelineSnapshot] = useState(FALLBACK_NOTIFICATION_PIPELINE_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTelemetry = useCallback(
    async (options = { refresh: false }) => {
      if (options.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const [runtimeData, pipelineData] = await Promise.all([
          fetchRuntimeOperationsSummary(),
          fetchNotificationPipelineSnapshot(),
        ]);
        setSummary(normaliseRuntimeOperationsSummary(runtimeData));
        setPipelineSnapshot(normaliseNotificationPipelineSnapshot(pipelineData));
        setError('');
      } catch (err) {
        console.error('Failed to load runtime operations telemetry', err);
        setError('Unable to load the latest runtime telemetry. Showing cached data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadTelemetry({ refresh: false });
  }, [loadTelemetry]);

  const breadcrumbs = useMemo(
    () => [
      { name: 'Admin', href: '/dashboard/admin' },
      { name: 'Runtime operations', href: '/dashboard/admin/runtime-operations' },
    ],
    [],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Runtime operations"
      subtitle="Site readiness, maintenance posture, and notification pipelines"
      description="Keep runtime toggles, broadcast channels, and hero surfaces aligned with executive expectations."
      breadcrumbs={breadcrumbs}
      menuSections={MENU_SECTIONS}
    >
      <div className="space-y-8">
        <RuntimeOperationsControlPanel
          summary={summary}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={() => loadTelemetry({ refresh: true })}
        />
        <NotificationPipelinePanel
          snapshot={pipelineSnapshot}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={() => loadTelemetry({ refresh: true })}
        />
      </div>
    </DashboardLayout>
  );
}
