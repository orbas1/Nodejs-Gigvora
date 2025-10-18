import { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch } from '@headlessui/react';
import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import EventManagementSection from '../../../components/eventManagement/EventManagementSection.jsx';
import AgencyEventSettingsPanel from '../../../components/agency/events/AgencyEventSettingsPanel.jsx';
import AgencyEventInsightsPanel from '../../../components/agency/events/AgencyEventInsightsPanel.jsx';
import DataStatus from '../../../components/DataStatus.jsx';
import { fetchEventManagement, updateEventSettings } from '../../../services/eventManagement.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function AgencyEventManagementPage() {
  const { session } = useSession();
  const userId = session?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(null);

  const effectiveIncludeArchived = includeArchived ?? data?.settings?.includeArchivedByDefault ?? false;

  const loadData = useCallback(
    async ({ signal } = {}) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchEventManagement(userId, { includeArchived, signal });
        setData(response);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [includeArchived, userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return () => controller.abort();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleToggleIncludeArchived = (value) => {
    setIncludeArchived(value);
  };

  const handleSaveSettings = useCallback(
    async (payload) => {
      if (!userId) return;
      setSettingsSaving(true);
      setSettingsError(null);
      try {
        const updated = await updateEventSettings(userId, payload);
        setData((current) => {
          if (!current) {
            return { settings: updated };
          }
          return {
            ...current,
            settings: updated,
            permissions: {
              ...current.permissions,
              allowedRoles: updated.allowedRoles ?? current.permissions?.allowedRoles ?? [],
            },
          };
        });
        if (payload.includeArchivedByDefault !== undefined && includeArchived === null) {
          setIncludeArchived(payload.includeArchivedByDefault);
        }
        await loadData();
      } catch (err) {
        setSettingsError(err);
      } finally {
        setSettingsSaving(false);
      }
    },
    [includeArchived, loadData, userId],
  );

  const overview = data?.overview ?? null;
  const recommendations = data?.recommendations ?? [];
  const lastUpdatedAt = overview?.lastUpdatedAt ?? null;

  const managementSection = useMemo(() => {
    if (!data && loading) {
      return <div className="h-64 rounded-4xl border border-slate-200 bg-slate-100/70 animate-pulse" />;
    }
    if (!data) {
      return (
        <div className="rounded-4xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
          Events will appear here once we can reach the workspace.
        </div>
      );
    }
    return <EventManagementSection data={data} userId={userId} onRefresh={handleRefresh} />;
  }, [data, handleRefresh, loading, userId]);

  return (
    <AgencyDashboardLayout
      title="Event management"
      subtitle="Plan, publish, and recap every activation from one operations workspace."
      description="Launch with confidence, track guests and budget, and close the loop with tidy retrospectives."
      activeMenuItem="events"
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Events workspace</h1>
              <p className="text-sm text-slate-500">Manage blueprints, guests, budgets, and runbooks in one secure space.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Include archived</span>
              <Switch
                checked={effectiveIncludeArchived}
                onChange={handleToggleIncludeArchived}
                className={classNames(
                  effectiveIncludeArchived ? 'bg-slate-900' : 'bg-slate-200',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition',
                )}
              >
                <span
                  className={classNames(
                    effectiveIncludeArchived ? 'translate-x-5' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition',
                  )}
                />
              </Switch>
            </div>
          </div>
          <DataStatus
            loading={loading}
            lastUpdated={lastUpdatedAt}
            onRefresh={handleRefresh}
            error={error}
            statusLabel={effectiveIncludeArchived ? 'Showing archived events' : 'Live data'}
          />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">{managementSection}</div>
          <div className="space-y-6">
            <AgencyEventSettingsPanel
              initialSettings={data?.settings}
              onSave={handleSaveSettings}
              saving={settingsSaving}
              error={settingsError}
            />
            <AgencyEventInsightsPanel overview={overview} recommendations={recommendations} />
          </div>
        </div>
      </div>
    </AgencyDashboardLayout>
  );
}
