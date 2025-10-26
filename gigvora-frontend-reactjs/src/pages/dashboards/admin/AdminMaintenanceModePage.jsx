import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import MaintenanceStatusCard from '../../../components/admin/maintenance/MaintenanceStatusCard.jsx';
import MaintenanceScheduleTable from '../../../components/admin/maintenance/MaintenanceScheduleTable.jsx';
import MaintenanceNotificationForm from '../../../components/admin/maintenance/MaintenanceNotificationForm.jsx';
import SystemStatusToast from '../../../components/system/SystemStatusToast.jsx';
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
  id: 'status-operational',
  enabled: false,
  title: 'All systems operational',
  message: 'All systems operational',
  summary: 'Gigvora is live with no customer-impacting incidents reported.',
  severity: 'operational',
  impactSurface: 'Platform & APIs',
  estimatedResumeAt: null,
  updatedAt: new Date().toISOString(),
  warnings: [],
  broadcastCopy: 'Gigvora is live. No known incidents.',
  metrics: {
    uptime: 99.982,
    latencyP95: 184,
    errorRate: 0.002,
    activeIncidents: 0,
    sloTarget: 99.95,
    usersImpacted: 0,
    escalationsOpen: 1,
  },
  incidents: [
    {
      id: 'incident-maintenance-readiness',
      title: 'Maintenance rehearsal complete',
      status: 'Resolved',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      summary: 'Last scheduled rehearsal validated the rollback plan and incident playbook.',
      link: 'https://status.gigvora.com/incidents/maintenance-readiness',
    },
  ],
  channels: [
    { id: 'status-page', label: 'Status page' },
    { id: 'trust-centre', label: 'Trust centre' },
    { id: 'slack', label: '#gigvora-ops' },
  ],
  incidentRoomUrl: 'https://gigvora.slack.com/archives/gigvora-ops',
  runbookUrl: 'https://gigvora.notion.site/maintenance-runbook',
  acknowledgedAt: null,
  acknowledgedBy: null,
  nextUpdateDue: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
  window: {
    title: 'Network maintenance window',
    startAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    endAt: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    region: 'Global',
    owner: 'Site reliability',
    summary: 'Coordinated upgrades rolling across API edge and onboarding surfaces.',
  },
  broadcasts: [
    {
      id: 'broadcast-status',
      channel: 'Status page',
      status: 'Published',
      sentAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'broadcast-email',
      channel: 'Customer email',
      status: 'Scheduled',
      sentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
  ],
  escalationContacts: [
    {
      id: 'contact-sre',
      name: 'Amelia Park',
      team: 'SRE On-call',
      channel: '#gigvora-ops',
      onCall: true,
    },
    {
      id: 'contact-support',
      name: 'Jordan Malik',
      team: 'Customer Support',
      channel: 'PagerDuty',
      onCall: false,
    },
  ],
  nextSteps: [
    {
      id: 'step-runbook',
      label: 'Validate rollback checklist',
      description: 'Confirm backups and failover readiness before window begins.',
      href: 'https://gigvora.notion.site/runbook-checklist',
    },
    {
      id: 'step-briefing',
      label: 'Send APAC customer briefing',
      description: 'Share upcoming window context with high-touch accounts.',
    },
  ],
  feedback: {
    experienceScore: 4.6,
    trendDelta: 0.2,
    queueDepth: 9,
    medianResponseMinutes: 3,
    lastUpdated: new Date().toISOString(),
    reviewUrl: 'https://gigvora.com/ops/feedback',
    targetScore: 4.7,
    pendingResponses: 18,
    health: 'On track',
    aiSummary:
      'Enterprise sentiment remains strong thanks to proactive comms, while SMB concerns focus on after-hours notifications. Queue volume is steady and response speed meets SLO.',
    segments: [
      { id: 'enterprise', label: 'Enterprise', score: 4.8, delta: 0.3, sampleSize: 126 },
      { id: 'smb', label: 'SMB', score: 4.4, delta: 0.1, sampleSize: 212 },
      { id: 'partners', label: 'Partners', score: 4.5, delta: -0.1, sampleSize: 63 },
    ],
    highlights: [
      {
        id: 'highlight-enterprise',
        persona: 'Enterprise PM',
        sentiment: 'Positive',
        quote: 'The maintenance comms are clear and timed perfectly for our teams.',
        recordedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'highlight-support',
        persona: 'Customer Support Lead',
        sentiment: 'Watchlist',
        quote: 'We need more notice for APAC teams—queue volume spikes post-maintenance.',
        recordedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
    alerts: [
      {
        id: 'alert-apac',
        title: 'APAC satisfaction dip',
        description: 'APAC cohort sentiment dropped 0.4 following last maintenance window.',
        recommendedAction: 'Schedule earlier notifications for APAC customers.',
      },
    ],
    channels: [
      { id: 'in-product', label: 'In-product banner' },
      { id: 'email', label: 'Lifecycle email' },
      { id: 'trust-centre', label: 'Trust centre' },
    ],
  },
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
  const [statusToastDismissed, setStatusToastDismissed] = useState(false);
  const [busyWindowId, setBusyWindowId] = useState('');
  const [creatingWindow, setCreatingWindow] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const formatIcsDate = useCallback((value) => {
    const date = value instanceof Date ? value : new Date(value ?? Date.now());
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }, []);

  const handleExportCalendar = useCallback(() => {
    if (!windows?.length) {
      setToast('No maintenance windows to export yet.');
      return;
    }

    const events = windows.filter((window) => window.startAt);
    if (!events.length) {
      setToast('Add start times to maintenance windows before exporting.');
      return;
    }

    const nowStamp = formatIcsDate(new Date());
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gigvora//Maintenance//EN'];
    events.forEach((windowEntry, index) => {
      const start = formatIcsDate(windowEntry.startAt);
      const end = formatIcsDate(windowEntry.endAt || windowEntry.startAt);
      const uid = windowEntry.id ? `gigvora-maintenance-${windowEntry.id}` : `gigvora-maintenance-${index}`;
      const descriptionParts = [
        windowEntry.impact ? `Impact: ${windowEntry.impact}` : null,
        windowEntry.owner ? `Owner: ${windowEntry.owner}` : null,
        Array.isArray(windowEntry.channels) && windowEntry.channels.length
          ? `Channels: ${windowEntry.channels.join(', ')}`
          : null,
        windowEntry.rollbackPlan ? `Rollback: ${windowEntry.rollbackPlan}` : null,
      ].filter(Boolean);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${nowStamp}`);
      if (start) {
        lines.push(`DTSTART:${start}`);
      }
      if (end) {
        lines.push(`DTEND:${end}`);
      }
      lines.push(`SUMMARY:${windowEntry.title ?? 'Maintenance window'}`);
      if (descriptionParts.length) {
        lines.push(`DESCRIPTION:${descriptionParts.join('\\n')}`);
      }
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');

    const payload = lines.join('\r\n');

    if (typeof window === 'undefined') {
      console.info('ICS export:\n', payload);
      setToast('ICS calendar written to console output.');
      return;
    }

    try {
      const blob = new Blob([payload], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gigvora-maintenance-${new Date().toISOString().slice(0, 10)}.ics`;
      anchor.rel = 'noopener';
      anchor.click();
      window.URL.revokeObjectURL(url);
      setToast('Exported maintenance calendar.');
    } catch (exportError) {
      console.error('Unable to export maintenance calendar', exportError);
      setError('Failed to export maintenance calendar.');
    }
  }, [formatIcsDate, windows]);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchMaintenanceStatus();
      const nextStatus = response?.status ?? response ?? FALLBACK_STATUS;
      setStatus({ ...FALLBACK_STATUS, ...nextStatus });
      setWindows(response?.windows ?? FALLBACK_WINDOWS);
      setToast('Loaded live maintenance configuration.');
      setStatusToastDismissed(false);
    } catch (err) {
      console.warn('Failed to fetch maintenance status. Using fallback data.', err);
      setError('Using offline maintenance defaults. Connect the API for real-time orchestration.');
      setStatus(FALLBACK_STATUS);
      setWindows(FALLBACK_WINDOWS);
      setStatusToastDismissed(false);
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

  const statusToast = useMemo(() => {
    const metrics = {
      uptime: status?.metrics?.uptime ?? FALLBACK_STATUS.metrics.uptime,
      latencyP95: status?.metrics?.latencyP95 ?? FALLBACK_STATUS.metrics.latencyP95,
      errorRate: status?.metrics?.errorRate ?? FALLBACK_STATUS.metrics.errorRate,
      activeIncidents:
        status?.metrics?.activeIncidents ?? status?.incidents?.length ?? FALLBACK_STATUS.metrics.activeIncidents,
    };

    return {
      id: status?.id ?? FALLBACK_STATUS.id,
      title:
        status?.title ??
        (status?.enabled ? 'Maintenance mode active' : FALLBACK_STATUS.title),
      summary: status?.summary ?? status?.broadcastCopy ?? status?.message ?? FALLBACK_STATUS.summary,
      severity: status?.enabled ? 'major' : status?.severity ?? FALLBACK_STATUS.severity,
      impactSurface: status?.impactSurface ?? FALLBACK_STATUS.impactSurface,
      updatedAt: status?.updatedAt ?? FALLBACK_STATUS.updatedAt,
      acknowledgedAt: status?.acknowledgedAt ?? null,
      acknowledgedBy: status?.acknowledgedBy ?? null,
      metrics,
      incidents: Array.isArray(status?.incidents) ? status.incidents : FALLBACK_STATUS.incidents,
      channels: Array.isArray(status?.channels) ? status.channels : FALLBACK_STATUS.channels,
    };
  }, [status]);

  const handleViewIncidents = useCallback(() => {
    const url = status?.incidentRoomUrl ?? FALLBACK_STATUS.incidentRoomUrl;
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      console.info('Open incident room:', url);
    }
    setToast('Incident command room opened.');
  }, [status]);

  const handleViewRunbook = useCallback(() => {
    const url = status?.runbookUrl ?? FALLBACK_STATUS.runbookUrl;
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      console.info('Open runbook:', url);
    }
    setToast('Runbook shared with responders.');
  }, [status]);

  const handleAcknowledgeToast = useCallback(async () => {
    const timestamp = new Date().toISOString();
    const payload = {
      acknowledgedAt: timestamp,
      acknowledgedBy: 'Admin console',
    };

    try {
      await updateMaintenanceStatus(payload);
      setStatus((current) => ({ ...current, ...payload }));
      setToast('Broadcast acknowledged and logged.');
    } catch (err) {
      console.error('Failed to acknowledge maintenance broadcast', err);
      setError(err?.message || 'Failed to acknowledge maintenance broadcast.');
    }
  }, []);

  const handleDismissToast = useCallback(() => {
    setStatusToastDismissed(true);
  }, []);

  const handleReviewFeedback = useCallback(() => {
    const url = status?.feedback?.reviewUrl ?? FALLBACK_STATUS.feedback.reviewUrl;
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    } else {
      console.info('Open feedback dashboard:', url);
    }
    setToast('Feedback insights opened for review.');
  }, [status]);

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
          {!statusToastDismissed && statusToast.summary ? (
            <SystemStatusToast
              status={statusToast}
              onAcknowledge={handleAcknowledgeToast}
              onViewIncidents={handleViewIncidents}
              onViewRunbook={handleViewRunbook}
              onDismiss={handleDismissToast}
            />
          ) : null}
          {toast && !error && (
            <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
              {toast}
            </p>
          )}
          <MaintenanceStatusCard
            status={status}
            updating={loading}
            onToggle={handleToggle}
            onReviewFeedback={handleReviewFeedback}
          />
        </section>

        <MaintenanceScheduleTable
          windows={windows}
          creating={creatingWindow}
          busyWindowId={busyWindowId}
          onCreate={handleCreateWindow}
          onUpdate={handleUpdateWindow}
          onDelete={handleDeleteWindow}
          onExport={handleExportCalendar}
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
