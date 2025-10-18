import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  programId: '',
  title: '',
  organization: '',
  summary: '',
  description: '',
  location: '',
  status: 'draft',
  remoteType: 'remote',
  commitmentHours: '',
  applicationUrl: '',
  applicationDeadline: '',
  spots: '',
  skills: '',
  requirements: '',
  tags: '',
  accessRoles: '',
};

const WIZARD_STEPS = ['details', 'access'];

function WizardStepIndicator({ currentStep }) {
  return (
    <nav className="flex items-center gap-3">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = currentStep === step;
        const isComplete = WIZARD_STEPS.indexOf(currentStep) > index;
        return (
          <div key={step} className="flex items-center gap-2 text-sm font-semibold">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : isComplete
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              {isComplete ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={isActive ? 'text-slate-900' : 'text-slate-500'}>{step}</span>
          </div>
        );
      })}
    </nav>
  );
}

WizardStepIndicator.propTypes = {
  currentStep: PropTypes.oneOf(WIZARD_STEPS).isRequired,
};

function Drawer({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

Drawer.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func.isRequired,
};

export default function VolunteeringRolesPanel({
  programs,
  roles,
  loading,
  filters,
  onChangeFilters,
  onReload,
  onCreate,
  onUpdate,
  onDelete,
  onPublish,
  onSelect,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState('details');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = useMemo(() => ['draft', 'open', 'paused', 'filled', 'archived'], []);
  const remoteOptions = useMemo(() => ['remote', 'hybrid', 'onsite'], []);

  const openWizard = (role = null) => {
    if (role) {
      setForm({
        programId: role.program?.id ?? '',
        title: role.title ?? '',
        organization: role.organization ?? '',
        summary: role.summary ?? '',
        description: role.description ?? '',
        location: role.location ?? '',
        status: role.status ?? 'draft',
        remoteType: role.remoteType ?? 'remote',
        commitmentHours: role.commitmentHours ?? '',
        applicationUrl: role.applicationUrl ?? '',
        applicationDeadline: role.applicationDeadline ? role.applicationDeadline.slice(0, 10) : '',
        spots: role.spots ?? '',
        skills: Array.isArray(role.skills) ? role.skills.join(', ') : '',
        requirements: Array.isArray(role.requirements)
          ? role.requirements.map((item) => item.label).join('\n')
          : '',
        tags: Array.isArray(role.tags) ? role.tags.join(', ') : '',
        accessRoles: Array.isArray(role.accessRoles) ? role.accessRoles.join(', ') : '',
      });
      setEditingId(role.id);
    } else {
      setForm(DEFAULT_FORM);
      setEditingId(null);
    }
    setWizardStep('details');
    setError('');
    setDrawerOpen(true);
  };

  const closeWizard = () => {
    if (submitting) return;
    setDrawerOpen(false);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    onChangeFilters({ ...filters, [name]: value });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleNext = () => {
    setWizardStep('access');
  };

  const handleBack = () => {
    setWizardStep('details');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      ...form,
      programId: form.programId ? Number(form.programId) : undefined,
      commitmentHours: form.commitmentHours === '' ? undefined : Number(form.commitmentHours),
      spots: form.spots === '' ? undefined : Number(form.spots),
      skills: form.skills
        ? form.skills
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      requirements: form.requirements
        ? form.requirements
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean)
            .map((label) => ({ label }))
        : [],
      tags: form.tags
        ? form.tags
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      accessRoles: form.accessRoles
        ? form.accessRoles
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    };
    try {
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      await onReload();
      setSubmitting(false);
      setDrawerOpen(false);
    } catch (err) {
      setSubmitting(false);
      setError(err?.message ?? 'Unable to save role.');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Delete this role?')) {
      return;
    }
    try {
      await onDelete(roleId);
      await onReload();
    } catch (err) {
      setError(err?.message ?? 'Unable to delete role.');
    }
  };

  const handlePublish = async (roleId) => {
    try {
      await onPublish(roleId);
      await onReload();
    } catch (err) {
      setError(err?.message ?? 'Unable to publish role.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Roles</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openWizard(null)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            New
          </button>
          <button
            type="button"
            onClick={onReload}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">all</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Program
          <select
            name="programId"
            value={filters.programId}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">all</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Remote
          <select
            name="remoteType"
            value={filters.remoteType}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">all</option>
            {remoteOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Title or org"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <button
              type="button"
              key={role.id}
              onClick={() => onSelect?.(role)}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{role.title}</p>
                  <p className="text-xs text-slate-500">{role.organization}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                  {role.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {role.remoteType ? <span>{role.remoteType}</span> : null}
                {role.location ? <span>{role.location}</span> : null}
                {role.commitmentHours ? <span>{role.commitmentHours} hrs</span> : null}
                {role.spots ? <span>{role.spots} spots</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                {role.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{role.program?.name ?? 'Unassigned program'}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openWizard(role);
                    }}
                    className="rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePublish(role.id);
                    }}
                    className="rounded-full border border-emerald-200 p-1 text-emerald-600 hover:bg-emerald-50"
                  >
                    <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(role.id);
                    }}
                    className="rounded-full border border-red-200 p-1 text-red-500 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </button>
          ))}
          {!roles.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Add a role to begin scheduling volunteers.
            </div>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <Drawer open={drawerOpen} title={editingId ? 'Edit role' : 'New role'} onClose={closeWizard}>
        <WizardStepIndicator currentStep={wizardStep} />
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {wizardStep === 'details' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Program
                  <select
                    name="programId"
                    value={form.programId}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Unassigned</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
                <input
                  name="title"
                  required
                  value={form.title}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Organisation
                <input
                  name="organization"
                  required
                  value={form.organization}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
                <textarea
                  name="summary"
                  rows="3"
                  value={form.summary}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
                <textarea
                  name="description"
                  rows="6"
                  required
                  value={form.description}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Remote
                  <select
                    name="remoteType"
                    value={form.remoteType}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {remoteOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Hours / week
                  <input
                    name="commitmentHours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.commitmentHours}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Apply URL
                  <input
                    name="applicationUrl"
                    value={form.applicationUrl}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Deadline
                  <input
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Spots
                  <input
                    name="spots"
                    type="number"
                    min="0"
                    value={form.spots}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeWizard}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                >
                  Continue
                </button>
              </div>
            </>
          ) : null}

          {wizardStep === 'access' ? (
            <>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Skills (comma separated)
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleInputChange}
                  placeholder="design, community"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Requirements (one per line)
                <textarea
                  name="requirements"
                  rows="4"
                  value={form.requirements}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tags
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleInputChange}
                  placeholder="health, mentoring"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Access roles
                <input
                  name="accessRoles"
                  value={form.accessRoles}
                  onChange={handleInputChange}
                  placeholder="volunteer, mentor"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeWizard}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving…' : 'Save role'}
                  </button>
                </div>
              </div>
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
            </>
          ) : null}
        </form>
      </Drawer>
    </div>
  );
}

VolunteeringRolesPanel.propTypes = {
  programs: PropTypes.arrayOf(PropTypes.object).isRequired,
  roles: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  filters: PropTypes.shape({
    status: PropTypes.string,
    programId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    remoteType: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  onChangeFilters: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
};
