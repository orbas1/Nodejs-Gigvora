import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import ApiProviderForm from '../../components/admin/api/ApiProviderForm.jsx';
import ApiClientForm from '../../components/admin/api/ApiClientForm.jsx';
import ApiClientUsageForm from '../../components/admin/api/ApiClientUsageForm.jsx';
import ApiKeySecretModal from '../../components/admin/api/ApiKeySecretModal.jsx';
import ApiOverviewPanel from '../../components/admin/api/ApiOverviewPanel.jsx';
import ApiProvidersPanel from '../../components/admin/api/ApiProvidersPanel.jsx';
import ApiClientsPanel from '../../components/admin/api/ApiClientsPanel.jsx';
import ApiAuditPanel from '../../components/admin/api/ApiAuditPanel.jsx';
import OverlayModal from '../../components/common/OverlayModal.jsx';
import SideDrawer from '../../components/common/SideDrawer.jsx';
import {
  fetchApiRegistry,
  createApiProvider,
  updateApiProvider,
  createApiClient,
  updateApiClient,
  issueApiClientKey,
  revokeApiClientKey,
  rotateWebhookSecret,
  fetchClientAuditEvents,
  recordClientUsage,
} from '../../services/adminApi.js';

const MENU_SECTIONS = [
  {
    id: 'sections',
    label: 'Sections',
    items: [
      { id: 'overview', name: 'Overview' },
      { id: 'providers', name: 'Providers' },
      { id: 'clients', name: 'Clients' },
      { id: 'audit', name: 'Audit' },
    ],
  },
  {
    id: 'dash',
    label: 'Dash',
    items: [
      { id: 'home', name: 'Admin', href: '/dashboard/admin', icon: ArrowTopRightOnSquareIcon },
    ],
  },
];

const SECTION_ORDER = MENU_SECTIONS[0].items.map((item) => ({ id: item.id, label: item.name }));

export default function AdminApiManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const isAdmin = Boolean(isAuthenticated && session?.roles?.includes('admin'));

  const [registry, setRegistry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const [activeSection, setActiveSection] = useState('overview');

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerDetail, setProviderDetail] = useState(null);

  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [usageClient, setUsageClient] = useState(null);
  const [usageSubmitting, setUsageSubmitting] = useState(false);

  const [issuedSecrets, setIssuedSecrets] = useState(null);

  const [auditClient, setAuditClient] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const refreshRegistry = useCallback(() => {
    setRefreshIndex((index) => index + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setRegistry(null);
      setLoading(false);
      return undefined;
    }

    const abortController = new AbortController();
    setLoading(true);
    setError(null);
    fetchApiRegistry({ signal: abortController.signal })
      .then((data) => {
        setRegistry(data);
        setError(null);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }
        const message = fetchError?.response?.data?.message ?? fetchError.message ?? 'Unable to load API registry.';
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => abortController.abort();
  }, [refreshIndex, isAdmin]);

  const providers = registry?.providers ?? [];
  const clients = useMemo(
    () =>
      providers.flatMap((provider) =>
        (provider.clients ?? []).map((client) => ({
          ...client,
          provider,
        })),
      ),
    [providers],
  );

  const summary = registry?.summary ?? {};

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const target = item?.id ?? itemId;
      if (SECTION_ORDER.some((section) => section.id === target)) {
        setActiveSection(target);
      }
    },
    [navigate],
  );

  const openCreateProvider = () => {
    setEditingProvider(null);
    setProviderModalOpen(true);
  };

  const openEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderModalOpen(true);
  };

  const closeProviderModal = () => {
    if (providerSubmitting) return;
    setProviderModalOpen(false);
    setEditingProvider(null);
  };

  const handleProviderSubmit = async (values) => {
    setProviderSubmitting(true);
    try {
      if (editingProvider) {
        await updateApiProvider(editingProvider.id, values);
        setNotice('Provider updated');
      } else {
        await createApiProvider(values);
        setNotice('Provider created');
      }
      closeProviderModal();
      refreshRegistry();
    } catch (submitError) {
      setError(submitError?.response?.data?.message ?? submitError.message ?? 'Unable to save provider.');
    } finally {
      setProviderSubmitting(false);
    }
  };

  const openCreateClient = (providerId) => {
    setEditingClient(providerId ? { providerId } : null);
    setClientDrawerOpen(true);
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setClientDrawerOpen(true);
  };

  const closeClientDrawer = () => {
    if (clientSubmitting) return;
    setClientDrawerOpen(false);
    setEditingClient(null);
  };

  const handleClientSubmit = async (values) => {
    setClientSubmitting(true);
    try {
      if (editingClient?.id) {
        await updateApiClient(editingClient.id, values);
        setNotice('Client updated');
      } else {
        const response = await createApiClient({ ...values, providerId: values.providerId ?? editingClient?.providerId });
        if (response?.credentials) {
          setIssuedSecrets({
            apiKey: response.credentials.apiKey ?? null,
            webhookSecret: response.credentials.webhookSecret ?? null,
            clientName: response.client?.name ?? 'API client',
          });
        }
        setNotice('Client created');
      }
      closeClientDrawer();
      refreshRegistry();
    } catch (submitError) {
      setError(submitError?.response?.data?.message ?? submitError.message ?? 'Unable to save client.');
    } finally {
      setClientSubmitting(false);
    }
  };

  const handleIssueKey = async (client) => {
    setClientSubmitting(true);
    try {
      const response = await issueApiClientKey(client.id, {});
      if (response?.plaintextKey) {
        setIssuedSecrets({ apiKey: response.plaintextKey, webhookSecret: null, clientName: client.name });
      }
      setNotice('Key issued');
      refreshRegistry();
    } catch (issueError) {
      setError(issueError?.response?.data?.message ?? issueError.message ?? 'Unable to issue key.');
    } finally {
      setClientSubmitting(false);
    }
  };

  const handleRevokeKey = async (client, keyId) => {
    try {
      await revokeApiClientKey(client.id, keyId);
      setNotice('Key revoked');
      refreshRegistry();
    } catch (revokeError) {
      setError(revokeError?.response?.data?.message ?? revokeError.message ?? 'Unable to revoke key.');
    }
  };

  const handleRotateWebhook = async (client) => {
    setClientSubmitting(true);
    try {
      const response = await rotateWebhookSecret(client.id);
      if (response?.webhookSecret) {
        setIssuedSecrets({ apiKey: null, webhookSecret: response.webhookSecret, clientName: client.name });
      }
      setNotice('Webhook secret rotated');
      refreshRegistry();
    } catch (rotateError) {
      setError(rotateError?.response?.data?.message ?? rotateError.message ?? 'Unable to rotate webhook secret.');
    } finally {
      setClientSubmitting(false);
    }
  };

  const handleViewAudit = async (client) => {
    setActiveSection('audit');
    setAuditClient(client);
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await fetchClientAuditEvents(client.id);
      setAuditEvents(response?.events ?? []);
    } catch (fetchError) {
      const message = fetchError?.response?.data?.message ?? fetchError.message ?? 'Unable to load audit events.';
      setAuditError(message);
      setAuditEvents([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRecordUsage = (client) => {
    setUsageClient(client);
  };

  const submitUsage = async (values) => {
    if (!usageClient) {
      return;
    }
    setUsageSubmitting(true);
    try {
      await recordClientUsage(usageClient.id, values);
      setNotice('Usage recorded');
      setUsageClient(null);
      refreshRegistry();
    } catch (submitError) {
      setError(submitError?.response?.data?.message ?? submitError.message ?? 'Unable to record usage.');
    } finally {
      setUsageSubmitting(false);
    }
  };

  const closeSecretModal = () => {
    setIssuedSecrets(null);
  };

  const clearNotice = () => setNotice(null);

  if (!isAdmin) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="API hub"
        subtitle="Access"
        menuSections={MENU_SECTIONS}
        onMenuItemSelect={handleMenuSelect}
        availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'].map((id) => ({
          id,
          href: `/dashboard/${id}`,
          label: `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
        }))}
        profile={session}
      >
        <div className="px-4 py-12">
          <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <ExclamationCircleIcon className="h-6 w-6" />
            <div className="text-sm font-semibold">Admin role required.</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="API hub"
      subtitle="Access"
      menuSections={MENU_SECTIONS}
      onMenuItemSelect={handleMenuSelect}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'].map((id) => ({
        id,
        href: `/dashboard/${id}`,
        label: `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
      }))}
      profile={session}
    >
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {SECTION_ORDER.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="mt-6 flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <InformationCircleIcon className="h-5 w-5" />
            <span>{notice}</span>
            <button type="button" onClick={clearNotice} className="ml-auto text-xs uppercase tracking-wide text-emerald-600">
              Dismiss
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 flex items-center gap-2 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <ExclamationCircleIcon className="h-5 w-5" /> {error}
          </div>
        ) : null}

        <div className="mt-6">
          {activeSection === 'overview' ? (
            <ApiOverviewPanel
              summary={summary}
              loading={loading}
              onRefresh={refreshRegistry}
              onAddProvider={openCreateProvider}
              onAddClient={() => openCreateClient(providers[0]?.id)}
            />
          ) : null}

          {activeSection === 'providers' ? (
            <ApiProvidersPanel
              providers={providers}
              onEdit={openEditProvider}
              onCreateClient={openCreateClient}
              onSelect={setProviderDetail}
            />
          ) : null}

          {activeSection === 'clients' ? (
            <ApiClientsPanel
              clients={clients}
              onEdit={openEditClient}
              onIssueKey={handleIssueKey}
              onRotateWebhook={handleRotateWebhook}
              onRevokeKey={handleRevokeKey}
              onViewAudit={handleViewAudit}
              onRecordUsage={handleRecordUsage}
              submitting={clientSubmitting}
            />
          ) : null}

          {activeSection === 'audit' ? (
            <ApiAuditPanel
              client={auditClient}
              events={auditEvents}
              loading={auditLoading}
              error={auditError}
              onRefresh={handleViewAudit}
            />
          ) : null}
        </div>
      </div>

      <OverlayModal
        open={providerModalOpen}
        onClose={closeProviderModal}
        title={editingProvider ? 'Edit provider' : 'Create provider'}
      >
        <ApiProviderForm
          initialValue={editingProvider}
          onSubmit={handleProviderSubmit}
          onCancel={closeProviderModal}
          submitting={providerSubmitting}
          title={editingProvider ? 'Edit provider' : 'Create provider'}
          submitLabel={editingProvider ? 'Save changes' : 'Create provider'}
        />
      </OverlayModal>

      <SideDrawer
        open={clientDrawerOpen}
        onClose={closeClientDrawer}
        title={editingClient?.id ? 'Update client' : 'Provision client'}
      >
        <ApiClientForm
          providers={providers}
          initialValue={editingClient?.id ? editingClient : editingClient?.providerId ? { providerId: editingClient.providerId } : null}
          onSubmit={handleClientSubmit}
          onCancel={closeClientDrawer}
          submitting={clientSubmitting}
          title={editingClient?.id ? 'Update client' : 'Provision client'}
          submitLabel={editingClient?.id ? 'Save changes' : 'Provision client'}
        />
      </SideDrawer>

      <OverlayModal
        open={Boolean(usageClient)}
        onClose={() => (usageSubmitting ? null : setUsageClient(null))}
        title="Record usage"
        maxWidth="max-w-2xl"
      >
        <ApiClientUsageForm
          client={usageClient}
          onSubmit={submitUsage}
          onCancel={() => setUsageClient(null)}
          submitting={usageSubmitting}
        />
      </OverlayModal>

      <OverlayModal
        open={Boolean(providerDetail)}
        onClose={() => setProviderDetail(null)}
        title={providerDetail?.name ?? 'Provider details'}
        maxWidth="max-w-3xl"
      >
        {providerDetail ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{providerDetail.status}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">30d calls</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{providerDetail.summary?.requestCount30d}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Call price</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  ${((providerDetail.callPriceCents ?? 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>
            {providerDetail.description ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</div>
                <p className="mt-1 text-slate-600">{providerDetail.description}</p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clients</div>
              <ul className="mt-2 space-y-2 text-slate-600">
                {(providerDetail.clients ?? []).map((client) => (
                  <li key={client.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>{client.name}</span>
                    <span className="text-xs text-slate-500">{client.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </OverlayModal>

      <ApiKeySecretModal
        open={Boolean(issuedSecrets)}
        onClose={closeSecretModal}
        apiKey={issuedSecrets?.apiKey ?? null}
        webhookSecret={issuedSecrets?.webhookSecret ?? null}
        clientName={issuedSecrets?.clientName ?? 'API client'}
      />
    </DashboardLayout>
  );
}
