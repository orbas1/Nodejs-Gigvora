import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import SessionPlanner from '../../components/networking/SessionPlanner.jsx';
import SessionSpendPanel from '../../components/networking/SessionSpendPanel.jsx';
import SessionConnectionsPanel from '../../components/networking/SessionConnectionsPanel.jsx';
import useNetworkingAccess from '../../hooks/useNetworkingAccess.js';
import useNetworkingSessions from '../../hooks/useNetworkingSessions.js';
import {
  createNetworkingSession,
  updateNetworkingSession,
  updateNetworkingSignup,
} from '../../services/networking.js';
import {
  buildRecentConnections,
  resolveActiveCompanyId,
  summariseSessions,
  summariseSpend,
} from '../../utils/networkingSessions.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const LOOKBACK_CHOICES = [30, 60, 90, 120, 180];

function normaliseSessions(data) {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.sessions)) {
    return data.sessions;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

function buildWorkspaceOptions(sessions) {
  const map = new Map();
  sessions.forEach((session) => {
    const id = Number(session?.companyId);
    if (!Number.isFinite(id)) {
      return;
    }
    if (!map.has(id)) {
      const label =
        session?.company?.name ||
        session?.companyName ||
        session?.workspaceName ||
        `Workspace ${id}`;
      map.set(id, { id, label });
    }
  });
  return Array.from(map.values());
}

export default function NetworkingSessionsPage() {
  const { canManageNetworking, reason } = useNetworkingAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = searchParams.get('lookback');
  const requestedCompanyId = Number.isFinite(Number(workspaceIdParam)) ? Number(workspaceIdParam) : undefined;
  const lookbackDays = Number.isFinite(Number(lookbackParam)) ? Number(lookbackParam) : 90;

  const {
    data,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
  } = useNetworkingSessions({ companyId: requestedCompanyId, lookbackDays, enabled: canManageNetworking });

  const sessions = useMemo(() => normaliseSessions(data), [data]);
  const activeCompanyId = useMemo(
    () => resolveActiveCompanyId({ requestedId: requestedCompanyId, sessions }),
    [requestedCompanyId, sessions],
  );

  useEffect(() => {
    if (!canManageNetworking || requestedCompanyId || activeCompanyId == null) {
      return;
    }
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('workspaceId', String(activeCompanyId));
      next.set('lookback', String(lookbackDays));
      return next;
    }, { replace: true });
  }, [activeCompanyId, canManageNetworking, lookbackDays, requestedCompanyId, setSearchParams]);

  const workspaceOptions = useMemo(() => buildWorkspaceOptions(sessions), [sessions]);
  const sessionSummary = useMemo(() => summariseSessions(sessions), [sessions]);
  const spendSummary = useMemo(() => summariseSpend(sessions), [sessions]);
  const connections = useMemo(() => buildRecentConnections(sessions), [sessions]);
  const [followUpState, setFollowUpState] = useState({ key: null, error: null });

  const handleWorkspaceChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
    } else {
      next.delete('workspaceId');
    }
    next.set('lookback', String(lookbackDays));
    setSearchParams(next, { replace: true });
  };

  const handleLookbackChange = (event) => {
    const value = Number(event.target.value);
    const next = new URLSearchParams(searchParams);
    next.set('lookback', String(value));
    if (activeCompanyId != null) {
      next.set('workspaceId', String(activeCompanyId));
    }
    setSearchParams(next, { replace: true });
  };

  const handleCreateSession = async (payload) => {
    if (activeCompanyId != null) {
      payload.companyId = activeCompanyId;
    }
    await createNetworkingSession(payload);
  };

  const handleUpdateSession = async (sessionId, payload) => {
    await updateNetworkingSession(sessionId, payload);
  };

  const handleScheduleFollowUp = async (connection) => {
    if (!connection) {
      return;
    }
    const key = `${connection.sessionId}:${connection.id}`;
    setFollowUpState({ key, error: null });
    try {
      const nextCount = Number(connection.followUpsScheduled ?? 0) + 1;
      await updateNetworkingSignup(connection.sessionId, connection.id, { followUpsScheduled: nextCount });
      await refresh({ force: true });
      setFollowUpState({ key: null, error: null });
    } catch (submissionError) {
      setFollowUpState({
        key: null,
        error: submissionError.message || 'Unable to schedule follow-up. Try again shortly.',
      });
    }
  };

  const content = !canManageNetworking ? (
    <AccessDeniedPanel title="Networking sessions" message={reason} />
  ) : (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Workspace
              <select
                value={activeCompanyId ?? ''}
                onChange={handleWorkspaceChange}
                className="ml-3 rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
              >
                {workspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
                {!workspaceOptions.length ? <option value="">No sessions yet</option> : null}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Lookback
              <select
                value={lookbackDays}
                onChange={handleLookbackChange}
                className="ml-3 rounded-full border border-slate-200 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
              >
                {LOOKBACK_CHOICES.map((option) => (
                  <option key={option} value={option}>
                    Last {option} days
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error.message || 'Unable to load networking sessions.'}
          </p>
        ) : null}
      </div>

      <SessionPlanner
        sessions={sessions}
        summary={sessionSummary}
        onCreate={handleCreateSession}
        onUpdate={handleUpdateSession}
        onRefresh={refresh}
        refreshing={loading}
        companyId={activeCompanyId}
      />

      <SessionSpendPanel summary={spendSummary} sessions={sessions} />

      <SessionConnectionsPanel
        connections={connections}
        onScheduleFollowUp={handleScheduleFollowUp}
        processingKey={followUpState.key}
        error={followUpState.error}
      />
    </div>
  );

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Networking sessions"
      subtitle="Plan, monetise, and follow up without clutter."
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      activeMenuItem="network-plan"
    >
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{content}</main>
    </DashboardLayout>
  );
}
