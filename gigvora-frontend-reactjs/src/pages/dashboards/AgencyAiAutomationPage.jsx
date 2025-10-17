import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useAgencyAiControl from '../../hooks/useAgencyAiControl.js';
import AgencyAiOverview from '../../components/agency/AgencyAiOverview.jsx';
import AgencyAutoReplySettings from '../../components/agency/AgencyAutoReplySettings.jsx';
import AgencyApiKeyCard from '../../components/agency/AgencyApiKeyCard.jsx';
import AgencyBiddingStrategyForm from '../../components/agency/AgencyBiddingStrategyForm.jsx';
import AgencyBidTemplates from '../../components/agency/AgencyBidTemplates.jsx';
import AgencyAiActivityLog from '../../components/agency/AgencyAiActivityLog.jsx';

const MENU_SECTIONS = [
  {
    label: 'AI',
    items: [
      { name: 'Overview', sectionId: 'module-overview' },
      { name: 'Replies', sectionId: 'module-replies' },
      { name: 'Key', sectionId: 'module-key' },
      { name: 'Guard', sectionId: 'module-guard' },
      { name: 'Templates', sectionId: 'module-templates' },
      { name: 'Log', sectionId: 'module-log' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

function normalizeRoles(session) {
  const source = [
    ...(session?.memberships ?? []),
    session?.userType ? [session.userType] : [],
  ].flat();
  return Array.from(new Set(source.filter(Boolean).map((role) => String(role).toLowerCase())));
}

const MANAGEMENT_ROLE_IDS = new Set([
  'admin',
  'superadmin',
  'agency_admin',
  'agency-admin',
  'agency-owner',
  'agency_owner',
  'agency-manager',
  'agency_manager',
  'agency-lead',
  'agency_lead',
  'agency-operator',
  'agency_operator',
  'owner',
  'manager',
  'lead',
  'operator',
]);

function canManageAutomation(session) {
  const roles = normalizeRoles(session);
  return roles.some((role) => MANAGEMENT_ROLE_IDS.has(role));
}

export default function AgencyAiAutomationPage() {
  const { session, isAuthenticated } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const {
    data,
    loading,
    error,
    refresh,
    savingSettings,
    templateBusy,
    saveSettings,
    addTemplate,
    editTemplate,
    removeTemplate,
  } = useAgencyAiControl({ workspaceId: workspaceIdParam ?? undefined });

  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [openModuleId, setOpenModuleId] = useState(null);

  useEffect(() => {
    if (data) {
      setLastRefreshedAt(new Date());
    }
  }, [data]);

  const canManage = canManageAutomation(session);

  const workspaceOptions = useMemo(() => data?.availableWorkspaces ?? [], [data?.availableWorkspaces]);

  useEffect(() => {
    if (!workspaceIdParam && data?.workspace?.id) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set('workspaceId', `${data.workspace.id}`);
        return next;
      });
    }
  }, [workspaceIdParam, data?.workspace?.id, setSearchParams]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/agency/ai' }} />;
  }

  const workspaceName = data?.workspace?.name ?? 'Agency workspace';
  const analytics = data?.analytics ?? {};
  const autoReply = data?.autoReply ?? {};
  const apiKey = data?.apiKey ?? {};
  const bidding = data?.bidding ?? {};
  const templates = data?.templates ?? [];
  const activityLog = Array.isArray(data?.activityLog) ? data.activityLog : [];
  const latestActivity = activityLog[0];

  const formatPercent = (value) => {
    if (!Number.isFinite(value)) return '0%';
    const computed = Math.round(value * 1000) / 10;
    return `${computed.toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return new Intl.NumberFormat().format(value);
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  };

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const latestTemplate = useMemo(() => {
    if (!templates.length) {
      return null;
    }
    return [...templates].sort((a, b) => {
      const left = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      const right = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      return left - right;
    })[0];
  }, [templates]);

  const modules = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auto replies</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(analytics.autoRepliesLast7Days)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bid win rate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(analytics.bidWinRate)}</p>
            </div>
          </div>
        ),
        content: (
          <AgencyAiOverview
            analytics={analytics}
            workspaceName={workspaceName}
            loading={loading}
            onRefresh={handleRefresh}
            lastUpdated={lastRefreshedAt}
          />
        ),
      },
      {
        id: 'replies',
        label: 'Replies',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{autoReply.enabled ? 'On' : 'Off'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{autoReply.model ?? 'Unset'}</p>
              <p className="text-xs text-slate-500">{formatNumber((autoReply.channels ?? []).length)} channels</p>
            </div>
          </div>
        ),
        content: (
          <AgencyAutoReplySettings
            settings={autoReply}
            onSave={saveSettings}
            disabled={!canManage}
            busy={savingSettings}
          />
        ),
      },
      {
        id: 'key',
        label: 'Key',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fingerprint</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{apiKey.fingerprint ?? 'None'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(apiKey.updatedAt)}</p>
            </div>
          </div>
        ),
        content: (
          <AgencyApiKeyCard
            apiKey={apiKey}
            onSave={(payload) => saveSettings(payload)}
            onRemove={() => saveSettings({ removeApiKey: true })}
            disabled={!canManage}
            busy={savingSettings}
          />
        ),
      },
      {
        id: 'guard',
        label: 'Guard',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{(bidding.strategy ?? 'Balanced').replace(/_/g, ' ')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Markup</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(bidding.markupPercent ?? 0)}%</p>
              <p className="text-xs text-slate-500">Auto submit {bidding.autoSubmit ? 'On' : 'Off'}</p>
            </div>
          </div>
        ),
        content: (
          <AgencyBiddingStrategyForm
            bidding={bidding}
            onSave={saveSettings}
            disabled={!canManage}
            busy={savingSettings}
          />
        ),
      },
      {
        id: 'templates',
        label: 'Templates',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(templates.length)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest edit</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(latestTemplate?.updatedAt ?? latestTemplate?.createdAt)}</p>
            </div>
          </div>
        ),
        content: (
          <AgencyBidTemplates
            templates={templates}
            onCreate={addTemplate}
            onUpdate={editTemplate}
            onDelete={removeTemplate}
            disabled={!canManage}
            busy={templateBusy}
          />
        ),
      },
      {
        id: 'log',
        label: 'Log',
        preview: (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entries</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(activityLog.length)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{latestActivity?.summary ?? latestActivity?.type ?? '—'}</p>
              <p className="text-xs text-slate-500">{formatDateTime(latestActivity?.createdAt)}</p>
            </div>
          </div>
        ),
        content: <AgencyAiActivityLog activityLog={activityLog} />,
      },
    ],
    [activityLog, addTemplate, analytics, autoReply, bidding, canManage, editTemplate, handleRefresh, lastRefreshedAt, latestTemplate, loading, removeTemplate, saveSettings, savingSettings, templateBusy, templates, workspaceName],
  );

  const handleOpenModule = (moduleId) => {
    setOpenModuleId(moduleId);
  };

  const handleCloseModule = () => {
    setOpenModuleId(null);
  };

  const activeModule = modules.find((module) => module.id === openModuleId);

  const handleWorkspaceChange = (event) => {
    const nextId = event.target.value;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextId) {
        next.set('workspaceId', nextId);
      } else {
        next.delete('workspaceId');
      }
      return next;
    });
  };

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="AI Control"
      subtitle="Replies & bids"
      description=""
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="workspace-selector" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Workspace
            </label>
            <select
              id="workspace-selector"
              value={workspaceIdParam ?? data?.workspace?.id ?? ''}
              onChange={handleWorkspaceChange}
              className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/dashboard/agency"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            Ops
          </Link>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Load failed.</div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          {modules.map((module) => (
            <section
              key={module.id}
              id={`module-${module.id}`}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{module.label}</h2>
                <button
                  type="button"
                  onClick={() => handleOpenModule(module.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Open
                </button>
              </div>
              {module.preview}
            </section>
          ))}
        </div>
      </div>

      <Transition.Root show={Boolean(activeModule)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModule}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center px-4 py-10">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-4xl bg-white p-6 shadow-2xl transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {activeModule?.label}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={handleCloseModule}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Close</span>
                    </button>
                  </div>
                  <div className="mt-6 space-y-6">{activeModule?.content}</div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </DashboardLayout>
  );
}
