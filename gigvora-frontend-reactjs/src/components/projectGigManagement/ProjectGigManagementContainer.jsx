import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';

const PROJECT_MANAGEMENT_ROLE_LABELS = [
  'Agency lead',
  'Operations lead',
  'Company operator',
  'Workspace admin',
  'Platform admin',
];

const INITIAL_PROJECT_FORM = {
  title: '',
  description: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  dueDate: '',
};

const INITIAL_GIG_FORM = {
  vendorName: '',
  serviceName: '',
  amount: '',
  currency: 'USD',
  dueAt: '',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function validateProjectForm(values) {
  const errors = {};
  if (!values.title?.trim()) {
    errors.title = 'Enter a project title.';
  } else if (values.title.trim().length < 3) {
    errors.title = 'Project titles should be at least three characters.';
  }

  if (!values.description?.trim()) {
    errors.description = 'Describe the project goals and collaborators.';
  } else if (values.description.trim().length < 24) {
    errors.description = 'Add more context so teammates understand the scope.';
  }

  if (values.budgetAllocated !== '') {
    const amount = parseNumber(values.budgetAllocated);
    if (amount == null) {
      errors.budgetAllocated = 'Budget must be a valid number.';
    } else if (amount < 0) {
      errors.budgetAllocated = 'Budget cannot be negative.';
    } else if (amount > 1_000_000_000) {
      errors.budgetAllocated = 'Budget exceeds the governance threshold.';
    }
  }

  if (values.dueDate) {
    const due = new Date(values.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = 'Choose a valid target completion date.';
    } else if (due < startOfToday()) {
      errors.dueDate = 'Target completion cannot be in the past.';
    }
  }

  return errors;
}

function validateGigForm(values) {
  const errors = {};
  if (!values.vendorName?.trim()) {
    errors.vendorName = 'Add the vendor name so compliance can verify them.';
  }
  if (!values.serviceName?.trim()) {
    errors.serviceName = 'Describe the purchased service.';
  }

  if (values.amount !== '') {
    const amount = parseNumber(values.amount);
    if (amount == null) {
      errors.amount = 'Amount must be a valid number.';
    } else if (amount < 0) {
      errors.amount = 'Amount cannot be negative.';
    }
  }

  if (values.dueAt) {
    const due = new Date(values.dueAt);
    if (Number.isNaN(due.getTime())) {
      errors.dueAt = 'Choose a valid delivery date.';
    } else if (due < startOfToday()) {
      errors.dueAt = 'Delivery date must be today or in the future.';
    }
  }

  return errors;
}

export default function ProjectGigManagementContainer({ userId }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();

  if (!canManageProjects) {
    return (
      <section
        id="project-workspace"
        className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white/60 p-8 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">Project workspace</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">Workspace access required</h2>
        <p className="mt-3 text-sm text-slate-600">
          {denialReason ??
            'Project workspaces are reserved for agency, operations, company, and administrator memberships. Switch to an eligible role or request an upgrade from your workspace owner.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {PROJECT_MANAGEMENT_ROLE_LABELS.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700"
            >
              {label}
            </span>
          ))}
        </div>
        <a
          href="mailto:operations@gigvora.com?subject=Project%20workspace%20access%20request"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
        >
          Contact operations@gigvora.com
        </a>
      </section>
    );
  }

  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [gigForm, setGigForm] = useState(INITIAL_GIG_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [gigSubmitting, setGigSubmitting] = useState(false);
  const [projectErrors, setProjectErrors] = useState({});
  const [gigErrors, setGigErrors] = useState({});
  const [projectFeedback, setProjectFeedback] = useState(null);
  const [gigFeedback, setGigFeedback] = useState(null);

  const access = data?.access ?? { canManage: false };
  const hasSnapshot = Boolean(data);
  const canManage = hasSnapshot && access.canManage !== false;
  const allowedRoles = useMemo(
    () => access.allowedRoles?.filter(Boolean).map((role) => role.replace(/_/g, ' ')) ?? [],
    [access],
  );
  const accessReason = hasSnapshot && !canManage
    ? access.reason ??
      (access.actorRole
        ? `Gig operations are view-only for the ${access.actorRole.replace(/_/g, ' ')} role.`
        : 'Gig operations are view-only for your current access level.')
    : null;

  const inputClassName = (hasError) =>
    `rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
      hasError ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-slate-200'
    }`;

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const handleGigChange = (event) => {
    const { name, value } = event.target;
    setGigForm((current) => ({ ...current, [name]: value }));
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    const validation = validateProjectForm(projectForm);
    setProjectErrors(validation);
    if (Object.keys(validation).length > 0) {
      setProjectFeedback({ status: 'error', message: 'Fix the highlighted fields before creating the workspace.' });
      return;
    }
    setSubmitting(true);
    setProjectFeedback(null);
    try {
      await actions.createProject({
        title: projectForm.title,
        description: projectForm.description,
        budgetCurrency: projectForm.budgetCurrency,
        budgetAllocated: parseNumber(projectForm.budgetAllocated) ?? 0,
        dueDate: projectForm.dueDate || undefined,
        workspace: { status: 'planning', progressPercent: 5, nextMilestone: 'Kickoff workshop' },
        milestones: [
          {
            title: 'Kickoff workshop',
            dueDate: projectForm.dueDate || new Date(),
            ordinal: 1,
            status: 'planned',
          },
          {
            title: 'Delivery sprint',
            dueDate: projectForm.dueDate || undefined,
            ordinal: 2,
            status: 'planned',
          },
        ],
        collaborators: [],
        integrations: [{ provider: 'notion' }],
      });
      setProjectForm(INITIAL_PROJECT_FORM);
      setProjectErrors({});
      setProjectFeedback({ status: 'success', message: 'Project workspace created with governance defaults.' });
    } catch (submitError) {
      setProjectFeedback({
        status: 'error',
        message: submitError?.message ?? 'Unable to create the project workspace right now.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGigSubmit = async (event) => {
    event.preventDefault();
    const validation = validateGigForm(gigForm);
    setGigErrors(validation);
    if (Object.keys(validation).length > 0) {
      setGigFeedback({ status: 'error', message: 'Review the highlighted gig order details.' });
      return;
    }
    setGigSubmitting(true);
    setGigFeedback(null);
    try {
      await actions.createGigOrder({
        vendorName: gigForm.vendorName,
        serviceName: gigForm.serviceName,
        amount: parseNumber(gigForm.amount) ?? 0,
        currency: gigForm.currency,
        dueAt: gigForm.dueAt || undefined,
        requirements: [{ title: 'Provide baseline materials', dueAt: gigForm.dueAt || undefined }],
      });
      setGigForm(INITIAL_GIG_FORM);
      setGigErrors({});
      setGigFeedback({ status: 'success', message: 'Gig engagement captured with compliance reminders.' });
    } catch (submitError) {
      setGigFeedback({
        status: 'error',
        message: submitError?.message ?? 'Unable to save the gig engagement right now.',
      });
    } finally {
      setGigSubmitting(false);
    }
  };

  const meta = data?.meta ?? {};
  const lastUpdated = meta.lastUpdated ?? null;
  const fromCache = meta.fromCache ?? false;

  const renderProjectForm = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Kick off a new initiative</h2>
        <p className="mt-1 text-sm text-slate-500">
          Launch a project workspace with default milestones, workspace metrics, and collaborator scaffolding.
        </p>
        {projectFeedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              projectFeedback.status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {projectFeedback.message}
          </div>
        ) : null}
        {!canManage ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
            <p className="font-semibold">Project creation is restricted</p>
            <p className="mt-1">{accessReason}</p>
            {allowedRoles.length ? (
              <p className="mt-2 text-xs uppercase tracking-wide">
                Enabled for roles: {allowedRoles.join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleProjectSubmit} noValidate>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={projectForm.title}
              onChange={handleProjectChange}
              className={inputClassName(Boolean(projectErrors.title))}
              placeholder="Community relaunch"
              required
              aria-invalid={projectErrors.title ? 'true' : 'false'}
              aria-describedby={projectErrors.title ? 'project-title-error' : undefined}
              disabled={!canManage || submitting}
            />
            {projectErrors.title ? (
              <span id="project-title-error" className="text-xs text-rose-600">
                {projectErrors.title}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Budget (optional)
            <input
              name="budgetAllocated"
              value={projectForm.budgetAllocated}
              onChange={handleProjectChange}
              className={inputClassName(Boolean(projectErrors.budgetAllocated))}
              placeholder="25000"
              type="number"
              min="0"
              aria-invalid={projectErrors.budgetAllocated ? 'true' : 'false'}
              aria-describedby={projectErrors.budgetAllocated ? 'project-budget-error' : undefined}
              disabled={!canManage || submitting}
            />
            {projectErrors.budgetAllocated ? (
              <span id="project-budget-error" className="text-xs text-rose-600">
                {projectErrors.budgetAllocated}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              name="description"
              value={projectForm.description}
              onChange={handleProjectChange}
              className={`${inputClassName(Boolean(projectErrors.description))} min-h-[120px]`}
              placeholder="Detail the intent, collaborators, and expected outcomes."
              required
              aria-invalid={projectErrors.description ? 'true' : 'false'}
              aria-describedby={projectErrors.description ? 'project-description-error' : undefined}
              disabled={!canManage || submitting}
            />
            {projectErrors.description ? (
              <span id="project-description-error" className="text-xs text-rose-600">
                {projectErrors.description}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Currency
            <select
              name="budgetCurrency"
              value={projectForm.budgetCurrency}
              onChange={handleProjectChange}
              className={inputClassName(false)}
              disabled={!canManage || submitting}
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Target completion
            <input
              type="date"
              name="dueDate"
              value={projectForm.dueDate}
              onChange={handleProjectChange}
              className={inputClassName(Boolean(projectErrors.dueDate))}
              min={new Date().toISOString().split('T')[0]}
              aria-invalid={projectErrors.dueDate ? 'true' : 'false'}
              aria-describedby={projectErrors.dueDate ? 'project-due-error' : undefined}
              disabled={!canManage || submitting}
            />
            {projectErrors.dueDate ? (
              <span id="project-due-error" className="text-xs text-rose-600">
                {projectErrors.dueDate}
              </span>
            ) : null}
          </label>
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/60"
            disabled={submitting || !canManage}
          >
            {submitting ? 'Creating project…' : 'Create project workspace'}
          </button>
        </form>
    </div>
  );

  const renderGigForm = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Track a purchased gig</h2>
        <p className="mt-1 text-sm text-slate-500">Capture vendor engagements, milestone tracking, and revision rounds.</p>
        {gigFeedback ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              gigFeedback.status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {gigFeedback.message}
          </div>
        ) : null}
        {!canManage ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
            <p className="font-semibold">Purchasing is limited</p>
            <p className="mt-1">
              {accessReason ?? 'Only approved operators can create or update gig orders for this workspace.'}
            </p>
          </div>
        ) : null}
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleGigSubmit} noValidate>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Vendor name
            <input
              name="vendorName"
              value={gigForm.vendorName}
              onChange={handleGigChange}
              className={inputClassName(Boolean(gigErrors.vendorName))}
              placeholder="Resume Studio"
              required
              aria-invalid={gigErrors.vendorName ? 'true' : 'false'}
              aria-describedby={gigErrors.vendorName ? 'gig-vendor-error' : undefined}
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.vendorName ? (
              <span id="gig-vendor-error" className="text-xs text-rose-600">
                {gigErrors.vendorName}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Service name
            <input
              name="serviceName"
              value={gigForm.serviceName}
              onChange={handleGigChange}
              className={inputClassName(Boolean(gigErrors.serviceName))}
              placeholder="Executive resume refresh"
              required
              aria-invalid={gigErrors.serviceName ? 'true' : 'false'}
              aria-describedby={gigErrors.serviceName ? 'gig-service-error' : undefined}
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.serviceName ? (
              <span id="gig-service-error" className="text-xs text-rose-600">
                {gigErrors.serviceName}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Budget (optional)
            <input
              name="amount"
              value={gigForm.amount}
              onChange={handleGigChange}
              className={inputClassName(Boolean(gigErrors.amount))}
              placeholder="4800"
              type="number"
              min="0"
              aria-invalid={gigErrors.amount ? 'true' : 'false'}
              aria-describedby={gigErrors.amount ? 'gig-amount-error' : undefined}
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.amount ? (
              <span id="gig-amount-error" className="text-xs text-rose-600">
                {gigErrors.amount}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Currency
            <select
              name="currency"
              value={gigForm.currency}
              onChange={handleGigChange}
              className={inputClassName(false)}
              disabled={!canManage || gigSubmitting}
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Delivery due date
            <input
              type="date"
              name="dueAt"
              value={gigForm.dueAt}
              onChange={handleGigChange}
              className={inputClassName(Boolean(gigErrors.dueAt))}
              min={new Date().toISOString().split('T')[0]}
              aria-invalid={gigErrors.dueAt ? 'true' : 'false'}
              aria-describedby={gigErrors.dueAt ? 'gig-due-error' : undefined}
              disabled={!canManage || gigSubmitting}
            />
            {gigErrors.dueAt ? (
              <span id="gig-due-error" className="text-xs text-rose-600">
                {gigErrors.dueAt}
              </span>
            ) : null}
          </label>
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={gigSubmitting || !canManage}
          >
            {gigSubmitting ? 'Saving gig…' : 'Add gig engagement'}
          </button>
        </form>
    </div>
  );

  return (
    <section id="project-workspace" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Project workspace</p>
        <h1 className="text-2xl font-semibold text-slate-900">Project &amp; gig command centre</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Launch structured initiatives, govern vendor engagements, and keep delivery rituals on track across every client workspace.
        </p>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={reload}
      />

      {loading && !data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {renderProjectForm()}
            {renderGigForm()}
          </div>
          {data ? <ProjectGigManagementSection data={data} /> : null}
        </>
      )}

      {error && !data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700">
          <p className="font-semibold">We couldn&apos;t load your project workspace snapshot.</p>
          <p className="mt-2 text-rose-600/90">
            Check your connection or try again in a moment. If the issue persists, contact operations@gigvora.com with the timestamp above.
          </p>
        </div>
      ) : null}
    </section>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.number.isRequired,
};
