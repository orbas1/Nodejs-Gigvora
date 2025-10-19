import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useProjectGigManagement from '../../../../hooks/useProjectGigManagement.js';

export const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

export const WORKSPACE_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) => option.value !== 'completed').concat([
  { value: 'completed', label: 'Completed' },
]);

export const RISK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const MILESTONE_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_client', label: 'Waiting on client' },
  { value: 'completed', label: 'Completed' },
];

export const COLLAB_STATUS_OPTIONS = [
  { value: 'invited', label: 'Invited' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const ASSET_PERMISSION_OPTIONS = [
  { value: 'internal', label: 'Workspace only' },
  { value: 'client', label: 'Client accessible' },
  { value: 'public', label: 'Public link' },
];

export const CURRENCY_OPTIONS = ['USD', 'GBP', 'EUR'];

export const CREATE_FORM_DEFAULTS = {
  title: '',
  description: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  startDate: '',
  dueDate: '',
  progressPercent: 10,
  riskLevel: 'low',
  nextMilestone: '',
  nextMilestoneDueAt: '',
  clientName: '',
  workspaceUrl: '',
  coverImageUrl: '',
  tags: '',
};

const EDIT_FORM_DEFAULTS = {
  title: '',
  description: '',
  status: 'planning',
  budgetAllocated: '',
  budgetSpent: '',
  budgetCurrency: 'USD',
  startDate: '',
  dueDate: '',
  workspaceStatus: 'planning',
  progressPercent: '',
  riskLevel: 'low',
  nextMilestone: '',
  nextMilestoneDueAt: '',
  notes: '',
  clientName: '',
  workspaceUrl: '',
  coverImageUrl: '',
  tags: '',
};

const MILESTONE_FORM_DEFAULTS = {
  id: null,
  title: '',
  description: '',
  dueDate: '',
  completedAt: '',
  status: 'planned',
  budget: '',
  ordinal: '',
};

const COLLAB_FORM_DEFAULTS = {
  id: null,
  fullName: '',
  email: '',
  role: 'Collaborator',
  status: 'invited',
  hourlyRate: '',
};

const ASSET_FORM_DEFAULTS = {
  id: null,
  label: '',
  category: 'artifact',
  storageUrl: '',
  thumbnailUrl: '',
  sizeBytes: '',
  permissionLevel: 'internal',
  watermarkEnabled: true,
};

export function formatStatus(value) {
  if (!value) return 'Unknown';
  return value
    .toString()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0%';
  }
  return `${Math.round(Number(value))}%`;
}

export function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

export function formatDateForDisplay(value) {
  if (!value) return 'No date set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No date set';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function formatBytes(value) {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const converted = bytes / 1024 ** index;
  return `${converted.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function parseNumber(value) {
  if (value === '' || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseTagInput(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : null))
      .filter((item) => item && item.length > 0)
      .slice(0, 20);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,#/]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 20);
  }

  return [];
}

function isValidUrl(value) {
  if (!value || typeof value !== 'string') {
    return true;
  }
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.host);
  } catch (error) {
    return false;
  }
}

export function validateCreateForm(form) {
  const errors = {};
  const title = form.title?.trim();
  const description = form.description?.trim();
  if (!title) {
    errors.title = 'Add a project name.';
  }
  if (!description || description.length < 12) {
    errors.description = 'Describe the goals and collaborators.';
  }
  if (form.budgetAllocated !== '') {
    const allocated = parseNumber(form.budgetAllocated);
    if (allocated == null || allocated < 0) {
      errors.budgetAllocated = 'Budget must be a valid positive number.';
    }
  }
  const startDate = form.startDate ? new Date(form.startDate) : null;
  const dueDate = form.dueDate ? new Date(form.dueDate) : null;
  if (startDate && Number.isNaN(startDate.getTime())) {
    errors.startDate = 'Choose a valid start date.';
  }
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    errors.dueDate = 'Choose a valid target date.';
  }
  if (
    startDate &&
    !Number.isNaN(startDate?.getTime()) &&
    dueDate &&
    !Number.isNaN(dueDate?.getTime()) &&
    dueDate.getTime() < startDate.getTime()
  ) {
    errors.dueDate = 'Due date cannot be before the start date.';
  }
  const progress = parseNumber(form.progressPercent);
  if (progress != null && (progress < 0 || progress > 100)) {
    errors.progressPercent = 'Progress must be between 0 and 100.';
  }
  if (form.workspaceUrl && !isValidUrl(form.workspaceUrl)) {
    errors.workspaceUrl = 'Add a valid workspace URL or leave the field empty.';
  }
  if (form.coverImageUrl && !isValidUrl(form.coverImageUrl)) {
    errors.coverImageUrl = 'Provide a valid cover image URL or clear the field.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateEditForm(form) {
  const errors = {};
  const title = form.title?.trim();
  const description = form.description?.trim();
  if (!title) {
    errors.title = 'Project title is required.';
  }
  if (!description || description.length < 12) {
    errors.description = 'Describe the project in more detail.';
  }
  if (!form.status) {
    errors.status = 'Select a project status.';
  }
  if (!form.workspaceStatus) {
    errors.workspaceStatus = 'Select a workspace status.';
  }
  const allocated = parseNumber(form.budgetAllocated);
  if (form.budgetAllocated !== '' && (allocated == null || allocated < 0)) {
    errors.budgetAllocated = 'Provide a valid allocated budget.';
  }
  const spent = parseNumber(form.budgetSpent);
  if (form.budgetSpent !== '' && (spent == null || spent < 0)) {
    errors.budgetSpent = 'Provide a valid spent budget.';
  }
  if (allocated != null && spent != null && spent > allocated) {
    errors.budgetSpent = 'Spent cannot exceed allocated.';
  }
  if (form.workspaceUrl && !isValidUrl(form.workspaceUrl)) {
    errors.workspaceUrl = 'Workspace URL must be a valid link.';
  }
  if (form.coverImageUrl && !isValidUrl(form.coverImageUrl)) {
    errors.coverImageUrl = 'Cover image URL must be a valid link.';
  }
  const startDate = form.startDate ? new Date(form.startDate) : null;
  const dueDate = form.dueDate ? new Date(form.dueDate) : null;
  if (startDate && Number.isNaN(startDate.getTime())) {
    errors.startDate = 'Choose a valid start date.';
  }
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    errors.dueDate = 'Choose a valid target date.';
  }
  if (
    startDate &&
    !Number.isNaN(startDate?.getTime()) &&
    dueDate &&
    !Number.isNaN(dueDate?.getTime()) &&
    dueDate.getTime() < startDate.getTime()
  ) {
    errors.dueDate = 'Due date cannot be before the start date.';
  }
  const progress = parseNumber(form.progressPercent);
  if (progress != null && (progress < 0 || progress > 100)) {
    errors.progressPercent = 'Progress must be between 0 and 100.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateMilestoneForm(form) {
  const errors = {};
  const title = form.title?.trim();
  if (!title) {
    errors.title = 'Milestone title is required.';
  }
  if (form.ordinal !== '') {
    const ordinal = parseNumber(form.ordinal);
    if (ordinal == null || ordinal < 0) {
      errors.ordinal = 'Order must be zero or a positive number.';
    }
  }
  if (form.budget !== '') {
    const budget = parseNumber(form.budget);
    if (budget == null || budget < 0) {
      errors.budget = 'Provide a valid budget.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateCollaboratorForm(form) {
  const errors = {};
  const fullName = form.fullName?.trim();
  if (!fullName) {
    errors.fullName = 'Add a collaborator name.';
  }
  if (!form.role?.trim()) {
    errors.role = 'Add a collaborator role.';
  }
  if (form.hourlyRate !== '') {
    const rate = parseNumber(form.hourlyRate);
    if (rate == null || rate <= 0) {
      errors.hourlyRate = 'Provide a positive hourly rate or leave blank.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateAssetForm(form) {
  const errors = {};
  if (!form.label?.trim()) {
    errors.label = 'Asset label is required.';
  }
  if (!form.category?.trim()) {
    errors.category = 'Choose a category.';
  }
  if (!form.storageUrl?.trim()) {
    errors.storageUrl = 'Provide a storage URL.';
  }
  if (form.sizeBytes !== '') {
    const size = parseNumber(form.sizeBytes);
    if (size == null || size < 0) {
      errors.sizeBytes = 'Size must be a positive number or blank.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

function buildEditForm(project) {
  return {
    title: project.title ?? '',
    description: project.description ?? '',
    status: project.status ?? 'planning',
    budgetAllocated: project.budget?.allocated ?? project.budgetAllocated ?? '',
    budgetSpent: project.budget?.spent ?? project.budgetSpent ?? '',
    budgetCurrency: project.budget?.currency ?? project.budgetCurrency ?? 'USD',
    startDate: formatDateForInput(project.startDate),
    dueDate: formatDateForInput(project.dueDate),
    workspaceStatus: project.workspace?.status ?? project.status ?? 'planning',
    progressPercent:
      project.workspace?.progressPercent != null
        ? Number(project.workspace.progressPercent).toFixed(0)
        : project.status === 'completed'
        ? 100
        : '',
    riskLevel: project.workspace?.riskLevel ?? 'low',
    nextMilestone: project.workspace?.nextMilestone ?? '',
    nextMilestoneDueAt: formatDateForInput(project.workspace?.nextMilestoneDueAt ?? project.dueDate),
    notes: project.workspace?.notes ?? '',
    clientName: project.metadata?.clientName ?? project.lifecycle?.clientName ?? '',
    workspaceUrl: project.metadata?.workspaceUrl ?? project.lifecycle?.workspaceUrl ?? '',
    coverImageUrl: project.metadata?.coverImageUrl ?? project.lifecycle?.coverImageUrl ?? '',
    tags: parseTagInput(project.metadata?.tags ?? project.lifecycle?.tags)?.join(', ') ?? '',
  };
}

function buildMilestoneForm(milestone) {
  return {
    id: milestone?.id ?? null,
    title: milestone?.title ?? '',
    description: milestone?.description ?? '',
    dueDate: formatDateForInput(milestone?.dueDate),
    completedAt: formatDateForInput(milestone?.completedAt),
    status: milestone?.status ?? 'planned',
    budget:
      milestone?.budget != null && !Number.isNaN(Number(milestone.budget))
        ? Number(milestone.budget).toFixed(0)
        : '',
    ordinal:
      milestone?.ordinal != null && !Number.isNaN(Number(milestone.ordinal))
        ? Number(milestone.ordinal).toFixed(0)
        : '',
  };
}

function buildCollaboratorForm(collaborator) {
  return {
    id: collaborator?.id ?? null,
    fullName: collaborator?.fullName ?? '',
    email: collaborator?.email ?? '',
    role: collaborator?.role ?? 'Collaborator',
    status: collaborator?.status ?? 'invited',
    hourlyRate:
      collaborator?.hourlyRate != null && !Number.isNaN(Number(collaborator.hourlyRate))
        ? Number(collaborator.hourlyRate).toFixed(0)
        : '',
  };
}

function buildAssetForm(asset) {
  return {
    id: asset?.id ?? null,
    label: asset?.label ?? '',
    category: asset?.category ?? 'artifact',
    storageUrl: asset?.storageUrl ?? '',
    thumbnailUrl: asset?.thumbnailUrl ?? '',
    sizeBytes:
      asset?.sizeBytes != null && !Number.isNaN(Number(asset.sizeBytes))
        ? Number(asset.sizeBytes).toFixed(0)
        : '',
    permissionLevel: asset?.permissionLevel ?? 'internal',
    watermarkEnabled: asset?.watermarkEnabled ?? true,
  };
}

function Badge({ tone = 'default', children }) {
  const toneClasses = {
    default: 'border-slate-200 bg-slate-50 text-slate-600',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(['default', 'info', 'warning', 'danger', 'success']),
  children: PropTypes.node.isRequired,
};

function ProjectCard({ project, canManage, onEdit, onComplete, busy }) {
  const workspaceStatus = project.workspace?.status ?? project.status ?? 'planning';
  const risk = project.workspace?.riskLevel ?? 'low';
  const nextMilestone = project.workspace?.nextMilestone ?? 'No milestone set';
  const nextMilestoneDueAt = project.workspace?.nextMilestoneDueAt ?? project.dueDate;
  const budget = project.budget ?? {
    allocated: project.budgetAllocated,
    spent: project.budgetSpent,
    currency: project.budgetCurrency,
  };
  const riskTone = risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'info';
  const progress = project.workspace?.progressPercent ?? (project.status === 'completed' ? 100 : 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{project.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge tone="info">{formatStatus(workspaceStatus)}</Badge>
            <Badge tone={riskTone}>{`Risk: ${formatStatus(risk)}`}</Badge>
            <Badge tone="default">{`Progress ${formatPercent(progress)}`}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next milestone</p>
          <p className="text-sm font-semibold text-slate-900">{nextMilestone}</p>
          <p className="text-xs text-slate-500">{formatDateForDisplay(nextMilestoneDueAt)}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Budget allocated</dt>
          <dd className="mt-1 font-semibold text-slate-900">{formatCurrency(budget.allocated, budget.currency)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Budget spent</dt>
          <dd className="mt-1 font-semibold text-slate-900">{formatCurrency(budget.spent, budget.currency)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Remaining</dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatCurrency((budget.allocated ?? 0) - (budget.spent ?? 0), budget.currency)}
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onEdit(project)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          disabled={!canManage}
        >
          <PencilSquareIcon className="h-4 w-4" /> Manage workspace
        </button>
        <button
          type="button"
          onClick={() => onComplete(project)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!canManage || busy}
        >
          <CheckCircleIcon className="h-4 w-4" /> {busy ? 'Completing…' : 'Mark complete'}
        </button>
      </div>
    </div>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};

ProjectCard.defaultProps = {
  busy: false,
};

function ClosedProjectCard({ project, onRestore, canManage, busy }) {
  const completedAt = project.archivedAt ?? project.updatedAt;
  const budget = project.budget ?? {
    allocated: project.budgetAllocated,
    currency: project.budgetCurrency ?? 'USD',
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{project.title}</p>
        <p className="text-xs text-slate-500">Closed {formatDateForDisplay(completedAt)}</p>
        <p className="mt-1 text-xs text-slate-500">
          Budget {formatCurrency(budget.allocated, budget.currency)} · {project.collaborators?.length ?? 0} collaborators
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRestore(project)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={!canManage || busy}
      >
        <ArrowPathIcon className="h-4 w-4" /> {busy ? 'Restoring…' : 'Reopen project'}
      </button>
    </div>
  );
}

ClosedProjectCard.propTypes = {
  project: PropTypes.object.isRequired,
  onRestore: PropTypes.func.isRequired,
  canManage: PropTypes.bool.isRequired,
  busy: PropTypes.bool,
};

ClosedProjectCard.defaultProps = {
  busy: false,
};

function InputLabel({ label, htmlFor, children, hint }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700" htmlFor={htmlFor}>
      <span className="font-medium text-slate-900">{label}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      {children}
    </label>
  );
}

InputLabel.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

InputLabel.defaultProps = {
  htmlFor: undefined,
  hint: null,
};

const inputClassName = (hasError) =>
  `rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
    hasError ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-slate-200'
  }`;

function TabButton({ id, activeTab, onSelect, children }) {
  const isActive = id === activeTab;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

TabButton.propTypes = {
  id: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

function BoardLane({ lane }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{formatStatus(lane.status)}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{lane.projects.length} projects</p>
        </div>
        <Badge tone="default">
          {lane.projects.length
            ? `${Math.round(
                lane.projects.reduce((acc, project) => acc + (project.progress ?? 0), 0) /
                  Math.max(lane.projects.length, 1),
              )}% avg`
            : 'No progress'}
        </Badge>
      </div>
      <div className="mt-4 space-y-3">
        {lane.projects.length === 0 ? (
          <p className="text-sm text-slate-500">No projects currently in this lane.</p>
        ) : (
          lane.projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700"
            >
              <p className="font-semibold text-slate-900">{project.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                Progress {formatPercent(project.progress)} · Risk {formatStatus(project.riskLevel)} · Next due{' '}
                {formatDateForDisplay(project.dueAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

BoardLane.propTypes = {
  lane: PropTypes.shape({
    status: PropTypes.string.isRequired,
    projects: PropTypes.array.isRequired,
  }).isRequired,
};

function StoryHighlight({ title, bullet }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{bullet}</p>
    </div>
  );
}

StoryHighlight.propTypes = {
  title: PropTypes.string.isRequired,
  bullet: PropTypes.string.isRequired,
};

export function ProjectDetailModal({
  project,
  open,
  onClose,
  canManage,
  statusOptions,
  workspaceStatusOptions,
  riskOptions,
  currencyOptions,
  actions,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({ ...EDIT_FORM_DEFAULTS });
  const [editErrors, setEditErrors] = useState({});
  const [editFeedback, setEditFeedback] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState(MILESTONE_FORM_DEFAULTS);
  const [milestoneErrors, setMilestoneErrors] = useState({});
  const [milestoneFeedback, setMilestoneFeedback] = useState(null);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
  const [milestoneBusyId, setMilestoneBusyId] = useState(null);

  const [collaboratorForm, setCollaboratorForm] = useState(COLLAB_FORM_DEFAULTS);
  const [collaboratorErrors, setCollaboratorErrors] = useState({});
  const [collaboratorFeedback, setCollaboratorFeedback] = useState(null);
  const [collaboratorSubmitting, setCollaboratorSubmitting] = useState(false);
  const [collaboratorBusyId, setCollaboratorBusyId] = useState(null);

  const [assetForm, setAssetForm] = useState(ASSET_FORM_DEFAULTS);
  const [assetErrors, setAssetErrors] = useState({});
  const [assetFeedback, setAssetFeedback] = useState(null);
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetBusyId, setAssetBusyId] = useState(null);

  useEffect(() => {
    if (project) {
      setEditForm(buildEditForm(project));
      setEditErrors({});
      setEditFeedback(null);
      setActiveTab('overview');
      setMilestoneForm(MILESTONE_FORM_DEFAULTS);
      setMilestoneErrors({});
      setMilestoneFeedback(null);
      setCollaboratorForm(COLLAB_FORM_DEFAULTS);
      setCollaboratorErrors({});
      setCollaboratorFeedback(null);
      setAssetForm(ASSET_FORM_DEFAULTS);
      setAssetErrors({});
      setAssetFeedback(null);
    }
  }, [project]);

  if (!project) {
    return null;
  }

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleGeneralSubmit = async (event) => {
    event.preventDefault();
    const { valid, errors } = validateEditForm(editForm);
    setEditErrors(errors);
    if (!valid) {
      setEditFeedback({ status: 'error', message: 'Fix the highlighted fields to save the project.' });
      return;
    }
    setEditSubmitting(true);
    setEditFeedback(null);
    try {
      const metadata = { ...(project.metadata ?? {}) };
      const trimmedClient = editForm.clientName?.trim() ?? '';
      if (trimmedClient) {
        metadata.clientName = trimmedClient;
      } else {
        delete metadata.clientName;
      }
      const trimmedWorkspaceUrl = editForm.workspaceUrl?.trim() ?? '';
      if (trimmedWorkspaceUrl) {
        metadata.workspaceUrl = trimmedWorkspaceUrl;
      } else {
        delete metadata.workspaceUrl;
      }
      const trimmedCoverUrl = editForm.coverImageUrl?.trim() ?? '';
      if (trimmedCoverUrl) {
        metadata.coverImageUrl = trimmedCoverUrl;
      } else {
        delete metadata.coverImageUrl;
      }
      const tags = parseTagInput(editForm.tags);
      if (tags.length) {
        metadata.tags = tags;
      } else {
        delete metadata.tags;
      }

      await actions.updateProject(project.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        status: editForm.status,
        budgetCurrency: editForm.budgetCurrency,
        budgetAllocated: parseNumber(editForm.budgetAllocated) ?? undefined,
        budgetSpent: parseNumber(editForm.budgetSpent) ?? undefined,
        startDate: editForm.startDate || null,
        dueDate: editForm.dueDate || null,
        workspace: {
          status: editForm.workspaceStatus,
          progressPercent: parseNumber(editForm.progressPercent) ?? undefined,
          riskLevel: editForm.riskLevel,
          nextMilestone: editForm.nextMilestone?.trim() || null,
          nextMilestoneDueAt: editForm.nextMilestoneDueAt || null,
          notes: editForm.notes?.trim() || null,
        },
        metadata,
      });
      setEditFeedback({ status: 'success', message: 'Project workspace updated.' });
    } catch (error) {
      setEditFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to update the project at this time.',
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleMilestoneChange = (event) => {
    const { name, value } = event.target;
    setMilestoneForm((current) => ({ ...current, [name]: value }));
  };

  const resetMilestoneForm = () => {
    setMilestoneForm(MILESTONE_FORM_DEFAULTS);
    setMilestoneErrors({});
    setMilestoneFeedback(null);
  };

  const handleMilestoneSubmit = async (event) => {
    event.preventDefault();
    const { valid, errors } = validateMilestoneForm(milestoneForm);
    setMilestoneErrors(errors);
    if (!valid) {
      setMilestoneFeedback({ status: 'error', message: 'Review the highlighted milestone fields.' });
      return;
    }
    setMilestoneSubmitting(true);
    setMilestoneFeedback(null);
    try {
      const payload = {
        title: milestoneForm.title.trim(),
        description: milestoneForm.description?.trim() || null,
        dueDate: milestoneForm.dueDate || null,
        completedAt: milestoneForm.completedAt || null,
        status: milestoneForm.status,
        budget: parseNumber(milestoneForm.budget) ?? undefined,
        ordinal: parseNumber(milestoneForm.ordinal) ?? undefined,
      };
      if (milestoneForm.id) {
        await actions.updateMilestone(project.id, milestoneForm.id, payload);
        setMilestoneFeedback({ status: 'success', message: 'Milestone updated.' });
      } else {
        await actions.createMilestone(project.id, payload);
        setMilestoneFeedback({ status: 'success', message: 'Milestone added to the workspace.' });
      }
      resetMilestoneForm();
    } catch (error) {
      setMilestoneFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to save the milestone right now.',
      });
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const handleMilestoneEdit = (milestone) => {
    setMilestoneForm(buildMilestoneForm(milestone));
    setMilestoneErrors({});
    setMilestoneFeedback(null);
    setActiveTab('milestones');
  };

  const handleMilestoneDelete = async (milestone) => {
    setMilestoneBusyId(milestone.id);
    try {
      await actions.deleteMilestone(project.id, milestone.id);
    } catch (error) {
      setMilestoneFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to delete the milestone right now.',
      });
    } finally {
      setMilestoneBusyId(null);
    }
  };

  const handleCollaboratorChange = (event) => {
    const { name, value } = event.target;
    setCollaboratorForm((current) => ({ ...current, [name]: value }));
  };

  const resetCollaboratorForm = () => {
    setCollaboratorForm(COLLAB_FORM_DEFAULTS);
    setCollaboratorErrors({});
    setCollaboratorFeedback(null);
  };

  const handleCollaboratorSubmit = async (event) => {
    event.preventDefault();
    const { valid, errors } = validateCollaboratorForm(collaboratorForm);
    setCollaboratorErrors(errors);
    if (!valid) {
      setCollaboratorFeedback({ status: 'error', message: 'Review collaborator details before saving.' });
      return;
    }
    setCollaboratorSubmitting(true);
    setCollaboratorFeedback(null);
    try {
      const payload = {
        fullName: collaboratorForm.fullName.trim(),
        email: collaboratorForm.email?.trim() || null,
        role: collaboratorForm.role.trim(),
        status: collaboratorForm.status,
        hourlyRate: parseNumber(collaboratorForm.hourlyRate) ?? undefined,
      };
      if (collaboratorForm.id) {
        await actions.updateCollaborator(project.id, collaboratorForm.id, payload);
        setCollaboratorFeedback({ status: 'success', message: 'Collaborator updated.' });
      } else {
        await actions.createCollaborator(project.id, payload);
        setCollaboratorFeedback({ status: 'success', message: 'Collaborator added to the workspace.' });
      }
      resetCollaboratorForm();
    } catch (error) {
      setCollaboratorFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to save the collaborator right now.',
      });
    } finally {
      setCollaboratorSubmitting(false);
    }
  };

  const handleCollaboratorEdit = (collaborator) => {
    setCollaboratorForm(buildCollaboratorForm(collaborator));
    setCollaboratorErrors({});
    setCollaboratorFeedback(null);
    setActiveTab('collaborators');
  };

  const handleCollaboratorDelete = async (collaborator) => {
    setCollaboratorBusyId(collaborator.id);
    try {
      await actions.deleteCollaborator(project.id, collaborator.id);
    } catch (error) {
      setCollaboratorFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to remove the collaborator right now.',
      });
    } finally {
      setCollaboratorBusyId(null);
    }
  };

  const handleAssetChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAssetForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetAssetForm = () => {
    setAssetForm(ASSET_FORM_DEFAULTS);
    setAssetErrors({});
    setAssetFeedback(null);
  };

  const handleAssetSubmit = async (event) => {
    event.preventDefault();
    const { valid, errors } = validateAssetForm(assetForm);
    setAssetErrors(errors);
    if (!valid) {
      setAssetFeedback({ status: 'error', message: 'Review asset fields before saving.' });
      return;
    }
    setAssetSubmitting(true);
    setAssetFeedback(null);
    try {
      const payload = {
        label: assetForm.label.trim(),
        category: assetForm.category.trim(),
        storageUrl: assetForm.storageUrl.trim(),
        thumbnailUrl: assetForm.thumbnailUrl?.trim() || null,
        sizeBytes: parseNumber(assetForm.sizeBytes) ?? undefined,
        permissionLevel: assetForm.permissionLevel,
        watermarkEnabled: Boolean(assetForm.watermarkEnabled),
      };
      if (assetForm.id) {
        await actions.updateAsset(project.id, assetForm.id, payload);
        setAssetFeedback({ status: 'success', message: 'Asset updated.' });
      } else {
        await actions.addAsset(project.id, payload);
        setAssetFeedback({ status: 'success', message: 'Asset added to the workspace.' });
      }
      resetAssetForm();
    } catch (error) {
      setAssetFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to save the asset right now.',
      });
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleAssetEdit = (asset) => {
    setAssetForm(buildAssetForm(asset));
    setAssetErrors({});
    setAssetFeedback(null);
    setActiveTab('assets');
  };

  const handleAssetDelete = async (asset) => {
    setAssetBusyId(asset.id);
    try {
      await actions.deleteAsset(project.id, asset.id);
    } catch (error) {
      setAssetFeedback({
        status: 'error',
        message: error?.message ?? 'Unable to delete the asset right now.',
      });
    } finally {
      setAssetBusyId(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'collaborators', label: 'Collaborators' },
    { id: 'assets', label: 'Assets' },
  ];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{project.title}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge tone="info">{formatStatus(project.workspace?.status ?? project.status)}</Badge>
                      <Badge tone="default">{formatStatus(project.workspace?.riskLevel ?? 'low')} risk</Badge>
                      <Badge tone="default">Budget {formatCurrency(project.budget?.allocated, project.budget?.currency)}</Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="self-end rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <TabButton key={tab.id} id={tab.id} activeTab={activeTab} onSelect={setActiveTab}>
                      {tab.label}
                    </TabButton>
                  ))}
                </div>

                {activeTab === 'overview' ? (
                  <div>
                    {editFeedback ? (
                      <div
                        className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                          editFeedback.status === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {editFeedback.message}
                      </div>
                    ) : null}
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleGeneralSubmit} noValidate>
                      <InputLabel label="Project title" htmlFor="edit-title">
                        <input
                          id="edit-title"
                          name="title"
                          value={editForm.title}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.title))}
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Status" htmlFor="edit-status">
                        <select
                          id="edit-status"
                          name="status"
                          value={editForm.status}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.status))}
                          disabled={!canManage}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </InputLabel>
                      <InputLabel label="Workspace status" htmlFor="edit-workspace-status">
                        <select
                          id="edit-workspace-status"
                          name="workspaceStatus"
                          value={editForm.workspaceStatus}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.workspaceStatus))}
                          disabled={!canManage}
                        >
                          {workspaceStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </InputLabel>
                      <InputLabel label="Allocated budget" htmlFor="edit-budget">
                        <input
                          id="edit-budget"
                          name="budgetAllocated"
                          value={editForm.budgetAllocated}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.budgetAllocated))}
                          type="number"
                          min="0"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Budget spent" htmlFor="edit-spent">
                        <input
                          id="edit-spent"
                          name="budgetSpent"
                          value={editForm.budgetSpent}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.budgetSpent))}
                          type="number"
                          min="0"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Currency" htmlFor="edit-currency">
                        <select
                          id="edit-currency"
                          name="budgetCurrency"
                          value={editForm.budgetCurrency}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          disabled={!canManage}
                        >
                          {currencyOptions.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </InputLabel>
                      <InputLabel label="Progress (%)" htmlFor="edit-progress">
                        <input
                          id="edit-progress"
                          name="progressPercent"
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.progressPercent}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.progressPercent))}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Risk level" htmlFor="edit-risk">
                        <select
                          id="edit-risk"
                          name="riskLevel"
                          value={editForm.riskLevel}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          disabled={!canManage}
                        >
                          {riskOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </InputLabel>
                      <InputLabel label="Start date" htmlFor="edit-start">
                        <input
                          id="edit-start"
                          type="date"
                          name="startDate"
                          value={editForm.startDate}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.startDate))}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Due date" htmlFor="edit-due">
                        <input
                          id="edit-due"
                          type="date"
                          name="dueDate"
                          value={editForm.dueDate}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.dueDate))}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Next milestone" htmlFor="edit-milestone">
                        <input
                          id="edit-milestone"
                          name="nextMilestone"
                          value={editForm.nextMilestone}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Milestone due" htmlFor="edit-milestone-due">
                        <input
                          id="edit-milestone-due"
                          type="date"
                          name="nextMilestoneDueAt"
                          value={editForm.nextMilestoneDueAt}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Client / stakeholder" htmlFor="edit-client">
                        <input
                          id="edit-client"
                          name="clientName"
                          value={editForm.clientName}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          placeholder="Northwind Bank transformation"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Workspace URL" htmlFor="edit-workspace-url" hint="Link to the shared project hub">
                        <input
                          id="edit-workspace-url"
                          name="workspaceUrl"
                          value={editForm.workspaceUrl}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.workspaceUrl))}
                          placeholder="https://workspace.gigvora.com/projects/..."
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Cover image" htmlFor="edit-cover-image" hint="Hero or banner image URL">
                        <input
                          id="edit-cover-image"
                          name="coverImageUrl"
                          value={editForm.coverImageUrl}
                          onChange={handleGeneralChange}
                          className={inputClassName(Boolean(editErrors.coverImageUrl))}
                          placeholder="https://cdn.example.com/project-cover.jpg"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Tags" htmlFor="edit-tags" hint="Comma-separated labels e.g. fintech, discovery">
                        <input
                          id="edit-tags"
                          name="tags"
                          value={editForm.tags}
                          onChange={handleGeneralChange}
                          className={inputClassName(false)}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Workspace notes" htmlFor="edit-notes">
                        <textarea
                          id="edit-notes"
                          name="notes"
                          value={editForm.notes}
                          onChange={handleGeneralChange}
                          className={`${inputClassName(false)} min-h-[100px] md:col-span-2`}
                          placeholder="Share context or delivery nuances."
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Project description" htmlFor="edit-description">
                        <textarea
                          id="edit-description"
                          name="description"
                          value={editForm.description}
                          onChange={handleGeneralChange}
                          className={`${inputClassName(Boolean(editErrors.description))} min-h-[120px] md:col-span-2`}
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                          disabled={editSubmitting || !canManage}
                        >
                          {editSubmitting ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {activeTab === 'milestones' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Milestones</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Track delivery phases and keep collaborator expectations aligned.
                      </p>
                      {milestoneFeedback ? (
                        <div
                          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                            milestoneFeedback.status === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {milestoneFeedback.message}
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {project.milestones?.length ? (
                        project.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{milestone.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Due {formatDateForDisplay(milestone.dueDate)} · Status {formatStatus(milestone.status)} · Budget{' '}
                                {formatCurrency(milestone.budget, project.budget?.currency ?? 'USD')}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleMilestoneEdit(milestone)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <PencilSquareIcon className="h-4 w-4" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  actions.updateMilestone(project.id, milestone.id, {
                                    status: milestone.status === 'completed' ? 'in_progress' : 'completed',
                                    completedAt:
                                      milestone.status === 'completed' ? null : new Date().toISOString().slice(0, 10),
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                                disabled={milestoneBusyId === milestone.id || !canManage}
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                {milestone.status === 'completed' ? 'Reopen' : 'Complete'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMilestoneDelete(milestone)}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                disabled={milestoneBusyId === milestone.id || !canManage}
                              >
                                <TrashIcon className="h-4 w-4" /> Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                          No milestones yet—capture a few to keep everyone aligned.
                        </p>
                      )}
                    </div>
                    <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4" onSubmit={handleMilestoneSubmit}>
                      <p className="text-sm font-semibold text-slate-900">
                        {milestoneForm.id ? 'Update milestone' : 'Add milestone'}
                      </p>
                      <InputLabel label="Title" htmlFor="milestone-title">
                        <input
                          id="milestone-title"
                          name="title"
                          value={milestoneForm.title}
                          onChange={handleMilestoneChange}
                          className={inputClassName(Boolean(milestoneErrors.title))}
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Description" htmlFor="milestone-description">
                        <textarea
                          id="milestone-description"
                          name="description"
                          value={milestoneForm.description}
                          onChange={handleMilestoneChange}
                          className={`${inputClassName(false)} min-h-[80px]`}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InputLabel label="Due date" htmlFor="milestone-due">
                          <input
                            id="milestone-due"
                            type="date"
                            name="dueDate"
                            value={milestoneForm.dueDate}
                            onChange={handleMilestoneChange}
                            className={inputClassName(false)}
                            disabled={!canManage}
                          />
                        </InputLabel>
                        <InputLabel label="Completed at" htmlFor="milestone-completed">
                          <input
                            id="milestone-completed"
                            type="date"
                            name="completedAt"
                            value={milestoneForm.completedAt}
                            onChange={handleMilestoneChange}
                            className={inputClassName(false)}
                            disabled={!canManage}
                          />
                        </InputLabel>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <InputLabel label="Status" htmlFor="milestone-status">
                          <select
                            id="milestone-status"
                            name="status"
                            value={milestoneForm.status}
                            onChange={handleMilestoneChange}
                            className={inputClassName(false)}
                            disabled={!canManage}
                          >
                            {MILESTONE_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </InputLabel>
                        <InputLabel label="Budget" htmlFor="milestone-budget">
                          <input
                            id="milestone-budget"
                            name="budget"
                            value={milestoneForm.budget}
                            onChange={handleMilestoneChange}
                            className={inputClassName(Boolean(milestoneErrors.budget))}
                            type="number"
                            min="0"
                            disabled={!canManage}
                          />
                        </InputLabel>
                        <InputLabel label="Order" htmlFor="milestone-ordinal">
                          <input
                            id="milestone-ordinal"
                            name="ordinal"
                            value={milestoneForm.ordinal}
                            onChange={handleMilestoneChange}
                            className={inputClassName(Boolean(milestoneErrors.ordinal))}
                            type="number"
                            min="0"
                            disabled={!canManage}
                          />
                        </InputLabel>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                          disabled={milestoneSubmitting || !canManage}
                        >
                          {milestoneSubmitting ? 'Saving…' : milestoneForm.id ? 'Update milestone' : 'Add milestone'}
                        </button>
                        {milestoneForm.id ? (
                          <button
                            type="button"
                            onClick={resetMilestoneForm}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                ) : null}

                {activeTab === 'collaborators' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Collaborators</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Invite partners and assign roles across the project workspace.
                      </p>
                      {collaboratorFeedback ? (
                        <div
                          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                            collaboratorFeedback.status === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {collaboratorFeedback.message}
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {project.collaborators?.length ? (
                        project.collaborators.map((collaborator) => (
                          <div
                            key={collaborator.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{collaborator.fullName}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {collaborator.role} · Status {formatStatus(collaborator.status)} · Rate{' '}
                                {collaborator.hourlyRate ? `${formatCurrency(collaborator.hourlyRate, project.budget?.currency ?? 'USD')}/hr` : 'N/A'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleCollaboratorEdit(collaborator)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <PencilSquareIcon className="h-4 w-4" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCollaboratorDelete(collaborator)}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                disabled={collaboratorBusyId === collaborator.id || !canManage}
                              >
                                <TrashIcon className="h-4 w-4" /> Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                          No collaborators yet—invite teammates to help with delivery.
                        </p>
                      )}
                    </div>
                    <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4" onSubmit={handleCollaboratorSubmit}>
                      <p className="text-sm font-semibold text-slate-900">
                        {collaboratorForm.id ? 'Update collaborator' : 'Add collaborator'}
                      </p>
                      <InputLabel label="Full name" htmlFor="collab-name">
                        <input
                          id="collab-name"
                          name="fullName"
                          value={collaboratorForm.fullName}
                          onChange={handleCollaboratorChange}
                          className={inputClassName(Boolean(collaboratorErrors.fullName))}
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Email" htmlFor="collab-email">
                        <input
                          id="collab-email"
                          name="email"
                          value={collaboratorForm.email}
                          onChange={handleCollaboratorChange}
                          className={inputClassName(false)}
                          type="email"
                          placeholder="name@company.com"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <InputLabel label="Role" htmlFor="collab-role">
                          <input
                            id="collab-role"
                            name="role"
                            value={collaboratorForm.role}
                            onChange={handleCollaboratorChange}
                            className={inputClassName(Boolean(collaboratorErrors.role))}
                            disabled={!canManage}
                          />
                        </InputLabel>
                        <InputLabel label="Status" htmlFor="collab-status">
                          <select
                            id="collab-status"
                            name="status"
                            value={collaboratorForm.status}
                            onChange={handleCollaboratorChange}
                            className={inputClassName(false)}
                            disabled={!canManage}
                          >
                            {COLLAB_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </InputLabel>
                        <InputLabel label="Hourly rate" htmlFor="collab-rate" hint="Leave blank for fixed-fee">
                          <input
                            id="collab-rate"
                            name="hourlyRate"
                            value={collaboratorForm.hourlyRate}
                            onChange={handleCollaboratorChange}
                            className={inputClassName(Boolean(collaboratorErrors.hourlyRate))}
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!canManage}
                          />
                        </InputLabel>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                          disabled={collaboratorSubmitting || !canManage}
                        >
                          {collaboratorSubmitting
                            ? 'Saving…'
                            : collaboratorForm.id
                            ? 'Update collaborator'
                            : 'Add collaborator'}
                        </button>
                        {collaboratorForm.id ? (
                          <button
                            type="button"
                            onClick={resetCollaboratorForm}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                ) : null}

                {activeTab === 'assets' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Project assets</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Store deliverables, contracts, and working files with the right permissions.
                      </p>
                      {assetFeedback ? (
                        <div
                          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                            assetFeedback.status === 'success'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {assetFeedback.message}
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {project.assets?.length ? (
                        project.assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{asset.label}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {asset.category} · {formatBytes(asset.sizeBytes)} · {formatStatus(asset.permissionLevel)} access
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <a
                                href={asset.storageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" /> Open
                              </a>
                              <button
                                type="button"
                                onClick={() => handleAssetEdit(asset)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <PencilSquareIcon className="h-4 w-4" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAssetDelete(asset)}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                disabled={assetBusyId === asset.id || !canManage}
                              >
                                <TrashIcon className="h-4 w-4" /> Remove
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                          No project assets yet—upload handoffs, briefs, or brand collateral.
                        </p>
                      )}
                    </div>
                    <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4" onSubmit={handleAssetSubmit}>
                      <p className="text-sm font-semibold text-slate-900">
                        {assetForm.id ? 'Update asset' : 'Add asset'}
                      </p>
                      <InputLabel label="Label" htmlFor="asset-label">
                        <input
                          id="asset-label"
                          name="label"
                          value={assetForm.label}
                          onChange={handleAssetChange}
                          className={inputClassName(Boolean(assetErrors.label))}
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Category" htmlFor="asset-category">
                        <input
                          id="asset-category"
                          name="category"
                          value={assetForm.category}
                          onChange={handleAssetChange}
                          className={inputClassName(Boolean(assetErrors.category))}
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Storage URL" htmlFor="asset-url">
                        <input
                          id="asset-url"
                          name="storageUrl"
                          value={assetForm.storageUrl}
                          onChange={handleAssetChange}
                          className={inputClassName(Boolean(assetErrors.storageUrl))}
                          placeholder="https://..."
                          required
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <InputLabel label="Thumbnail URL" htmlFor="asset-thumb">
                        <input
                          id="asset-thumb"
                          name="thumbnailUrl"
                          value={assetForm.thumbnailUrl}
                          onChange={handleAssetChange}
                          className={inputClassName(false)}
                          placeholder="Optional preview image"
                          disabled={!canManage}
                        />
                      </InputLabel>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <InputLabel label="Size (bytes)" htmlFor="asset-size">
                          <input
                            id="asset-size"
                            name="sizeBytes"
                            value={assetForm.sizeBytes}
                            onChange={handleAssetChange}
                            className={inputClassName(Boolean(assetErrors.sizeBytes))}
                            type="number"
                            min="0"
                            disabled={!canManage}
                          />
                        </InputLabel>
                        <InputLabel label="Permission" htmlFor="asset-permission">
                          <select
                            id="asset-permission"
                            name="permissionLevel"
                            value={assetForm.permissionLevel}
                            onChange={handleAssetChange}
                            className={inputClassName(false)}
                            disabled={!canManage}
                          >
                            {ASSET_PERMISSION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </InputLabel>
                        <InputLabel label="Watermark" htmlFor="asset-watermark" hint="Protect visuals with a watermark">
                          <select
                            id="asset-watermark"
                            name="watermarkEnabled"
                            value={assetForm.watermarkEnabled ? 'true' : 'false'}
                            onChange={(event) =>
                              setAssetForm((current) => ({
                                ...current,
                                watermarkEnabled: event.target.value === 'true',
                              }))
                            }
                            className={inputClassName(false)}
                            disabled={!canManage}
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </InputLabel>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                          disabled={assetSubmitting || !canManage}
                        >
                          {assetSubmitting ? 'Saving…' : assetForm.id ? 'Update asset' : 'Add asset'}
                        </button>
                        {assetForm.id ? (
                          <button
                            type="button"
                            onClick={resetAssetForm}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ProjectDetailModal.propTypes = {
  project: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  canManage: PropTypes.bool.isRequired,
  statusOptions: PropTypes.array.isRequired,
  workspaceStatusOptions: PropTypes.array.isRequired,
  riskOptions: PropTypes.array.isRequired,
  currencyOptions: PropTypes.array.isRequired,
  actions: PropTypes.shape({
    updateProject: PropTypes.func.isRequired,
    createMilestone: PropTypes.func.isRequired,
    updateMilestone: PropTypes.func.isRequired,
    deleteMilestone: PropTypes.func.isRequired,
    createCollaborator: PropTypes.func.isRequired,
    updateCollaborator: PropTypes.func.isRequired,
    deleteCollaborator: PropTypes.func.isRequired,
    addAsset: PropTypes.func.isRequired,
    updateAsset: PropTypes.func.isRequired,
    deleteAsset: PropTypes.func.isRequired,
  }).isRequired,
};

ProjectDetailModal.defaultProps = {
  project: null,
};

export default function DeliveryOperationsSection({ freelancerId }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(freelancerId);

  const meta = data?.meta ?? {};
  const access = data?.access ?? { canManage: false };
  const canManage = access.canManage !== false;
  const allowedRoles = access.allowedRoles?.map((role) => role.replace(/_/g, ' ')) ?? [];
  const accessMessage = !canManage
    ? access.reason ?? 'Workspace is view-only for your current role. Contact your workspace admin for changes.'
    : null;

  const projects = useMemo(
    () => (Array.isArray(data?.projectCreation?.projects) ? data.projectCreation.projects : []),
    [data?.projectCreation?.projects],
  );

  const openProjects = useMemo(
    () =>
      projects.filter((project) => {
        const workspaceStatus = project.workspace?.status ?? project.status;
        return !project.archivedAt && workspaceStatus !== 'completed';
      }),
    [projects],
  );

  const closedProjects = useMemo(
    () =>
      projects.filter((project) => {
        const workspaceStatus = project.workspace?.status ?? project.status;
        return project.archivedAt || workspaceStatus === 'completed';
      }),
    [projects],
  );

  const managementBoard = data?.managementBoard ?? {};
  const boardLanes = managementBoard.lanes ?? [];
  const boardMetrics = managementBoard.metrics ?? {};
  const boardIntegrations = managementBoard.integrations ?? [];

  const templates = data?.projectCreation?.templates ?? [];
  const assetsOverview = data?.assets ?? {};
  const allAssets = assetsOverview.items ?? [];
  const assetSummary = assetsOverview.summary ?? {};
  const brandAssets = assetsOverview.brandAssets ?? [];

  const purchasedGigs = data?.purchasedGigs ?? {};
  const gigOrders = purchasedGigs.orders ?? [];
  const gigStats = purchasedGigs.stats ?? {};
  const gigReminders = purchasedGigs.reminders ?? [];

  const storytelling = data?.storytelling ?? { achievements: [], quickExports: {}, prompts: [] };

  const [createForm, setCreateForm] = useState({ ...CREATE_FORM_DEFAULTS });
  const [createErrors, setCreateErrors] = useState({});
  const [createFeedback, setCreateFeedback] = useState(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [projects, editingProjectId],
  );
  const [busyAction, setBusyAction] = useState(null);

  const summary = data?.summary ?? {};

  const summaryCards = [
    {
      label: 'Open projects',
      value: openProjects.length,
      description: 'Active and in-flight engagements',
    },
    {
      label: 'Closed projects',
      value: closedProjects.length,
      description: 'Completed or archived initiatives',
    },
    {
      label: 'Budget in play',
      value: formatCurrency(summary.budgetInPlay ?? 0, summary.currency ?? 'USD'),
      description: 'Allocated across open projects',
    },
    {
      label: 'Average progress',
      value: openProjects.length
        ? `${Math.round(
            openProjects.reduce(
              (total, project) => total + Number(project.workspace?.progressPercent ?? 0),
              0,
            ) / openProjects.length,
          )}%`
        : '0%',
      description: 'Across open workspaces',
    },
  ];

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  };

  const resetCreateForm = () => {
    setCreateForm({ ...CREATE_FORM_DEFAULTS });
    setCreateErrors({});
    setCreateFeedback(null);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const { valid, errors } = validateCreateForm(createForm);
    setCreateErrors(errors);
    if (!valid) {
      setCreateFeedback({ status: 'error', message: 'Review the highlighted fields before creating the project.' });
      return;
    }
    setCreateSubmitting(true);
    setCreateFeedback(null);
    try {
      const metadata = {};
      const trimmedClient = createForm.clientName?.trim() ?? '';
      if (trimmedClient) {
        metadata.clientName = trimmedClient;
      }
      const trimmedWorkspaceUrl = createForm.workspaceUrl?.trim() ?? '';
      if (trimmedWorkspaceUrl) {
        metadata.workspaceUrl = trimmedWorkspaceUrl;
      }
      const trimmedCoverUrl = createForm.coverImageUrl?.trim() ?? '';
      if (trimmedCoverUrl) {
        metadata.coverImageUrl = trimmedCoverUrl;
      }
      const tags = parseTagInput(createForm.tags);
      if (tags.length) {
        metadata.tags = tags;
      }

      await actions.createProject({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        startDate: createForm.startDate || undefined,
        dueDate: createForm.dueDate || undefined,
        budgetCurrency: createForm.budgetCurrency,
        budgetAllocated: parseNumber(createForm.budgetAllocated) ?? 0,
        workspace: {
          status: 'planning',
          riskLevel: createForm.riskLevel,
          progressPercent: parseNumber(createForm.progressPercent) ?? 10,
          nextMilestone: createForm.nextMilestone?.trim() || undefined,
          nextMilestoneDueAt: createForm.nextMilestoneDueAt || createForm.dueDate || undefined,
        },
        metadata,
      });
      resetCreateForm();
      setCreateFeedback({ status: 'success', message: 'Project workspace created successfully.' });
    } catch (submitError) {
      setCreateFeedback({
        status: 'error',
        message: submitError?.message ?? 'Unable to create the project workspace right now.',
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setCreateForm((current) => ({
      ...current,
      title: template.name,
      description: template.description,
      budgetAllocated:
        template.recommendedBudgetMax && template.recommendedBudgetMin
          ? Math.round((Number(template.recommendedBudgetMax) + Number(template.recommendedBudgetMin)) / 2)
          : current.budgetAllocated,
      budgetCurrency: 'USD',
      nextMilestone: template.toolkit?.[0] ?? current.nextMilestone,
    }));
    setCreateFeedback({
      status: 'success',
      message: `Template “${template.name}” loaded into the creation form. Adjust details before saving.`,
    });
  };

  const handleArchive = async (project) => {
    setBusyAction(`archive-${project.id}`);
    try {
      await actions.archiveProject(project.id, {
        status: 'completed',
        workspace: {
          status: 'completed',
          progressPercent: 100,
          riskLevel: 'low',
        },
      });
    } catch (actionError) {
      console.error('Failed to archive project', actionError);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRestore = async (project) => {
    setBusyAction(`restore-${project.id}`);
    try {
      const currentProgress = project.workspace?.progressPercent ?? 25;
      await actions.restoreProject(project.id, {
        status: 'in_progress',
        workspace: {
          status: 'in_progress',
          progressPercent: currentProgress > 95 ? 95 : currentProgress,
          riskLevel: project.workspace?.riskLevel ?? 'medium',
        },
      });
    } catch (actionError) {
      console.error('Failed to restore project', actionError);
    } finally {
      setBusyAction(null);
    }
  };

  const handleEditOpen = (project) => {
    setEditingProjectId(project.id);
  };

  const handleEditClose = () => {
    setEditingProjectId(null);
  };

  return (
    <SectionShell
      id="delivery-ops"
      title="Project management"
      description="Launch, monitor, and close out projects with complete visibility across budgets, milestones, and risk."
      actions={[
        <button
          key="refresh"
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowPathIcon className="h-4 w-4" /> Refresh snapshot
        </button>,
      ]}
    >
      <DataStatus
        loading={loading}
        error={error?.message}
        fromCache={meta.fromCache}
        lastUpdated={meta.lastUpdated}
        onRefresh={reload}
      />

      {!canManage ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-800">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-1 h-5 w-5" />
            <div>
              <p className="font-semibold">Project workspace access is limited</p>
              <p className="mt-1">{accessMessage}</p>
              {allowedRoles.length ? (
                <p className="mt-2 text-xs uppercase tracking-wide text-amber-700">Enabled for roles: {allowedRoles.join(', ')}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:border-accent/40 hover:shadow-soft"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.description}</p>
          </div>
        ))}
      </section>

      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Create a new project</h3>
          <p className="mt-1 text-sm text-slate-600">Kick off a governed workspace with milestones and delivery metrics.</p>
          {createFeedback ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                createFeedback.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {createFeedback.message}
            </div>
          ) : null}
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateSubmit} noValidate>
            <InputLabel label="Project name" htmlFor="create-title">
              <input
                id="create-title"
                name="title"
                value={createForm.title}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.title))}
                placeholder="Workspace relaunch"
                required
              />
            </InputLabel>
            <InputLabel label="Allocated budget" htmlFor="create-budget">
              <input
                id="create-budget"
                name="budgetAllocated"
                value={createForm.budgetAllocated}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.budgetAllocated))}
                placeholder="25000"
                type="number"
                min="0"
              />
            </InputLabel>
            <InputLabel label="Currency" htmlFor="create-currency">
              <select
                id="create-currency"
                name="budgetCurrency"
                value={createForm.budgetCurrency}
                onChange={handleCreateChange}
                className={inputClassName(false)}
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </InputLabel>
            <InputLabel label="Start date" htmlFor="create-start">
              <input
                id="create-start"
                type="date"
                name="startDate"
                value={createForm.startDate}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.startDate))}
              />
            </InputLabel>
            <InputLabel label="Due date" htmlFor="create-due">
              <input
                id="create-due"
                type="date"
                name="dueDate"
                value={createForm.dueDate}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.dueDate))}
              />
            </InputLabel>
            <InputLabel label="Initial progress (%)" htmlFor="create-progress">
              <input
                id="create-progress"
                type="number"
                min="0"
                max="100"
                name="progressPercent"
                value={createForm.progressPercent}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.progressPercent))}
              />
            </InputLabel>
            <InputLabel label="Risk level" htmlFor="create-risk">
              <select
                id="create-risk"
                name="riskLevel"
                value={createForm.riskLevel}
                onChange={handleCreateChange}
                className={inputClassName(false)}
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </InputLabel>
            <InputLabel label="Next milestone" htmlFor="create-milestone">
              <input
                id="create-milestone"
                name="nextMilestone"
                value={createForm.nextMilestone}
                onChange={handleCreateChange}
                className={inputClassName(false)}
                placeholder="Kickoff workshop"
              />
            </InputLabel>
            <InputLabel label="Milestone due date" htmlFor="create-milestone-due">
              <input
                id="create-milestone-due"
                type="date"
                name="nextMilestoneDueAt"
                value={createForm.nextMilestoneDueAt}
                onChange={handleCreateChange}
                className={inputClassName(false)}
              />
            </InputLabel>
            <InputLabel label="Client / stakeholder" htmlFor="create-client">
              <input
                id="create-client"
                name="clientName"
                value={createForm.clientName}
                onChange={handleCreateChange}
                className={inputClassName(false)}
                placeholder="Lumina Health experience audit"
              />
            </InputLabel>
            <InputLabel label="Workspace URL" htmlFor="create-workspace-url" hint="Shared dashboard or portal link">
              <input
                id="create-workspace-url"
                name="workspaceUrl"
                value={createForm.workspaceUrl}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.workspaceUrl))}
                placeholder="https://workspace.gigvora.com/projects/..."
              />
            </InputLabel>
            <InputLabel label="Cover image" htmlFor="create-cover-image" hint="Optional hero image for storytelling">
              <input
                id="create-cover-image"
                name="coverImageUrl"
                value={createForm.coverImageUrl}
                onChange={handleCreateChange}
                className={inputClassName(Boolean(createErrors.coverImageUrl))}
                placeholder="https://cdn.example.com/project-cover.jpg"
              />
            </InputLabel>
            <InputLabel label="Tags" htmlFor="create-tags" hint="Comma-separated e.g. strategy, onboarding">
              <input
                id="create-tags"
                name="tags"
                value={createForm.tags}
                onChange={handleCreateChange}
                className={inputClassName(false)}
                placeholder="strategy, onboarding, fintech"
              />
            </InputLabel>
            <InputLabel label="Project description" htmlFor="create-description" hint="Outline goals, collaborators, and outcomes">
              <textarea
                id="create-description"
                name="description"
                value={createForm.description}
                onChange={handleCreateChange}
                className={`${inputClassName(Boolean(createErrors.description))} min-h-[120px] md:col-span-2`}
                placeholder="Outline goals, collaborators, and the expected outcomes."
                required
              />
            </InputLabel>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                disabled={createSubmitting}
              >
                {createSubmitting ? 'Creating…' : 'Create project'}
              </button>
              <button
                type="button"
                onClick={resetCreateForm}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delivery board</h3>
                <p className="mt-1 text-sm text-slate-600">Track project flow across statuses and spot risk signals early.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">{boardMetrics.activeProjects ?? 0}</p>
                  <p>Active projects</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{Math.round(boardMetrics.averageProgress ?? 0)}%</p>
                  <p>Average progress</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{boardMetrics.atRisk ?? 0}</p>
                  <p>At risk</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{boardMetrics.completed ?? 0}</p>
                  <p>Completed</p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {boardLanes.map((lane) => (
                <BoardLane key={lane.status} lane={lane} />
              ))}
            </div>
            {boardIntegrations.length ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Integrations</p>
                <p className="mt-1">
                  {boardIntegrations
                    .map((entry) => `${formatStatus(entry.status)}: ${entry.integrations.join(', ') || 'None'}`)
                    .join(' · ')}
                </p>
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Project templates</h3>
              <Badge tone="default">{templates.length} available</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">Load structured workflows to speed up project kickoff.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {templates.map((template) => (
                <div key={template.name} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{template.category}</p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">{template.summary ?? template.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Budget {formatCurrency(template.recommendedBudgetMin)} – {formatCurrency(template.recommendedBudgetMax)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <PlusIcon className="h-4 w-4" /> Use template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Asset vault</h3>
            <p className="mt-1 text-sm text-slate-600">Centralize files, contracts, and media for secure sharing.</p>
            <div className="mt-4 grid gap-3 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">{assetSummary.total ?? 0}</p>
                <p>Total assets</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{assetSummary.restricted ?? 0}</p>
                <p>Restricted assets</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{formatBytes(assetSummary.storageBytes)}</p>
                <p>Storage used</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{Math.round(assetSummary.watermarkCoverage ?? 0)}%</p>
                <p>Watermark coverage</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {allAssets.slice(0, 4).map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{asset.label}</p>
                  <p>{asset.category} · {formatBytes(asset.sizeBytes)} · {formatStatus(asset.permissionLevel)}</p>
                </div>
              ))}
              {allAssets.length > 4 ? (
                <p className="text-xs text-slate-500">+{allAssets.length - 4} more assets</p>
              ) : null}
            </div>
            {brandAssets.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Brand assets</p>
                <p>{brandAssets.map((asset) => asset.label).join(', ')}</p>
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Gig delivery pipeline</h3>
            <p className="mt-1 text-sm text-slate-600">Monitor vendor workstreams and upcoming deliverables.</p>
            <div className="mt-4 grid gap-3 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">{gigStats.totalOrders ?? 0}</p>
                <p>Total orders</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{gigStats.active ?? 0}</p>
                <p>Active</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{gigStats.completed ?? 0}</p>
                <p>Completed</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {gigOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{order.serviceName}</p>
                  <p>
                    {order.vendorName} · {formatStatus(order.status)} · Due {formatDateForDisplay(order.dueAt)}
                  </p>
                </div>
              ))}
              {gigOrders.length > 3 ? (
                <p className="text-xs text-slate-500">+{gigOrders.length - 3} more orders</p>
              ) : null}
            </div>
            <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reminders</p>
              {gigReminders.length ? (
                gigReminders.slice(0, 4).map((reminder) => (
                  <p key={`${reminder.orderId}-${reminder.type}`} className="text-xs text-slate-600">
                    {reminder.type === 'requirement'
                      ? `${reminder.title ?? 'Requirement'} due ${formatDateForDisplay(reminder.dueAt)}`
                      : `Delivery ${reminder.overdue ? 'overdue' : 'due'} ${formatDateForDisplay(reminder.dueAt)}`}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500">No reminders today.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Storytelling & quick exports</h3>
        <p className="mt-1 text-sm text-slate-600">
          Capture achievements and reuse them for proposals, resumes, and social proof.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {storytelling.achievements?.slice(0, 6).map((item, index) => (
            <StoryHighlight key={`${item.title}-${index}`} title={item.title} bullet={item.bullet} />
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Resume bullets</p>
            <ul className="mt-2 space-y-1">
              {storytelling.quickExports?.resume?.map((line, index) => (
                <li key={`resume-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">LinkedIn posts</p>
            <ul className="mt-2 space-y-1">
              {storytelling.quickExports?.linkedin?.map((line, index) => (
                <li key={`linkedin-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">AI prompts</p>
            <ul className="mt-2 space-y-1">
              {storytelling.prompts?.slice(0, 4).map((line, index) => (
                <li key={`prompt-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Open projects</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{openProjects.length} active</p>
        </div>
        {openProjects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-600">
            No open projects yet. Create a project above to start tracking milestones and budget health.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {openProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canManage={canManage}
                onEdit={handleEditOpen}
                onComplete={handleArchive}
                busy={busyAction === `archive-${project.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Closed projects</h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{closedProjects.length} archived</p>
        </div>
        {closedProjects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
            Completed projects will appear here for quick access and reactivation.
          </div>
        ) : (
          <div className="space-y-3">
            {closedProjects.map((project) => (
              <ClosedProjectCard
                key={project.id}
                project={project}
                canManage={canManage}
                onRestore={handleRestore}
                busy={busyAction === `restore-${project.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <ProjectDetailModal
        project={editingProject}
        open={Boolean(editingProject)}
        onClose={handleEditClose}
        canManage={canManage}
        statusOptions={STATUS_OPTIONS}
        workspaceStatusOptions={WORKSPACE_STATUS_OPTIONS}
        riskOptions={RISK_OPTIONS}
        currencyOptions={CURRENCY_OPTIONS}
        actions={actions}
      />
    </SectionShell>
  );
}

DeliveryOperationsSection.propTypes = {
  freelancerId: PropTypes.number,
};

DeliveryOperationsSection.defaultProps = {
  freelancerId: null,
};

