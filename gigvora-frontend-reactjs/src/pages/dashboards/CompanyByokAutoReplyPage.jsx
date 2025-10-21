import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import ByokCredentialCard from '../../components/company/auto-reply/ByokCredentialCard.jsx';
import AutoReplySettingsForm from '../../components/company/auto-reply/AutoReplySettingsForm.jsx';
import AutoReplyTemplatesTable from '../../components/company/auto-reply/AutoReplyTemplatesTable.jsx';
import AutoReplyActivityTimeline from '../../components/company/auto-reply/AutoReplyActivityTimeline.jsx';
import Modal from '../../components/ui/Modal.jsx';
import useCompanyAutoReply from '../../hooks/useCompanyAutoReply.js';
import useSession from '../../hooks/useSession.js';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import {
  updateAutoReplySettings,
  createAutoReplyTemplate,
  updateAutoReplyTemplate,
  deleteAutoReplyTemplate,
  testAutoReply,
} from '../../services/companyAutoReply.js';

const MENU_SECTIONS = [
  {
    label: 'AI',
    items: [
      {
        name: 'Keys',
        sectionId: 'section-keys',
      },
      {
        name: 'Rules',
        sectionId: 'section-rules',
      },
      {
        name: 'Replies',
        sectionId: 'section-templates',
      },
      {
        name: 'Logs',
        sectionId: 'section-activity',
      },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['company', 'user', 'freelancer', 'agency'];

export default function CompanyByokAutoReplyPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceId = workspaceIdParam && workspaceIdParam.length ? workspaceIdParam : null;

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');

  const { data, error, loading, refresh, fromCache, lastUpdated } = useCompanyAutoReply({
    workspaceId,
    enabled: isAuthenticated && isCompanyMember,
  });

  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialTesting, setCredentialTesting] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [templateBusy, setTemplateBusy] = useState({ creating: false, updatingId: null, deletingId: null });
  const [openPanel, setOpenPanel] = useState(null);

  const overview = data ?? {};
  const settings = overview.settings ?? null;
  const templates = overview.templates ?? [];
  const activity = overview.activity ?? [];

  const selectedWorkspaceId = workspaceId ?? settings?.workspaceId ?? null;

  const availableWorkspaces = useMemo(() => {
    const fromTemplates = templates
      .map((template) => template.workspaceId)
      .filter((value) => value != null)
      .map((value) => `${value}`);
    const unique = new Set([selectedWorkspaceId ? `${selectedWorkspaceId}` : null, ...fromTemplates].filter(Boolean));
    return Array.from(unique);
  }, [selectedWorkspaceId, templates]);

  const handleWorkspaceFilterChange = (event) => {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('workspaceId', value);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next, { replace: true });
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/ai-auto-reply' }} />;
  }

  if (!isCompanyMember) {
    const fallbackDashboards = membershipsList.filter((membership) => membership !== 'company');
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Auto Reply"
        subtitle="Bring your own key"
        description="Connect OpenAI keys and manage automated replies."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
      >
        <AccessDeniedPanel
          availableDashboards={fallbackDashboards}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  const handleCredentialSubmit = async (payload) => {
    setCredentialSaving(true);
    try {
      await updateAutoReplySettings({ ...payload, workspaceId: payload.workspaceId ?? selectedWorkspaceId });
      await refresh({ force: true });
    } finally {
      setCredentialSaving(false);
    }
  };

  const handleTestConnection = async (payload) => {
    setCredentialTesting(true);
    try {
      const result = await testAutoReply({ ...payload, workspaceId: payload.workspaceId ?? selectedWorkspaceId });
      await refresh({ force: true });
      return result;
    } finally {
      setCredentialTesting(false);
    }
  };

  const handleSettingsSubmit = async (payload) => {
    setSettingsSaving(true);
    try {
      await updateAutoReplySettings({ ...payload, workspaceId: selectedWorkspaceId });
      await refresh({ force: true });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleCreateTemplate = async (template) => {
    setTemplateBusy((prev) => ({ ...prev, creating: true }));
    try {
      await createAutoReplyTemplate({ workspaceId: selectedWorkspaceId, template });
      await refresh({ force: true });
    } finally {
      setTemplateBusy((prev) => ({ ...prev, creating: false }));
    }
  };

  const handleUpdateTemplate = async (templateId, template) => {
    setTemplateBusy((prev) => ({ ...prev, updatingId: templateId }));
    try {
      await updateAutoReplyTemplate(templateId, { workspaceId: selectedWorkspaceId, template });
      await refresh({ force: true });
    } finally {
      setTemplateBusy((prev) => ({ ...prev, updatingId: null }));
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    setTemplateBusy((prev) => ({ ...prev, deletingId: templateId }));
    try {
      await deleteAutoReplyTemplate(templateId, { workspaceId: selectedWorkspaceId });
      await refresh({ force: true });
    } finally {
      setTemplateBusy((prev) => ({ ...prev, deletingId: null }));
    }
  };

  const fingerprint = settings?.apiKey?.fingerprint || null;
  const baseUrl = settings?.connection?.baseUrl || 'https://api.openai.com/v1';
  const rulesEnabled = Boolean(settings?.autoReplies?.enabled);
  const channels = settings?.autoReplies?.channels ?? [];
  const model = settings?.model ?? 'gpt-4o-mini';
  const defaultTemplate = templates.find((template) => template.isDefault) ?? null;
  const templateCount = templates.length;

  const latestRun = useMemo(() => {
    if (!activity.length) {
      return null;
    }
    const sorted = [...activity].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return sorted[0];
  }, [activity]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  };

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Auto Reply"
      subtitle="BYOK"
      description=""
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <span>Workspace</span>
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={handleWorkspaceFilterChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">All</option>
              {availableWorkspaces.map((value) => (
                <option key={value} value={value}>
                  #{value}
                </option>
              ))}
            </select>
          </div>
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
            {error.message || 'Unable to load BYOK data.'}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="section-keys" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Keys</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>Status: {fingerprint ? 'Connected' : 'Missing'}</li>
                  <li>Endpoint: {baseUrl}</li>
                  <li>Fingerprint: {fingerprint || '—'}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel('keys')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Manage
              </button>
            </div>
          </section>

          <section id="section-rules" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Rules</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>Status: {rulesEnabled ? 'On' : 'Off'}</li>
                  <li>Model: {model}</li>
                  <li>Channels: {channels.length ? channels.join(', ') : 'None'}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel('rules')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Adjust
              </button>
            </div>
          </section>

          <section id="section-templates" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Replies</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>Total: {templateCount}</li>
                  <li>Default: {defaultTemplate ? defaultTemplate.title : 'None'}</li>
                  <li>Recent: {templates[0]?.title || '—'}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel('templates')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Open
              </button>
            </div>
          </section>

          <section id="section-activity" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Logs</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>Status: {latestRun?.status || 'None'}</li>
                  <li>Template: {latestRun?.template?.title || '—'}</li>
                  <li>When: {formatDate(latestRun?.createdAt)}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setOpenPanel('activity')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                View
              </button>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={openPanel === 'keys'}
        onClose={() => setOpenPanel(null)}
        title="OpenAI key"
        description="Rotate secrets and test the connection"
        wide
      >
        <ByokCredentialCard
          className="border-0 p-0 shadow-none"
          settings={settings}
          onSubmit={handleCredentialSubmit}
          onTest={handleTestConnection}
          saving={credentialSaving}
          testing={credentialTesting}
        />
      </Modal>

      <Modal
        open={openPanel === 'rules'}
        onClose={() => setOpenPanel(null)}
        title="Reply rules"
        description="Control availability and tone"
        wide
      >
        <AutoReplySettingsForm
          className="border-0 p-0 shadow-none"
          settings={settings}
          onSubmit={async (payload) => {
            await handleSettingsSubmit(payload);
            setOpenPanel(null);
          }}
          saving={settingsSaving}
        />
      </Modal>

      <Modal
        open={openPanel === 'templates'}
        onClose={() => setOpenPanel(null)}
        title="Reply templates"
        description="Create, edit, and organise responses"
        wide
      >
        <AutoReplyTemplatesTable
          className="border-0 p-0 shadow-none"
          templates={templates}
          onCreate={handleCreateTemplate}
          onUpdate={handleUpdateTemplate}
          onDelete={handleDeleteTemplate}
          busy={templateBusy}
        />
      </Modal>

      <Modal
        open={openPanel === 'activity'}
        onClose={() => setOpenPanel(null)}
        title="Activity"
        description="Latest auto replies and outcomes"
        wide
      >
        <AutoReplyActivityTimeline activity={activity} />
      </Modal>
    </DashboardLayout>
  );
}
