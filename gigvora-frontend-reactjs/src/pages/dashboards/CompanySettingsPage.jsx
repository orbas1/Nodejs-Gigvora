import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Cog6ToothIcon,
  BellIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { useCompanySettings } from '../../hooks/useCompanySettings.js';
import {
  updateCompanySettings,
  updateCompanyNotificationSettings,
  createCompanyWorkflow,
  updateCompanyWorkflow,
  deleteCompanyWorkflow,
  createCompanyJourneyTemplate,
  updateCompanyJourneyTemplate,
  deleteCompanyJourneyTemplate,
} from '../../services/companySettings.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';

const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'headhunter', 'agency', 'user'];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <header className="flex items-start gap-3">
      <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
    </header>
  );
}

export default function CompanySettingsPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const memberships = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && memberships.includes('company');

  const workspaceIdParam = searchParams.get('workspaceId');
  const selectedWorkspaceId = workspaceIdParam && `${workspaceIdParam}`.length ? workspaceIdParam : undefined;

  const { data, loading, error, lastUpdated, fromCache, refresh, general, notifications, workflows, journeys, directories, workspace, workspaceOptions } = useCompanySettings(
    { workspaceId: selectedWorkspaceId },
    { enabled: isAuthenticated && isCompanyMember },
  );

  const [feedback, setFeedback] = useState(null);
  const [generalForm, setGeneralForm] = useState({
    tagline: '',
    mission: '',
    timezone: 'UTC',
    defaultVisibility: 'workspace',
    autoArchiveDays: '',
    escalationEmail: '',
    themeColor: '',
    saving: false,
  });
  const [notificationsForm, setNotificationsForm] = useState({
    digestFrequency: 'weekly',
    enableSlack: false,
    enableEmail: true,
    approvalsDigest: true,
    newFollowerAlerts: true,
    saving: false,
  });
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    trigger: 'job_opening',
    approvers: '',
    escalationMinutes: '',
    saving: false,
  });
  const [journeyForm, setJourneyForm] = useState({
    name: '',
    audience: 'new_hire',
    milestones: '',
    ownerEmail: '',
    saving: false,
  });
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [editingJourney, setEditingJourney] = useState(null);

  useMemo(() => {
    if (general && Object.keys(general).length) {
      setGeneralForm((current) => ({
        ...current,
        tagline: general.tagline ?? '',
        mission: general.mission ?? '',
        timezone: general.timezone ?? 'UTC',
        defaultVisibility: general.defaultVisibility ?? 'workspace',
        autoArchiveDays: general.autoArchiveDays != null ? `${general.autoArchiveDays}` : '',
        escalationEmail: general.escalationEmail ?? '',
        themeColor: general.themeColor ?? '',
        saving: false,
      }));
    }
    if (notifications && Object.keys(notifications).length) {
      setNotificationsForm((current) => ({
        ...current,
        digestFrequency: notifications.digestFrequency ?? 'weekly',
        enableSlack: notifications.enableSlack ?? false,
        enableEmail: notifications.enableEmail ?? true,
        approvalsDigest: notifications.approvalsDigest ?? true,
        newFollowerAlerts: notifications.newFollowerAlerts ?? true,
        saving: false,
      }));
    }
  }, [general, notifications]);

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

  const handleGeneralSubmit = async (event) => {
    event.preventDefault();
    setGeneralForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await updateCompanySettings({
        workspaceId: workspaceIdForMutations,
        tagline: generalForm.tagline || undefined,
        mission: generalForm.mission || undefined,
        timezone: generalForm.timezone,
        defaultVisibility: generalForm.defaultVisibility,
        autoArchiveDays:
          generalForm.autoArchiveDays !== '' ? Number.parseInt(generalForm.autoArchiveDays, 10) : undefined,
        escalationEmail: generalForm.escalationEmail || undefined,
        themeColor: generalForm.themeColor || undefined,
      });
      setGeneralForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'success', message: 'Workspace settings updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setGeneralForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update settings.' });
    }
  };

  const handleNotificationsSubmit = async (event) => {
    event.preventDefault();
    setNotificationsForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await updateCompanyNotificationSettings({
        workspaceId: workspaceIdForMutations,
        digestFrequency: notificationsForm.digestFrequency,
        enableSlack: notificationsForm.enableSlack,
        enableEmail: notificationsForm.enableEmail,
        approvalsDigest: notificationsForm.approvalsDigest,
        newFollowerAlerts: notificationsForm.newFollowerAlerts,
      });
      setNotificationsForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'success', message: 'Notification preferences saved.' });
      await refresh({ force: true });
    } catch (notifyError) {
      setNotificationsForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: notifyError?.message ?? 'Unable to update notifications.' });
    }
  };

  const handleWorkflowSubmit = async (event) => {
    event.preventDefault();
    if (!workflowForm.name) {
      setFeedback({ type: 'error', message: 'Add a workflow name before saving.' });
      return;
    }
    setWorkflowForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await createCompanyWorkflow({
        workspaceId: workspaceIdForMutations,
        name: workflowForm.name,
        trigger: workflowForm.trigger,
        approvers: workflowForm.approvers
          ? workflowForm.approvers
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        escalationMinutes:
          workflowForm.escalationMinutes !== '' ? Number.parseInt(workflowForm.escalationMinutes, 10) : undefined,
      });
      setWorkflowForm({ name: '', trigger: 'job_opening', approvers: '', escalationMinutes: '', saving: false });
      setFeedback({ type: 'success', message: 'Workflow created.' });
      await refresh({ force: true });
    } catch (createError) {
      setWorkflowForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to create workflow.' });
    }
  };

  const handleWorkflowUpdate = async (event) => {
    event.preventDefault();
    if (!editingWorkflow?.id) {
      return;
    }
    setEditingWorkflow((current) => (current ? { ...current, saving: true } : current));
    setFeedback(null);
    try {
      await updateCompanyWorkflow(editingWorkflow.id, {
        workspaceId: workspaceIdForMutations,
        name: editingWorkflow.name,
        trigger: editingWorkflow.trigger,
        approvers: editingWorkflow.approvers
          ? editingWorkflow.approvers
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        escalationMinutes:
          editingWorkflow.escalationMinutes !== ''
            ? Number.parseInt(editingWorkflow.escalationMinutes, 10)
            : undefined,
        status: editingWorkflow.status || undefined,
      });
      setEditingWorkflow(null);
      setFeedback({ type: 'success', message: 'Workflow updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setEditingWorkflow((current) => (current ? { ...current, saving: false } : current));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update workflow.' });
    }
  };

  const handleWorkflowDelete = async (workflowId) => {
    if (!workflowId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Archive this workflow?')) {
      return;
    }
    setFeedback(null);
    try {
      await deleteCompanyWorkflow(workflowId);
      setFeedback({ type: 'success', message: 'Workflow archived.' });
      await refresh({ force: true });
    } catch (deleteError) {
      setFeedback({ type: 'error', message: deleteError?.message ?? 'Unable to archive workflow.' });
    }
  };

  const handleJourneySubmit = async (event) => {
    event.preventDefault();
    if (!journeyForm.name) {
      setFeedback({ type: 'error', message: 'Add a journey name before saving.' });
      return;
    }
    setJourneyForm((current) => ({ ...current, saving: true }));
    setFeedback(null);
    try {
      await createCompanyJourneyTemplate({
        workspaceId: workspaceIdForMutations,
        name: journeyForm.name,
        audience: journeyForm.audience,
        milestones: journeyForm.milestones
          ? journeyForm.milestones
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        ownerEmail: journeyForm.ownerEmail || undefined,
      });
      setJourneyForm({ name: '', audience: 'new_hire', milestones: '', ownerEmail: '', saving: false });
      setFeedback({ type: 'success', message: 'Journey template created.' });
      await refresh({ force: true });
    } catch (createError) {
      setJourneyForm((current) => ({ ...current, saving: false }));
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to create journey.' });
    }
  };

  const handleJourneyUpdate = async (event) => {
    event.preventDefault();
    if (!editingJourney?.id) {
      return;
    }
    setEditingJourney((current) => (current ? { ...current, saving: true } : current));
    setFeedback(null);
    try {
      await updateCompanyJourneyTemplate(editingJourney.id, {
        workspaceId: workspaceIdForMutations,
        name: editingJourney.name,
        audience: editingJourney.audience,
        milestones: editingJourney.milestones
          ? editingJourney.milestones
              .split('\n')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
        ownerEmail: editingJourney.ownerEmail || undefined,
      });
      setEditingJourney(null);
      setFeedback({ type: 'success', message: 'Journey updated.' });
      await refresh({ force: true });
    } catch (updateError) {
      setEditingJourney((current) => (current ? { ...current, saving: false } : current));
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update journey.' });
    }
  };

  const handleJourneyDelete = async (templateId) => {
    if (!templateId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this journey template?')) {
      return;
    }
    setFeedback(null);
    try {
      await deleteCompanyJourneyTemplate(templateId);
      setFeedback({ type: 'success', message: 'Journey removed.' });
      await refresh({ force: true });
    } catch (deleteError) {
      setFeedback({ type: 'error', message: deleteError?.message ?? 'Unable to delete journey.' });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/settings' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Settings"
        subtitle="Workspace controls"
        description="Manage workspace defaults, approvals, journeys, and collaboration signals."
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
      title="Settings"
      subtitle="Workspace controls"
      description="Manage workspace defaults, approvals, journeys, and collaboration signals."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem="company-settings"
      profile={workspace}
    >
      <div className="space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Workspace configuration</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Configure governance defaults, communication preferences, and guided journeys for hiring collaborators.
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
          <SectionHeader icon={Cog6ToothIcon} title="General workspace defaults" description="Brand voice, visibility, and retention automation." />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleGeneralSubmit}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tagline
              <input
                type="text"
                value={generalForm.tagline}
                onChange={(event) => setGeneralForm((current) => ({ ...current, tagline: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Build legendary teams"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Timezone
              <select
                value={generalForm.timezone}
                onChange={(event) => setGeneralForm((current) => ({ ...current, timezone: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </label>
            <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mission statement
              <textarea
                value={generalForm.mission}
                onChange={(event) => setGeneralForm((current) => ({ ...current, mission: event.target.value }))}
                className="mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Explain the purpose that guides your hiring programmes."
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Default visibility
              <select
                value={generalForm.defaultVisibility}
                onChange={(event) => setGeneralForm((current) => ({ ...current, defaultVisibility: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="workspace">Workspace</option>
                <option value="connections">Connections</option>
                <option value="community">Community</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Auto-archive (days)
              <input
                type="number"
                value={generalForm.autoArchiveDays}
                onChange={(event) => setGeneralForm((current) => ({ ...current, autoArchiveDays: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="30"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Escalation email
              <input
                type="email"
                value={generalForm.escalationEmail}
                onChange={(event) => setGeneralForm((current) => ({ ...current, escalationEmail: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="security@gigvora.com"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Theme colour
              <input
                type="text"
                value={generalForm.themeColor}
                onChange={(event) => setGeneralForm((current) => ({ ...current, themeColor: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="#1f2937"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={generalForm.saving}
              >
                {generalForm.saving ? 'Saving…' : 'Save workspace defaults'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <SectionHeader icon={BellIcon} title="Notifications" description="Control how alerts and summaries reach the team." />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleNotificationsSubmit}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Digest frequency
              <select
                value={notificationsForm.digestFrequency}
                onChange={(event) => setNotificationsForm((current) => ({ ...current, digestFrequency: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={notificationsForm.enableEmail}
                onChange={(event) => setNotificationsForm((current) => ({ ...current, enableEmail: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Email updates
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={notificationsForm.enableSlack}
                onChange={(event) => setNotificationsForm((current) => ({ ...current, enableSlack: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Slack alerts
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={notificationsForm.approvalsDigest}
                onChange={(event) => setNotificationsForm((current) => ({ ...current, approvalsDigest: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Weekly approvals digest
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <input
                type="checkbox"
                checked={notificationsForm.newFollowerAlerts}
                onChange={(event) => setNotificationsForm((current) => ({ ...current, newFollowerAlerts: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Notify when new followers join
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={notificationsForm.saving}
              >
                {notificationsForm.saving ? 'Saving…' : 'Save notification preferences'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <SectionHeader icon={ShieldCheckIcon} title="Approval workflows" description="Automate reviews across jobs, gigs, and offers." />
          <form className="grid gap-4 md:grid-cols-4" onSubmit={handleWorkflowSubmit}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
              Workflow name
              <input
                type="text"
                value={workflowForm.name}
                onChange={(event) => setWorkflowForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Job offer approvals"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trigger
              <select
                value={workflowForm.trigger}
                onChange={(event) => setWorkflowForm((current) => ({ ...current, trigger: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="job_opening">Job opening</option>
                <option value="offer">Offer issued</option>
                <option value="contract">Contract request</option>
                <option value="budget_change">Budget change</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Escalation (minutes)
              <input
                type="number"
                value={workflowForm.escalationMinutes}
                onChange={(event) => setWorkflowForm((current) => ({ ...current, escalationMinutes: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="120"
              />
            </label>
            <label className="md:col-span-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Approver emails (comma separated)
              <input
                type="text"
                value={workflowForm.approvers}
                onChange={(event) => setWorkflowForm((current) => ({ ...current, approvers: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="talentlead@gigvora.com, finance@gigvora.com"
              />
            </label>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={workflowForm.saving}
              >
                <PlusIcon className="h-4 w-4" />
                {workflowForm.saving ? 'Saving…' : 'Add workflow'}
              </button>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {workflows.length === 0 ? (
              <p className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                No workflows configured yet. Add your first approval automation.
              </p>
            ) : (
              workflows.map((workflow) => {
                const editing = editingWorkflow?.id === workflow.id;
                return (
                  <article key={workflow.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{workflow.trigger}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{workflow.name}</h3>
                        <p className="text-xs text-slate-500">
                          Approvers: {workflow.approvers?.length ? workflow.approvers.join(', ') : 'Not configured'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          workflow.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {workflow.status ?? 'active'}
                      </span>
                    </div>
                    {editing ? (
                      <form className="space-y-3" onSubmit={handleWorkflowUpdate}>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Name
                          <input
                            type="text"
                            value={editingWorkflow.name}
                            onChange={(event) => setEditingWorkflow((current) => ({ ...current, name: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            required
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Trigger
                          <select
                            value={editingWorkflow.trigger}
                            onChange={(event) => setEditingWorkflow((current) => ({ ...current, trigger: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          >
                            <option value="job_opening">Job opening</option>
                            <option value="offer">Offer issued</option>
                            <option value="contract">Contract request</option>
                            <option value="budget_change">Budget change</option>
                          </select>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Approvers
                          <input
                            type="text"
                            value={editingWorkflow.approvers ?? ''}
                            onChange={(event) => setEditingWorkflow((current) => ({ ...current, approvers: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Escalation (minutes)
                          <input
                            type="number"
                            value={editingWorkflow.escalationMinutes ?? ''}
                            onChange={(event) => setEditingWorkflow((current) => ({ ...current, escalationMinutes: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                          <select
                            value={editingWorkflow.status ?? 'active'}
                            onChange={(event) => setEditingWorkflow((current) => ({ ...current, status: event.target.value }))}
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
                            disabled={editingWorkflow.saving}
                          >
                            {editingWorkflow.saving ? 'Saving…' : 'Save workflow'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWorkflow(null)}
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
                          onClick={() => setEditingWorkflow({
                            ...workflow,
                            approvers: Array.isArray(workflow.approvers) ? workflow.approvers.join(', ') : workflow.approvers ?? '',
                            escalationMinutes:
                              workflow.escalationMinutes != null ? `${workflow.escalationMinutes}` : '',
                            saving: false,
                          })}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWorkflowDelete(workflow.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Archive
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
          <SectionHeader icon={UserGroupIcon} title="Journey templates" description="Guide candidates and new hires through curated milestones." />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleJourneySubmit}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Journey name
              <input
                type="text"
                value={journeyForm.name}
                onChange={(event) => setJourneyForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="Launchpad onboarding"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Audience
              <select
                value={journeyForm.audience}
                onChange={(event) => setJourneyForm((current) => ({ ...current, audience: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="new_hire">New hire</option>
                <option value="candidate">Candidate</option>
                <option value="contractor">Contractor</option>
                <option value="mentor">Mentor</option>
              </select>
            </label>
            <label className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Milestones (one per line)
              <textarea
                value={journeyForm.milestones}
                onChange={(event) => setJourneyForm((current) => ({ ...current, milestones: event.target.value }))}
                className="mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder={"Kick-off call\nSecurity onboarding\nFirst deliverable"}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner email
              <input
                type="email"
                value={journeyForm.ownerEmail}
                onChange={(event) => setJourneyForm((current) => ({ ...current, ownerEmail: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                placeholder="journeys@gigvora.com"
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                disabled={journeyForm.saving}
              >
                <PlusIcon className="h-4 w-4" />
                {journeyForm.saving ? 'Saving…' : 'Add journey template'}
              </button>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {journeys.length === 0 ? (
              <p className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                No journey templates yet. Create journeys to automate onboarding touchpoints.
              </p>
            ) : (
              journeys.map((journey) => {
                const editing = editingJourney?.id === journey.id;
                return (
                  <article key={journey.id} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{journey.audience}</p>
                        <h3 className="text-lg font-semibold text-slate-900">{journey.name}</h3>
                        <p className="text-xs text-slate-500">
                          {journey.milestones?.length ? `${journey.milestones.length} milestones` : 'No milestones yet'}
                        </p>
                      </div>
                      {journey.ownerEmail ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {journey.ownerEmail}
                        </span>
                      ) : null}
                    </div>
                    {editing ? (
                      <form className="space-y-3" onSubmit={handleJourneyUpdate}>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Name
                          <input
                            type="text"
                            value={editingJourney.name}
                            onChange={(event) => setEditingJourney((current) => ({ ...current, name: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                            required
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Audience
                          <select
                            value={editingJourney.audience}
                            onChange={(event) => setEditingJourney((current) => ({ ...current, audience: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          >
                            <option value="new_hire">New hire</option>
                            <option value="candidate">Candidate</option>
                            <option value="contractor">Contractor</option>
                            <option value="mentor">Mentor</option>
                          </select>
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Milestones
                          <textarea
                            value={editingJourney.milestones ?? ''}
                            onChange={(event) => setEditingJourney((current) => ({ ...current, milestones: event.target.value }))}
                            className="mt-1 h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Owner email
                          <input
                            type="email"
                            value={editingJourney.ownerEmail ?? ''}
                            onChange={(event) => setEditingJourney((current) => ({ ...current, ownerEmail: event.target.value }))}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={editingJourney.saving}
                          >
                            {editingJourney.saving ? 'Saving…' : 'Save journey'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingJourney(null)}
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
                          onClick={() => setEditingJourney({
                            ...journey,
                            milestones: Array.isArray(journey.milestones)
                              ? journey.milestones.join('\n')
                              : journey.milestones ?? '',
                            saving: false,
                          })}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJourneyDelete(journey.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>

        {directories ? (
          <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
            <SectionHeader icon={Cog6ToothIcon} title="Key contacts" description="Reference escalation paths across recruiting, finance, and IT." />
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(directories).map(([key, entries]) => (
                <div key={key} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{key.replace(/_/g, ' ')}</h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600">
                    {(Array.isArray(entries) ? entries : []).map((entry, index) => (
                      <li key={index} className="space-y-0.5">
                        <p className="font-medium text-slate-800">{entry.name ?? entry.email ?? 'Contact'}</p>
                        {entry.role ? <p>{entry.role}</p> : null}
                        {entry.email ? <p className="text-slate-500">{entry.email}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
