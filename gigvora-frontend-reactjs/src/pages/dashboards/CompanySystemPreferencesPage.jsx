import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ServerStackIcon,
  BoltIcon,
  GlobeAltIcon,
  KeyIcon,
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanySystemPreferences } from '../../hooks/useCompanySystemPreferences.js';
import {
  updateCompanySystemPreferences,
  createCompanyWebhook,
  updateCompanyWebhook,
  deleteCompanyWebhook,
  triggerCompanyWebhookTest,
  createCompanyApiToken,
  revokeCompanyApiToken,
} from '../../services/companySystemPreferences.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'headhunter', 'agency', 'user'];

function ToggleField({ label, description, value, onChange }) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
      />
    </label>
  );
}

export default function CompanySystemPreferencesPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const workspaceIdParam = searchParams.get('workspaceId');
  const selectedWorkspaceId = workspaceIdParam && `${workspaceIdParam}`.length ? workspaceIdParam : undefined;

  const {
    loading,
    error,
    lastUpdated,
    fromCache,
    refresh,
    preferences,
    automation,
    webhooks,
    apiTokens,
    workspace,
    workspaceOptions,
  } = useCompanySystemPreferences({ workspaceId: selectedWorkspaceId }, { enabled: isAuthenticated && isCompanyMember });

  const [feedback, setFeedback] = useState(null);
  const [automationForm, setAutomationForm] = useState({
    autoPublish: false,
    autoArchive: false,
    syncCrm: false,
    enforceTwoFactor: true,
    dataResidency: 'us',
    saving: false,
  });
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    events: 'creation.published',
    secret: '',
    saving: false,
  });
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [tokenForm, setTokenForm] = useState({ description: '', scopes: 'read:metrics', saving: false });

  useMemo(() => {
    if (automation && Object.keys(automation).length) {
      setAutomationForm((current) => ({
        ...current,
        autoPublish: automation.autoPublish ?? false,
        autoArchive: automation.autoArchive ?? false,
        syncCrm: automation.syncCrm ?? false,
        enforceTwoFactor: automation.enforceTwoFactor ?? true,
        dataResidency: automation.dataResidency ?? 'us',
        saving: false,
      }));
    }
  }, [automation]);

  const workspaceIdForMutations = selectedWorkspaceId ?? workspace?.id ?? undefined;

  const handleWorkspaceChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('workspaceId', value);
      } else {
        next.delete('workspaceId');
      }
      return next;
    }, { replace: true });
  };

  const handleAutomationSubmit = async (event) => {
    event.preventDefault();
    setAutomationForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await updateCompanySystemPreferences({
        workspaceId: workspaceIdForMutations,
        autoPublish: automationForm.autoPublish,
        autoArchive: automationForm.autoArchive,
        syncCrm: automationForm.syncCrm,
        enforceTwoFactor: automationForm.enforceTwoFactor,
        dataResidency: automationForm.dataResidency,
      });
      setAutomationForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'success', message: 'Automation preferences updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setAutomationForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to save automation preferences.' });
    }
  };

  const handleWebhookSubmit = async (event) => {
    event.preventDefault();
    if (!webhookForm.name || !webhookForm.url) {
      setFeedback({ type: 'error', message: 'Provide a webhook name and URL.' });
      return;
    }
    setWebhookForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await createCompanyWebhook({
        workspaceId: workspaceIdForMutations,
        name: webhookForm.name,
        url: webhookForm.url,
        events: webhookForm.events
          ? webhookForm.events
              .split(',')
              .map((eventName) => eventName.trim())
              .filter(Boolean)
          : [],
        secret: webhookForm.secret || undefined,
      });
      setWebhookForm({ name: '', url: '', events: 'creation.published', secret: '', saving: false });
      setFeedback({ type: 'success', message: 'Webhook registered.' });
      await refresh({ force: true });
    } catch (createError) {
      setWebhookForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to register webhook.' });
    }
  };

  const handleWebhookUpdate = async (event) => {
    event.preventDefault();
    if (!editingWebhook?.id) {
      return;
    }
    setEditingWebhook((current) => (current ? { ...current, saving: true } : current));
    setFeedback(null);
    try {
      await updateCompanyWebhook(editingWebhook.id, {
        workspaceId: workspaceIdForMutations,
        name: editingWebhook.name,
        url: editingWebhook.url,
        events: editingWebhook.events
          ? editingWebhook.events
              .split(',')
              .map((eventName) => eventName.trim())
              .filter(Boolean)
          : [],
        secret: editingWebhook.secret || undefined,
        status: editingWebhook.status || undefined,
      });
      setEditingWebhook(null);
      setFeedback({ type: 'success', message: 'Webhook updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setEditingWebhook((current) => (current ? { ...current, saving: false } : current));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update webhook.' });
    }
  };

  const handleWebhookDelete = async (webhookId) => {
    if (!webhookId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this webhook subscription?')) {
      return;
    }
    setFeedback(null);
    try {
      await deleteCompanyWebhook(webhookId);
      setFeedback({ type: 'success', message: 'Webhook removed.' });
      await refresh({ force: true });
    } catch (deleteError) {
      setFeedback({ type: 'error', message: deleteError?.message ?? 'Unable to remove webhook.' });
    }
  };

  const handleWebhookTest = async (webhookId) => {
    if (!webhookId) {
      return;
    }
    try {
      await triggerCompanyWebhookTest(webhookId, { workspaceId: workspaceIdForMutations });
      setFeedback({ type: 'success', message: 'Test event sent.' });
    } catch (testError) {
      setFeedback({ type: 'error', message: testError?.message ?? 'Unable to send test event.' });
    }
  };

  const handleTokenCreate = async (event) => {
    event.preventDefault();
    if (!tokenForm.description) {
      setFeedback({ type: 'error', message: 'Add a description for the API token.' });
      return;
    }
    setTokenForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await createCompanyApiToken({
        workspaceId: workspaceIdForMutations,
        description: tokenForm.description,
        scopes: tokenForm.scopes
          ? tokenForm.scopes
              .split(',')
              .map((scope) => scope.trim())
              .filter(Boolean)
          : [],
      });
      setTokenForm({ description: '', scopes: 'read:metrics', saving: false });
      setFeedback({ type: 'success', message: 'API token generated.' });
      await refresh({ force: true });
    } catch (tokenError) {
      setTokenForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: tokenError?.message ?? 'Unable to create API token.' });
    }
  };

  const handleTokenRevoke = async (tokenId) => {
    if (!tokenId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Revoke this API token?')) {
      return;
    }
    setFeedback(null);
    try {
      await revokeCompanyApiToken(tokenId);
      setFeedback({ type: 'success', message: 'API token revoked.' });
      await refresh({ force: true });
    } catch (revokeError) {
      setFeedback({ type: 'error', message: revokeError?.message ?? 'Unable to revoke API token.' });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/system-preferences' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="System preferences"
        subtitle="Automation & platform integration"
        description="Fine-tune automation, webhooks, and secure API access for your company workspace."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={memberships.filter((membership) => membership !== 'company')}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="System preferences"
      subtitle="Automation & platform integration"
      description="Fine-tune automation, webhooks, and secure API access for your company workspace."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem="company-system-preferences"
      profile={workspace}
    >
      <div className="space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Automation & integrations</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Manage automation guardrails, outbound webhooks, and programmatic access to keep operations synchronised across platforms.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            {workspaceOptions.length ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Workspace</span>
                <select
                  value={selectedWorkspaceId ?? ''}
                  onChange={(event) => handleWorkspaceChange(event.target.value || undefined)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none"
                >
                  <option value="">Default</option>
                  {workspaceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <DataStatus
              loading={loading}
              error={error}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              onRefresh={() => refresh({ force: true })}
            />
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <header className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">
              <BoltIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Automation guardrails</h2>
              <p className="text-sm text-slate-600">Control publishing automation, archival policies, and CRM synchronisation.</p>
            </div>
          </header>
          <form className="space-y-4" onSubmit={handleAutomationSubmit}>
            <ToggleField
              label="Auto publish approved creations"
              description="When enabled, creation studio items publish immediately after approvals."
              value={automationForm.autoPublish}
              onChange={(value) => setAutomationForm((current) => ({ ...current, autoPublish: value }))}
            />
            <ToggleField
              label="Auto archive inactive postings"
              description="Archive postings automatically after inactivity to keep inventory fresh."
              value={automationForm.autoArchive}
              onChange={(value) => setAutomationForm((current) => ({ ...current, autoArchive: value }))}
            />
            <ToggleField
              label="Sync with CRM"
              description="Mirror candidate and deal stages with your connected CRM partners."
              value={automationForm.syncCrm}
              onChange={(value) => setAutomationForm((current) => ({ ...current, syncCrm: value }))}
            />
            <ToggleField
              label="Enforce two-factor for approvers"
              description="Require verified 2FA before approvers can action high-risk workflows."
              value={automationForm.enforceTwoFactor}
              onChange={(value) => setAutomationForm((current) => ({ ...current, enforceTwoFactor: value }))}
            />
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data residency
              <select
                value={automationForm.dataResidency}
                onChange={(event) => setAutomationForm((current) => ({ ...current, dataResidency: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="us">United States</option>
                <option value="eu">European Union</option>
                <option value="apac">Asia Pacific</option>
              </select>
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={automationForm.saving}
              >
                {automationForm.saving ? 'Saving…' : 'Save automation controls'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <header className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600">
              <GlobeAltIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Webhook subscriptions</h2>
              <p className="text-sm text-slate-600">Notify downstream systems about creation studio events, approvals, and offers.</p>
            </div>
          </header>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleWebhookSubmit}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
              <input
                type="text"
                value={webhookForm.name}
                onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Offer notifications"
                required
              />
            </label>
            <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Endpoint URL
              <input
                type="url"
                value={webhookForm.url}
                onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="https://api.partner.com/webhooks/gigvora"
                required
              />
            </label>
            <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Events (comma separated)
              <input
                type="text"
                value={webhookForm.events}
                onChange={(event) => setWebhookForm((current) => ({ ...current, events: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="creation.published, offer.accepted"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signing secret
              <input
                type="text"
                value={webhookForm.secret}
                onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Optional"
              />
            </label>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={webhookForm.saving}
              >
                <PlusIcon className="h-4 w-4" />
                {webhookForm.saving ? 'Saving…' : 'Add webhook'}
              </button>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {webhooks.length === 0 ? (
              <p className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                No webhooks registered yet. Add endpoints to broadcast events to downstream systems.
              </p>
            ) : (
              webhooks.map((webhook) => {
                const editing = editingWebhook?.id === webhook.id;
                return (
                  <article key={webhook.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{webhook.status ?? 'active'}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{webhook.name}</h3>
                        <p className="text-xs text-slate-500 break-all">{webhook.url}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        {(webhook.events ?? []).length} events
                      </span>
                    </div>
                    {editing ? (
                      <form className="space-y-3" onSubmit={handleWebhookUpdate}>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Name
                          <input
                            type="text"
                            value={editingWebhook.name}
                            onChange={(event) => setEditingWebhook((current) => ({ ...current, name: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            required
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          URL
                          <input
                            type="url"
                            value={editingWebhook.url}
                            onChange={(event) => setEditingWebhook((current) => ({ ...current, url: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            required
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Events
                          <input
                            type="text"
                            value={editingWebhook.events ?? ''}
                            onChange={(event) => setEditingWebhook((current) => ({ ...current, events: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Signing secret
                          <input
                            type="text"
                            value={editingWebhook.secret ?? ''}
                            onChange={(event) => setEditingWebhook((current) => ({ ...current, secret: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                          <select
                            value={editingWebhook.status ?? 'active'}
                            onChange={(event) => setEditingWebhook((current) => ({ ...current, status: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                          </select>
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={editingWebhook.saving}
                          >
                            {editingWebhook.saving ? 'Saving…' : 'Save webhook'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWebhook(null)}
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingWebhook({
                            ...webhook,
                            events: Array.isArray(webhook.events) ? webhook.events.join(', ') : webhook.events ?? '',
                            saving: false,
                          })}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWebhookTest(webhook.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-800"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Send test
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWebhookDelete(webhook.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <header className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">
              <KeyIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">API access</h2>
              <p className="text-sm text-slate-600">Provision scoped tokens for integrations and automation scripts.</p>
            </div>
          </header>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleTokenCreate}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
              <input
                type="text"
                value={tokenForm.description}
                onChange={(event) => setTokenForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Integration user"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Scopes (comma separated)
              <input
                type="text"
                value={tokenForm.scopes}
                onChange={(event) => setTokenForm((current) => ({ ...current, scopes: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="read:metrics, write:offers"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={tokenForm.saving}
              >
                <PlusIcon className="h-4 w-4" />
                {tokenForm.saving ? 'Generating…' : 'Generate API token'}
              </button>
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Scopes</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiTokens.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-center text-xs text-slate-400" colSpan={4}>
                      No API tokens active. Generate a token to connect automation clients.
                    </td>
                  </tr>
                ) : (
                  apiTokens.map((token) => (
                    <tr key={token.id}>
                      <td className="px-4 py-3 font-medium text-slate-700">{token.description}</td>
                      <td className="px-4 py-3 text-slate-500">{Array.isArray(token.scopes) ? token.scopes.join(', ') : token.scopes}</td>
                      <td className="px-4 py-3 text-slate-500">{token.createdAt ? new Date(token.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleTokenRevoke(token.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
