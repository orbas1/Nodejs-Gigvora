import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import MaintenanceStatusCard from '../../../components/admin/maintenance/MaintenanceStatusCard.jsx';
import MaintenanceScheduleTable from '../../../components/admin/maintenance/MaintenanceScheduleTable.jsx';
import MaintenanceNotificationForm from '../../../components/admin/maintenance/MaintenanceNotificationForm.jsx';
import {
  fetchMaintenanceStatus,
  updateMaintenanceStatus,
  scheduleMaintenanceWindow,
  updateMaintenanceWindow,
  deleteMaintenanceWindow,
  notifyMaintenanceAudience,
} from '../../../services/maintenanceMode.js';

const MENU_SECTIONS = [
  {
    label: 'Maintenance',
    items: [
      { id: 'maintenance-status', name: 'Status', sectionId: 'maintenance-status' },
      { id: 'maintenance-schedule', name: 'Schedule', sectionId: 'maintenance-schedule' },
      { id: 'maintenance-notifications', name: 'Notifications', sectionId: 'maintenance-notifications' },
    ],
  },
  {
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const FALLBACK_STATUS = {
  enabled: false,
  message: 'All systems operational',
  impactSurface: 'Platform & APIs',
  estimatedResumeAt: null,
  updatedAt: new Date().toISOString(),
  warnings: [],
  broadcastCopy: 'Gigvora is live. No known incidents.',
};

const FALLBACK_WINDOWS = [
  {
    id: 'db-maintenance',
    title: 'PostgreSQL minor upgrade',
    owner: 'SRE',
    impact: 'Database cluster',
    startAt: '2024-05-12T22:00:00Z',
    endAt: '2024-05-12T23:30:00Z',
    channels: ['status-page', 'email', 'slack'],
    notificationLeadMinutes: 90,
    rollbackPlan: 'Revert to snapshot, failback to standby cluster, notify stakeholders.',
  },
  {
    id: 'api-patch',
    title: 'API gateway patch',
    owner: 'Platform Engineering',
    impact: 'Public API',
    startAt: '2024-05-18T06:00:00Z',
    endAt: '2024-05-18T07:00:00Z',
    channels: ['status-page', 'in-app'],
    notificationLeadMinutes: 120,
    rollbackPlan: 'Redeploy previous stable build and flush caches.',
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency'];

export default function AdminMaintenanceModePage() {
  const [status, setStatus] = useState(FALLBACK_STATUS);
  const [windows, setWindows] = useState(FALLBACK_WINDOWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyWindowId, setBusyWindowId] = useState('');
  const [creatingWindow, setCreatingWindow] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchMaintenanceStatus();
      setStatus(response?.status ?? response ?? FALLBACK_STATUS);
      setWindows(response?.windows ?? FALLBACK_WINDOWS);
      setToast('Loaded live maintenance configuration.');
    } catch (err) {
      console.warn('Failed to fetch maintenance status. Using fallback data.', err);
      setError('Using offline maintenance defaults. Connect the API for real-time orchestration.');
      setStatus(FALLBACK_STATUS);
      setWindows(FALLBACK_WINDOWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sections = useMemo(() => [
    { id: 'maintenance-status', title: 'Status' },
    { id: 'maintenance-schedule', title: 'Schedule' },
    { id: 'maintenance-notifications', title: 'Notifications' },
  ], []);

  const handleToggle = useCallback(
    async (payload) => {
      setToast('Updating maintenance state…');
      try {
        const updated = await updateMaintenanceStatus(payload);
        setStatus((current) => ({ ...current, ...(updated ?? payload), updatedAt: new Date().toISOString() }));
        setToast('Maintenance state updated.');
      } catch (err) {
        setError(err?.message || 'Failed to update maintenance state.');
      }
    },
    [],
  );

  const handleCreateWindow = useCallback(
    async (payload) => {
      setCreatingWindow(true);
      setToast('Scheduling maintenance window…');
      try {
        const created = await scheduleMaintenanceWindow(payload);
        setWindows((current) => {
          const next = Array.isArray(current) ? [...current] : [];
          const newWindow = created ?? { ...payload, id: `window-${Date.now()}` };
          return [...next, newWindow];
        });
        setToast('Maintenance window scheduled.');
      } catch (err) {
        setError(err?.message || 'Unable to schedule maintenance window.');
        throw err;
      } finally {
        setCreatingWindow(false);
      }
    },
    [],
  );

  const handleUpdateWindow = useCallback(async (windowId, payload) => {
    if (!windowId) return;
    setBusyWindowId(windowId);
    setToast('Updating maintenance window…');
    try {
      const updated = await updateMaintenanceWindow(windowId, payload);
      setWindows((current) => {
        const next = Array.isArray(current) ? [...current] : [];
        const index = next.findIndex((window) => window.id === windowId);
        if (index >= 0) {
          next[index] = { ...next[index], ...(updated ?? payload) };
        }
        return next;
      });
      setToast('Maintenance window updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update maintenance window.');
    } finally {
      setBusyWindowId('');
    }
  }, []);

  const handleDeleteWindow = useCallback(async (windowId) => {
    if (!windowId) return;
    setBusyWindowId(windowId);
    setToast('Deleting maintenance window…');
    try {
      await deleteMaintenanceWindow(windowId);
      setWindows((current) => (current ?? []).filter((window) => window.id !== windowId));
      setToast('Maintenance window deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete maintenance window.');
    } finally {
      setBusyWindowId('');
    }
  }, []);

  const handleSendBroadcast = useCallback(
    async (payload) => {
      setSendingBroadcast(true);
      setToast('Sending maintenance broadcast…');
      try {
        await notifyMaintenanceAudience(payload);
        setToast('Broadcast sent. Stakeholders will be notified across channels.');
      } catch (err) {
        setError(err?.message || 'Failed to send broadcast.');
        throw err;
      } finally {
        setSendingBroadcast(false);
      }
    },
    [],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Maintenance control centre"
      subtitle="Plan, execute, and communicate platform maintenance with confidence"
      description="Control the Gigvora kill switch, schedule maintenance windows, and orchestrate multi-channel communications so customers always know what’s happening."
      menuSections={MENU_SECTIONS}
      sections={sections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-12">
        <section id="maintenance-status" className="space-y-6">
          {error && (
            <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
              {error}
            </p>
          )}
          {toast && !error && (
            <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
              {toast}
            </p>
          )}
          <MaintenanceStatusCard status={status} updating={loading} onToggle={handleToggle} />
        </section>

        <MaintenanceScheduleTable
          windows={windows}
          creating={creatingWindow}
          busyWindowId={busyWindowId}
          onCreate={handleCreateWindow}
          onUpdate={handleUpdateWindow}
          onDelete={handleDeleteWindow}
        />

        <MaintenanceNotificationForm onSend={handleSendBroadcast} sending={sendingBroadcast} />

        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Runbooks & rehearsals</h2>
            <p className="text-sm text-slate-600">
              Link to pre-flight checks, rollback plans, and incident rehearsals. Embed Loom walk-throughs or attach decks for
              on-call engineers so they can follow along in real time.
            </p>
            <ul className="list-inside list-disc text-sm text-slate-600">
              <li>Pre-flight: database backups verified, feature flags disabled</li>
              <li>Live comms: status page, Slack #gigvora-ops, customer email</li>
              <li>Post-flight: smoke tests, metrics validation, incident retro</li>
            </ul>
          </div>
          <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
            <iframe
              title="Maintenance rehearsal"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
