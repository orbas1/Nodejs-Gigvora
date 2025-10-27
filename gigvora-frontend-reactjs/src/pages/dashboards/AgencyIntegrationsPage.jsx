import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useAgencyIntegrations from '../../hooks/useAgencyIntegrations.js';
import IntegrationSummaryHeader from '../../components/agency/integrations/IntegrationSummaryHeader.jsx';
import IntegrationCard from '../../components/agency/integrations/IntegrationCard.jsx';
import IntegrationActivityLog from '../../components/agency/integrations/IntegrationActivityLog.jsx';
import IntegrationProviderCatalog from '../../components/agency/integrations/IntegrationProviderCatalog.jsx';
import IntegrationManageDrawer from '../../components/agency/integrations/IntegrationManageDrawer.jsx';
import IntegrationCreationWizard from '../../components/agency/integrations/IntegrationCreationWizard.jsx';
import IntegrationSandboxPanel from '../../components/agency/integrations/IntegrationSandboxPanel.jsx';
import { fetchStubEnvironmentCatalog } from '../../services/stubEnvironments.js';

const MENU_SECTIONS = [
  {
    label: 'Main',
    items: [
      { name: 'Home', sectionId: 'integration-home' },
      { name: 'Connect', sectionId: 'integration-connect' },
      { name: 'Logs', sectionId: 'integration-logs' },
    ],
  },
  {
    label: 'Guide',
    items: [{ name: 'Catalog', sectionId: 'integration-catalog' }],
  },
];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'user', 'freelancer'];

export default function AgencyIntegrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const initialWorkspaceId = workspaceIdParam ? Number(workspaceIdParam) : null;
  const {
    loading,
    refreshing,
    error,
    clearError,
    connectors,
    summary,
    workspace,
    availableWorkspaces,
    availableProviders,
    webhookEventCatalog,
    selectedWorkspaceId,
    auditLog,
    lastLoadedAt,
    setWorkspaceId,
    refresh,
    createIntegration,
    updateIntegration,
    rotateSecret,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testConnection,
  } = useAgencyIntegrations({ workspaceId: initialWorkspaceId });

  const [creating, setCreating] = useState(false);
  const [creationOpen, setCreationOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeIntegrationId, setActiveIntegrationId] = useState(null);
  const [stubEnvironments, setStubEnvironments] = useState([]);
  const [stubLoading, setStubLoading] = useState(false);
  const [stubError, setStubError] = useState(null);

  const loadStubEnvironments = useCallback(
    async (signal) => {
      setStubLoading(true);
      setStubError(null);
      try {
        const catalog = await fetchStubEnvironmentCatalog({ signal });
        setStubEnvironments(Array.isArray(catalog?.environments) ? catalog.environments : []);
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.error('Unable to load stub environments', err);
        setStubError(err?.body?.message || err?.message || 'Unable to load stub environments.');
      } finally {
        setStubLoading(false);
      }
    },
    [],
  );

  const activeIntegration = useMemo(
    () => connectors.find((item) => item.id === activeIntegrationId) ?? null,
    [connectors, activeIntegrationId],
  );

  useEffect(() => {
    if (!drawerOpen) {
      setActiveIntegrationId(null);
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (activeIntegrationId && !connectors.some((item) => item.id === activeIntegrationId)) {
      setDrawerOpen(false);
      setActiveIntegrationId(null);
    }
  }, [activeIntegrationId, connectors]);

  useEffect(() => {
    if (selectedWorkspaceId && Number(workspaceIdParam) !== Number(selectedWorkspaceId)) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
    if (!selectedWorkspaceId && workspaceIdParam) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete('workspaceId');
        return next;
      }, { replace: true });
    }
  }, [selectedWorkspaceId, workspaceIdParam, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    loadStubEnvironments(controller.signal);
    return () => controller.abort();
  }, [loadStubEnvironments]);

  const sections = useMemo(
    () => [
      { id: 'integration-home', label: 'Home' },
      { id: 'integration-connect', label: 'Connect' },
      { id: 'integration-logs', label: 'Logs' },
      { id: 'integration-catalog', label: 'Catalog' },
    ],
    [],
  );

  const handleCreateIntegration = async (payload) => {
    setCreating(true);
    try {
      await createIntegration(payload);
      setCreationOpen(false);
    } catch (err) {
      console.error('Unable to create integration', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Integration control center"
      subtitle="Securely orchestrate Salesforce, Slack, HubSpot, monday.com, and custom webhook automations"
      description="Rotate credentials, test connectivity, and manage webhook automation with full audit logging."
      menuSections={MENU_SECTIONS}
      sections={sections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="mx-auto w-full max-w-7xl space-y-12 px-6 py-10">
        <section id="integration-home" className="space-y-6">
          <IntegrationSummaryHeader
            workspace={workspace}
            summary={summary}
            availableWorkspaces={availableWorkspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onWorkspaceChange={(value) => setWorkspaceId(value)}
            onRefresh={refresh}
            refreshing={refreshing}
            lastLoadedAt={lastLoadedAt}
            onCreate={() => setCreationOpen(true)}
            canCreate={availableProviders.length > 0}
          />

          {error ? (
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p>{error}</p>
              <button type="button" onClick={clearError} className="text-xs font-semibold text-rose-600 underline">
                Dismiss
              </button>
            </div>
          ) : null}

          <IntegrationSandboxPanel
            environments={stubEnvironments}
            loading={stubLoading}
            error={stubError}
            onRetry={() => {
              loadStubEnvironments();
            }}
          />

        </section>

        <section id="integration-connect" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Connect</h2>
            {loading && !connectors.length ? <span className="text-sm text-slate-500">Loading…</span> : null}
          </div>
          {connectors.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {connectors.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  availableProviders={availableProviders}
                  onOpen={(target) => {
                    setActiveIntegrationId(target.id);
                    setDrawerOpen(true);
                  }}
                  onTestConnection={testConnection}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm text-slate-600 shadow-soft">
              {loading ? 'Loading…' : 'Create an integration to start syncing.'}
            </div>
          )}
        </section>

        <section id="integration-logs" className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Logs</h2>
          <IntegrationActivityLog auditLog={auditLog} />
        </section>

        <section id="integration-catalog" className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Catalog</h2>
          <IntegrationProviderCatalog providers={availableProviders} />
        </section>
      </div>

      <IntegrationManageDrawer
        open={drawerOpen && Boolean(activeIntegration)}
        integration={activeIntegration}
        availableProviders={availableProviders}
        webhookEventCatalog={webhookEventCatalog}
        onClose={() => setDrawerOpen(false)}
        onUpdate={updateIntegration}
        onRotateSecret={rotateSecret}
        onCreateWebhook={createWebhook}
        onUpdateWebhook={updateWebhook}
        onDeleteWebhook={deleteWebhook}
        onTestConnection={testConnection}
      />

      <IntegrationCreationWizard
        open={creationOpen}
        providers={availableProviders}
        submitting={creating}
        onSubmit={handleCreateIntegration}
        onClose={() => {
          if (!creating) {
            setCreationOpen(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
