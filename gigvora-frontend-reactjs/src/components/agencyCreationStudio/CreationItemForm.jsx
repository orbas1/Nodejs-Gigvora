import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_SETTINGS = {
  enableAutoPublish: false,
  highlightOnDashboard: true,
  requireApproval: true,
  trackApplicationAnalytics: true,
  notifyCollaborators: true,
};

const STEP_ORDER = [
  { id: 'basics', label: 'Basics' },
  { id: 'details', label: 'Details' },
  { id: 'team', label: 'Team' },
];

const PERMISSION_OPTIONS = [
  { key: 'canEdit', label: 'Edit' },
  { key: 'canPublish', label: 'Publish' },
  { key: 'canManageAccess', label: 'Access' },
];

const DEFAULT_AUDIENCE = { primary: '', secondary: '', notes: '' };

function formatSettingLabel(key) {
  if (!key) return '';
  const spaced = key.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseList(value, { newline = false } = {}) {
  if (!value) {
    return [];
  }
  const delimiter = newline ? /\n+/ : /[,\n]+/;
  return value
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function CreationItemForm({ initialValue, config, busy, onSubmit, onCancel }) {
  const defaults = useMemo(() => {
    const base = {
      title: '',
      targetType: config?.targetTypes?.[0]?.value ?? 'project',
      status: 'draft',
      priority: 'medium',
      visibility: 'internal',
      summary: '',
      description: '',
      callToAction: '',
      ctaUrl: '',
      applicationInstructions: '',
      tags: [],
      requirements: [],
      autoShareChannels: [],
      launchDate: '',
      closingDate: '',
      budgetAmount: '',
      budgetCurrency: 'USD',
      capacityNeeded: '',
      expectedAttendees: '',
      experienceLevel: '',
      location: '',
      timezone: '',
      audience: { ...DEFAULT_AUDIENCE },
      settings: { ...DEFAULT_SETTINGS, ...(config?.settingsTemplate ?? {}) },
      metadata: {},
      contactEmail: '',
      contactPhone: '',
      assets: [],
      collaborators: [],
    };
    return base;
  }, [config?.settingsTemplate, config?.targetTypes]);

  const [formState, setFormState] = useState(defaults);
  const [stepIndex, setStepIndex] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const merged = { ...defaults, ...(initialValue ?? {}) };
    setFormState({
      ...merged,
      launchDate: merged.launchDate ? merged.launchDate.slice(0, 10) : '',
      closingDate: merged.closingDate ? merged.closingDate.slice(0, 10) : '',
      autoShareChannels: Array.isArray(merged.autoShareChannels) ? merged.autoShareChannels : [],
      tags: Array.isArray(merged.tags) ? merged.tags : [],
      requirements: Array.isArray(merged.requirements) ? merged.requirements : [],
      settings: { ...defaults.settings, ...(merged.settings ?? {}) },
      audience: { ...DEFAULT_AUDIENCE, ...(merged.audience ?? {}) },
      collaborators: Array.isArray(merged.collaborators) ? merged.collaborators : [],
      assets: Array.isArray(merged.assets) ? merged.assets : [],
    });
    setTagsInput((merged.tags ?? []).join(', '));
    setRequirementsInput((merged.requirements ?? []).join('\n'));
    setStepIndex(0);
    setErrorMessage(null);
  }, [defaults, initialValue]);

  const typeOptions = config?.targetTypes ?? [];
  const statusOptions = config?.statuses ?? [
    { value: 'draft', label: 'Draft' },
    { value: 'in_review', label: 'In review' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];
  const priorityOptions = config?.priorities ?? [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];
  const visibilityOptions = config?.visibilities ?? [
    { value: 'internal', label: 'Internal' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'public', label: 'Public' },
  ];
  const shareChannelOptions = config?.autoShareChannels ?? [];
  const assetTypeOptions = config?.assetTypes ?? ['link', 'document', 'image', 'video'];

  const preparedPayload = useMemo(() => {
    const base = {
      title: formState.title?.trim() ?? '',
      targetType: formState.targetType,
      status: formState.status,
      priority: formState.priority,
      visibility: formState.visibility,
      summary: formState.summary?.trim() ?? '',
      description: formState.description?.trim() ?? '',
      callToAction: formState.callToAction?.trim() ?? '',
      ctaUrl: formState.ctaUrl?.trim() ?? '',
      applicationInstructions: formState.applicationInstructions?.trim() ?? '',
      launchDate: formState.launchDate || null,
      closingDate: formState.closingDate || null,
      budgetAmount: toNumberOrNull(formState.budgetAmount),
      budgetCurrency: formState.budgetCurrency?.trim() ?? '',
      capacityNeeded: toNumberOrNull(formState.capacityNeeded),
      expectedAttendees: toNumberOrNull(formState.expectedAttendees),
      experienceLevel: formState.experienceLevel?.trim() ?? '',
      location: formState.location?.trim() ?? '',
      timezone: formState.timezone?.trim() ?? '',
      contactEmail: formState.contactEmail?.trim() ?? '',
      contactPhone: formState.contactPhone?.trim() ?? '',
      audience: { ...DEFAULT_AUDIENCE, ...(formState.audience ?? {}) },
      settings: { ...DEFAULT_SETTINGS, ...(formState.settings ?? {}) },
      metadata: formState.metadata ?? {},
    };

    base.autoShareChannels = Array.isArray(formState.autoShareChannels)
      ? Array.from(new Set(formState.autoShareChannels.filter(Boolean)))
      : [];
    base.tags = parseList(tagsInput);
    base.requirements = parseList(requirementsInput, { newline: true });
    base.assets = (formState.assets ?? [])
      .map((asset) => ({
        label: asset.label?.trim() ?? '',
        url: asset.url?.trim() ?? '',
        assetType: asset.assetType ?? assetTypeOptions[0] ?? 'link',
        description: asset.description?.trim() ?? '',
      }))
      .filter((asset) => asset.label && asset.url);
    base.collaborators = (formState.collaborators ?? [])
      .map((collaborator) => ({
        collaboratorEmail: collaborator.collaboratorEmail?.trim() ?? '',
        collaboratorName: collaborator.collaboratorName?.trim() ?? '',
        role: collaborator.role?.trim() ?? 'Collaborator',
        permissions: PERMISSION_OPTIONS.reduce(
          (acc, option) => ({ ...acc, [option.key]: Boolean(collaborator.permissions?.[option.key]) }),
          {},
        ),
      }))
      .filter((collaborator) => collaborator.collaboratorEmail || collaborator.collaboratorName);

    return base;
  }, [assetTypeOptions, formState, requirementsInput, tagsInput]);

  const currentStep = STEP_ORDER[stepIndex] ?? STEP_ORDER[0];

  function goNext() {
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex((prev) => prev + 1);
      return;
    }
    if (!preparedPayload.title) {
      setErrorMessage('Add a title before saving.');
      setStepIndex(0);
      return;
    }
    setErrorMessage(null);
    onSubmit(preparedPayload);
  }

  function goBack() {
    if (stepIndex === 0) {
      onCancel?.();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAudienceChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      audience: {
        ...prev.audience,
        [field]: value,
      },
    }));
  };

  const handleSettingsToggle = (field) => (event) => {
    const { checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: checked,
      },
    }));
  };

  const handleChannelToggle = (channel) => () => {
    setFormState((prev) => {
      const next = new Set(prev.autoShareChannels ?? []);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return { ...prev, autoShareChannels: Array.from(next) };
    });
  };

  const handleCollaboratorChange = (index, field) => (event) => {
    const value = event.target?.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => {
      const next = [...(prev.collaborators ?? [])];
      const current = next[index] ?? { permissions: {} };
      if (field.startsWith('permissions.')) {
        const [, key] = field.split('.');
        next[index] = {
          ...current,
          permissions: { ...current.permissions, [key]: Boolean(value) },
        };
      } else {
        next[index] = { ...current, [field]: value };
      }
      return { ...prev, collaborators: next };
    });
  };

  const addCollaborator = () => {
    setFormState((prev) => ({
      ...prev,
      collaborators: [
        ...(prev.collaborators ?? []),
        {
          collaboratorName: '',
          collaboratorEmail: '',
          role: 'Collaborator',
          permissions: PERMISSION_OPTIONS.reduce(
            (acc, option) => ({ ...acc, [option.key]: option.key === 'canEdit' }),
            {},
          ),
        },
      ],
    }));
  };

  const removeCollaborator = (index) => () => {
    setFormState((prev) => ({
      ...prev,
      collaborators: (prev.collaborators ?? []).filter((_, candidateIndex) => candidateIndex !== index),
    }));
  };

  const handleAssetChange = (index, field) => (event) => {
    const value = event.target.value;
    setFormState((prev) => {
      const next = [...(prev.assets ?? [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, assets: next };
    });
  };

  const addAsset = () => {
    setFormState((prev) => ({
      ...prev,
      assets: [...(prev.assets ?? []), { label: '', url: '', assetType: assetTypeOptions[0] ?? 'link' }],
    }));
  };

  const removeAsset = (index) => () => {
    setFormState((prev) => ({
      ...prev,
      assets: (prev.assets ?? []).filter((_, candidateIndex) => candidateIndex !== index),
    }));
  };

  function renderBasics() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Title</span>
            <input
              type="text"
              required
              value={formState.title}
              onChange={handleFieldChange('title')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Type</span>
            <select
              value={formState.targetType}
              onChange={handleFieldChange('targetType')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select
              value={formState.status}
              onChange={handleFieldChange('status')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">Priority</span>
              <select
                value={formState.priority}
                onChange={handleFieldChange('priority')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">Visibility</span>
              <select
                value={formState.visibility}
                onChange={handleFieldChange('visibility')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">Summary</span>
          <textarea
            value={formState.summary}
            onChange={handleFieldChange('summary')}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500">Description</span>
          <textarea
            value={formState.description}
            onChange={handleFieldChange('description')}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Launch date</span>
            <input
              type="date"
              value={formState.launchDate ?? ''}
              onChange={handleFieldChange('launchDate')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Close date</span>
            <input
              type="date"
              value={formState.closingDate ?? ''}
              onChange={handleFieldChange('closingDate')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Call to action</span>
            <input
              type="text"
              value={formState.callToAction}
              onChange={handleFieldChange('callToAction')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">CTA link</span>
            <input
              type="url"
              value={formState.ctaUrl}
              onChange={handleFieldChange('ctaUrl')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </div>
    );
  }

  function renderDetails() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Tags</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="Separate with commas"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Requirements</span>
            <textarea
              value={requirementsInput}
              onChange={(event) => setRequirementsInput(event.target.value)}
              rows={3}
              placeholder="One per line"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Location</span>
            <input
              type="text"
              value={formState.location}
              onChange={handleFieldChange('location')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Timezone</span>
            <input
              type="text"
              value={formState.timezone}
              onChange={handleFieldChange('timezone')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Experience level</span>
            <input
              type="text"
              value={formState.experienceLevel}
              onChange={handleFieldChange('experienceLevel')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Budget</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formState.budgetAmount}
              onChange={handleFieldChange('budgetAmount')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Currency</span>
            <input
              type="text"
              value={formState.budgetCurrency}
              onChange={handleFieldChange('budgetCurrency')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Capacity</span>
            <input
              type="number"
              min="0"
              value={formState.capacityNeeded}
              onChange={handleFieldChange('capacityNeeded')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Expected attendees</span>
            <input
              type="number"
              min="0"
              value={formState.expectedAttendees}
              onChange={handleFieldChange('expectedAttendees')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Application notes</span>
            <textarea
              value={formState.applicationInstructions}
              onChange={handleFieldChange('applicationInstructions')}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Audience (primary)</span>
            <input
              type="text"
              value={formState.audience?.primary ?? ''}
              onChange={handleAudienceChange('primary')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Audience (secondary)</span>
            <input
              type="text"
              value={formState.audience?.secondary ?? ''}
              onChange={handleAudienceChange('secondary')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-1">
            <span className="text-xs font-medium text-slate-500">Audience notes</span>
            <textarea
              value={formState.audience?.notes ?? ''}
              onChange={handleAudienceChange('notes')}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        {shareChannelOptions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Share</p>
            <div className="flex flex-wrap gap-2">
              {shareChannelOptions.map((channel) => {
                const active = formState.autoShareChannels?.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={handleChannelToggle(channel)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'bg-accent text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {channel.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderTeam() {
    const collaborators = formState.collaborators ?? [];
    const assets = formState.assets ?? [];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Contact email</span>
            <input
              type="email"
              value={formState.contactEmail}
              onChange={handleFieldChange('contactEmail')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500">Contact phone or channel</span>
            <input
              type="text"
              value={formState.contactPhone}
              onChange={handleFieldChange('contactPhone')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Collaborators</p>
            <button
              type="button"
              onClick={addCollaborator}
              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {collaborators.length === 0 && <p className="text-xs text-slate-500">No collaborators yet.</p>}
            {collaborators.map((collaborator, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Name</span>
                    <input
                      type="text"
                      value={collaborator.collaboratorName ?? ''}
                      onChange={handleCollaboratorChange(index, 'collaboratorName')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Email</span>
                    <input
                      type="email"
                      value={collaborator.collaboratorEmail ?? ''}
                      onChange={handleCollaboratorChange(index, 'collaboratorEmail')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Role</span>
                    <input
                      type="text"
                      value={collaborator.role ?? ''}
                      onChange={handleCollaboratorChange(index, 'role')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeCollaborator(index)}
                    className="self-end rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {PERMISSION_OPTIONS.map((option) => (
                    <label key={option.key} className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(collaborator.permissions?.[option.key])}
                        onChange={handleCollaboratorChange(index, `permissions.${option.key}`)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Assets</p>
            <button
              type="button"
              onClick={addAsset}
              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-3">
            {assets.length === 0 && <p className="text-xs text-slate-500">No assets yet.</p>}
            {assets.map((asset, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Label</span>
                    <input
                      type="text"
                      value={asset.label ?? ''}
                      onChange={handleAssetChange(index, 'label')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">Type</span>
                    <select
                      value={asset.assetType ?? assetTypeOptions[0] ?? 'link'}
                      onChange={handleAssetChange(index, 'assetType')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    >
                      {assetTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Link</span>
                  <input
                    type="url"
                    value={asset.url ?? ''}
                    onChange={handleAssetChange(index, 'url')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-500">Notes</span>
                  <textarea
                    value={asset.description ?? ''}
                    onChange={handleAssetChange(index, 'description')}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={removeAsset(index)}
                  className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-slate-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Settings</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(DEFAULT_SETTINGS).map((key) => (
              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                <span>{formatSettingLabel(key)}</span>
                <input
                  type="checkbox"
                  checked={Boolean(formState.settings?.[key])}
                  onChange={handleSettingsToggle(key)}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        goNext();
      }}
      className="flex h-full flex-col"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">{initialValue ? 'Edit item' : 'New item'}</p>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <ol className="flex items-center gap-2 text-xs font-medium text-slate-500">
          {STEP_ORDER.map((step, index) => {
            const active = index === stepIndex;
            const complete = index < stepIndex;
            return (
              <li key={step.id} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                    active
                      ? 'border-accent bg-accent text-white'
                      : complete
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-slate-300 bg-white text-slate-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={active ? 'text-accent' : 'text-slate-500'}>{step.label}</span>
                {index < STEP_ORDER.length - 1 && <span className="text-slate-300">/</span>}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {currentStep.id === 'basics' && renderBasics()}
        {currentStep.id === 'details' && renderDetails()}
        {currentStep.id === 'team' && renderTeam()}
      </div>
      {errorMessage && <p className="px-6 pb-3 text-xs font-medium text-rose-600">{errorMessage}</p>}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={goBack}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
        >
          {stepIndex === 0 ? 'Cancel' : 'Back'}
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
        >
          {stepIndex < STEP_ORDER.length - 1 ? 'Next' : busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

CreationItemForm.propTypes = {
  initialValue: PropTypes.object,
  config: PropTypes.shape({
    targetTypes: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    statuses: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    priorities: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    visibilities: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    autoShareChannels: PropTypes.arrayOf(PropTypes.string),
    assetTypes: PropTypes.arrayOf(PropTypes.string),
    settingsTemplate: PropTypes.object,
  }),
  busy: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

CreationItemForm.defaultProps = {
  initialValue: null,
  config: null,
  busy: false,
  onCancel: undefined,
};

export default CreationItemForm;
