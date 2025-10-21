import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  FunnelIcon,
  LinkIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  SparklesIcon,
  TrashIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const UPDATE_CATEGORIES = ['Launches', 'Content', 'Operations', 'Testimonials', 'Growth'];
const UPDATE_STATUSES = ['Draft', 'Scheduled', 'Published'];
const ACTION_STATUSES = ['Not started', 'In progress', 'Blocked', 'Completed'];
const ACTION_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const RESOURCE_TYPES = ['Notion', 'PDF', 'Video', 'Deck', 'Template', 'Website'];

const DEFAULT_UPDATE = {
  title: '',
  summary: '',
  category: 'Launches',
  link: '',
  publishedAt: '',
  status: 'Draft',
};

const DEFAULT_ACTION = {
  label: '',
  owner: '',
  dueAt: '',
  status: 'Not started',
  priority: 'Medium',
};

const DEFAULT_RESOURCE = {
  title: '',
  description: '',
  type: 'Notion',
  link: '',
  updatedAt: '',
  thumbnail: '',
  tags: '',
};

const HUB_BLUEPRINTS = [
  {
    id: 'launch-blueprint',
    label: 'Launch a new programme',
    summary: 'Prep launch comms, rally owners, and drop campaign assets in two clicks.',
    update: {
      title: 'Launch: Strategic leadership accelerator',
      summary: 'Opening cohort for 12 product leaders. Add mentee referrals and record intro Loom by Friday.',
      category: 'Launches',
      link: 'https://mentor.gigvora.com/launch/leadership-accelerator',
      status: 'Scheduled',
    },
    action: {
      label: 'Share launch teaser with waiting list',
      owner: 'Jordan Mentor',
      priority: 'High',
      status: 'In progress',
    },
    resource: {
      title: 'Leadership accelerator launch deck',
      description: 'Editable deck covering promise, curriculum, pricing tiers, and testimonials.',
      type: 'Deck',
      link: 'https://mentor.gigvora.com/resources/leadership-launch-deck',
      tags: ['Launch', 'Deck'],
    },
  },
  {
    id: 'content-refresh',
    label: 'Refresh async ritual',
    summary: 'Update spotlight messaging, refresh operations checklist, and log testimonials.',
    update: {
      title: 'Async ritual refresh',
      summary: 'Uploaded new async playbook. Add mentee proof points to Notion hub by Thursday.',
      category: 'Operations',
      link: 'https://mentor.gigvora.com/rituals/async-review',
      status: 'Published',
    },
    action: {
      label: 'Collect 3 testimonials for async ritual',
      owner: 'Jordan Mentor',
      priority: 'Medium',
      status: 'Not started',
    },
    resource: {
      title: 'Async review ritual checklist',
      description: 'Step-by-step checklist to keep async reviews consistent each week.',
      type: 'Template',
      link: 'https://mentor.gigvora.com/resources/async-checklist',
      tags: ['Operations', 'Template'],
    },
  },
  {
    id: 'community-drive',
    label: 'Boost community engagement',
    summary: 'Cue spotlight update, schedule LinkedIn posts, and ship notion recap page.',
    update: {
      title: 'Community spotlight week',
      summary: 'Highlight mentee wins across LinkedIn + Slack. Drop final recap for newsletter.',
      category: 'Testimonials',
      link: 'https://mentor.gigvora.com/community/spotlight-week',
      status: 'Draft',
    },
    action: {
      label: 'Schedule mentor AMA and gather questions',
      owner: 'Jordan Mentor',
      priority: 'Medium',
      status: 'In progress',
    },
    resource: {
      title: 'Mentor AMA recap template',
      description: 'Notion template to capture AMA questions, timestamps, and follow-ups.',
      type: 'Notion',
      link: 'https://mentor.gigvora.com/resources/ama-recap-template',
      tags: ['Community', 'Template'],
    },
  },
];

function formatForDateTimeInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    console.warn('Failed to format date value for input', error);
    return '';
  }
}

function normaliseDateTimePayload(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.warn('Failed to normalise date value', error);
    return null;
  }
}

function StatusBadge({ label }) {
  const badgeClass = useMemo(() => {
    switch (label) {
      case 'Published':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In progress':
      case 'Scheduled':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Blocked':
      case 'Critical':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Draft':
      case 'Not started':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }, [label]);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
      <SparklesIcon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  label: PropTypes.string.isRequired,
};

function ResourceCard({ resource, onEdit, onDelete }) {
  const tags = useMemo(() => {
    if (!resource?.tags) return [];
    if (Array.isArray(resource.tags)) return resource.tags;
    return String(resource.tags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [resource?.tags]);

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{resource.title}</p>
        <StatusBadge label={resource.type} />
      </div>
      {resource.thumbnail ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <img src={resource.thumbnail} alt="Resource thumbnail" className="h-32 w-full object-cover" />
        </div>
      ) : null}
      {resource.description ? <p className="text-xs text-slate-500">{resource.description}</p> : null}
      {tags.length ? (
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-slate-500">Updated {resource.updatedAt ? format(new Date(resource.updatedAt), 'dd MMM yyyy HH:mm') : 'recently'}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs font-semibold">
        <a href={resource.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
          <LinkIcon className="h-3.5 w-3.5" />
          Open resource
        </a>
        {onEdit ? (
          <button type="button" onClick={() => onEdit(resource)} className="text-slate-500 hover:text-accent">
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" onClick={() => onDelete(resource)} className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600">
            <TrashIcon className="h-3.5 w-3.5" />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    description: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    thumbnail: PropTypes.string,
    tags: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

ResourceCard.defaultProps = {
  onEdit: undefined,
  onDelete: undefined,
};

function formatDateTime(value) {
  if (!value) return '';
  try {
    return format(new Date(value), "dd MMM yyyy 'at' HH:mm");
  } catch (error) {
    return value;
  }
}

export default function MentorHubSection({
  hub,
  saving,
  onCreateUpdate,
  onUpdateUpdate,
  onDeleteUpdate,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
  onCreateResource,
  onUpdateResource,
  onDeleteResource,
  onSaveSpotlight,
}) {
  const [updateForm, setUpdateForm] = useState(DEFAULT_UPDATE);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [actionForm, setActionForm] = useState(DEFAULT_ACTION);
  const [editingActionId, setEditingActionId] = useState(null);
  const [resourceForm, setResourceForm] = useState(DEFAULT_RESOURCE);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [spotlightForm, setSpotlightForm] = useState(() => hub?.spotlight ?? {});
  const [feedback, setFeedback] = useState(null);
  const [updateStatusFilter, setUpdateStatusFilter] = useState('all');
  const [actionStatusFilter, setActionStatusFilter] = useState('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [resourceSearch, setResourceSearch] = useState('');

  const updates = hub?.updates ?? [];
  const actions = hub?.actions ?? [];
  const resources = hub?.resources ?? [];

  const spotlight = useMemo(() => hub?.spotlight ?? {}, [hub]);

  const updateSummary = useMemo(() => {
    const published = updates.filter((update) => update.status === 'Published').length;
    const scheduled = updates.filter((update) => update.status === 'Scheduled').length;
    const drafts = updates.filter((update) => update.status === 'Draft').length;
    return {
      total: updates.length,
      published,
      scheduled,
      drafts,
    };
  }, [updates]);

  const overdueActions = useMemo(() => {
    const now = Date.now();
    return actions.filter((action) => action.dueAt && new Date(action.dueAt).getTime() < now && action.status !== 'Completed');
  }, [actions]);

  const filteredUpdates = useMemo(() => {
    if (updateStatusFilter === 'all') {
      return updates;
    }
    return updates.filter((update) => update.status === updateStatusFilter);
  }, [updateStatusFilter, updates]);

  const filteredActions = useMemo(() => {
    if (actionStatusFilter === 'all') {
      return actions;
    }
    if (actionStatusFilter === 'overdue') {
      return overdueActions;
    }
    return actions.filter((action) => action.status === actionStatusFilter || action.priority === actionStatusFilter);
  }, [actionStatusFilter, actions, overdueActions]);

  const filteredResources = useMemo(() => {
    return resources
      .filter((resource) => (resourceTypeFilter === 'all' ? true : resource.type === resourceTypeFilter))
      .filter((resource) => {
        if (!resourceSearch) return true;
        const haystack = `${resource.title} ${resource.description ?? ''} ${Array.isArray(resource.tags) ? resource.tags.join(' ') : resource.tags ?? ''}`.toLowerCase();
        return haystack.includes(resourceSearch.toLowerCase());
      })
      .sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [resourceTypeFilter, resourceSearch, resources]);

  const handleApplyBlueprint = (blueprint) => {
    setEditingUpdateId(null);
    setEditingActionId(null);
    setEditingResourceId(null);
    setUpdateForm({
      ...DEFAULT_UPDATE,
      ...blueprint.update,
      publishedAt: formatForDateTimeInput(blueprint.update?.publishedAt),
    });
    setActionForm({
      ...DEFAULT_ACTION,
      ...blueprint.action,
      dueAt: formatForDateTimeInput(blueprint.action?.dueAt),
    });
    setResourceForm({
      ...DEFAULT_RESOURCE,
      ...blueprint.resource,
      tags: Array.isArray(blueprint.resource?.tags) ? blueprint.resource.tags.join(', ') : blueprint.resource?.tags ?? '',
      updatedAt: formatForDateTimeInput(blueprint.resource?.updatedAt),
    });
    setFeedback({
      type: 'success',
      message: `${blueprint.label} blueprint loaded. Personalise the copy then publish.`,
    });
  };

  useEffect(() => {
    setSpotlightForm(hub?.spotlight ?? {});
  }, [hub?.spotlight]);

  useEffect(() => {
    if (!editingUpdateId) {
      return;
    }
    const activeUpdate = updates.find((update) => update.id === editingUpdateId);
    if (!activeUpdate) {
      return;
    }
    setUpdateForm({
      ...DEFAULT_UPDATE,
      ...activeUpdate,
      publishedAt: formatForDateTimeInput(activeUpdate.publishedAt),
    });
  }, [editingUpdateId, updates]);

  useEffect(() => {
    if (!editingActionId) {
      return;
    }
    const activeAction = actions.find((action) => action.id === editingActionId);
    if (!activeAction) {
      return;
    }
    setActionForm({
      ...DEFAULT_ACTION,
      ...activeAction,
      dueAt: formatForDateTimeInput(activeAction.dueAt),
    });
  }, [actions, editingActionId]);

  useEffect(() => {
    if (!editingResourceId) {
      return;
    }
    const activeResource = resources.find((resource) => resource.id === editingResourceId);
    if (!activeResource) {
      return;
    }
    setResourceForm({
      ...DEFAULT_RESOURCE,
      ...activeResource,
      updatedAt: formatForDateTimeInput(activeResource.updatedAt),
      tags: Array.isArray(activeResource.tags) ? activeResource.tags.join(', ') : activeResource.tags ?? '',
    });
  }, [editingResourceId, resources]);

  const handleSubmitUpdate = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...updateForm,
      publishedAt: normaliseDateTimePayload(updateForm.publishedAt),
    };
    try {
      if (editingUpdateId) {
        await onUpdateUpdate?.(editingUpdateId, payload);
      } else {
        await onCreateUpdate?.(payload);
      }
      setUpdateForm(DEFAULT_UPDATE);
      setEditingUpdateId(null);
      setFeedback({ type: 'success', message: 'Hub update saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save update.' });
    }
  };

  const handleSubmitAction = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...actionForm,
      dueAt: normaliseDateTimePayload(actionForm.dueAt),
    };
    try {
      if (editingActionId) {
        await onUpdateAction?.(editingActionId, payload);
      } else {
        await onCreateAction?.(payload);
      }
      setActionForm(DEFAULT_ACTION);
      setEditingActionId(null);
      setFeedback({ type: 'success', message: 'Action saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save action.' });
    }
  };

  const handleSubmitResource = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...resourceForm,
      updatedAt: normaliseDateTimePayload(resourceForm.updatedAt),
      tags: String(resourceForm.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    try {
      if (editingResourceId) {
        await onUpdateResource?.(editingResourceId, payload);
      } else {
        await onCreateResource?.(payload);
      }
      setResourceForm(DEFAULT_RESOURCE);
      setEditingResourceId(null);
      setFeedback({ type: 'success', message: 'Resource saved successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save resource.' });
    }
  };

  const handleResetResource = () => {
    setEditingResourceId(null);
    setResourceForm(DEFAULT_RESOURCE);
  };

  const handleEditResource = (resource) => {
    setEditingResourceId(resource.id);
    setResourceForm({
      ...DEFAULT_RESOURCE,
      ...resource,
      updatedAt: formatForDateTimeInput(resource.updatedAt),
    });
  };

  const handleDeleteResource = async (resourceOrId) => {
    const resourceId = typeof resourceOrId === 'string' ? resourceOrId : resourceOrId?.id;
    if (!resourceId) {
      setFeedback({ type: 'error', message: 'Resource identifier missing.' });
      return;
    }
    setFeedback(null);
    try {
      await onDeleteResource?.(resourceId);
      setFeedback({ type: 'success', message: 'Resource removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to delete resource.' });
    }
  };

  const handleSaveSpotlight = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await onSaveSpotlight?.(spotlightForm);
      setFeedback({ type: 'success', message: 'Spotlight updated successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to update spotlight.' });
    }
  };

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Mentor hub</p>
          <h2 className="text-2xl font-semibold text-slate-900">Command centre for launches, rituals, and mentee journeys</h2>
          <p className="text-sm text-slate-600">
            Broadcast new programmes, track operational rituals, and keep your spotlight ready for Explorer promotions. Everything here syncs with automations powering mentee onboarding and marketing touchpoints.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-white px-4 py-3 text-sm text-accent shadow-sm">
          <ArrowPathIcon className="h-4 w-4" />
          <span>
            {updateSummary.total} broadcasts • {actions.length} rituals • {filteredResources.length} assets ready
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-emerald-800 shadow-sm">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <ClipboardDocumentListIcon className="h-4 w-4" /> Broadcast health
          </div>
          <p className="mt-3 text-2xl font-semibold text-emerald-900">{updateSummary.published} published</p>
          <p className="text-xs text-emerald-700">{updateSummary.scheduled} scheduled • {updateSummary.drafts} drafts</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-amber-800 shadow-sm">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <CheckCircleIcon className="h-4 w-4" /> Ritual momentum
          </div>
          <p className="mt-3 text-2xl font-semibold text-amber-900">{actions.length} tracked</p>
          <p className="text-xs text-amber-700">{overdueActions.length} overdue • {actions.filter((action) => action.status === 'Completed').length} completed</p>
        </div>
        <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-5 text-sm text-sky-800 shadow-sm">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <VideoCameraIcon className="h-4 w-4" /> Spotlight readiness
          </div>
          <p className="mt-3 text-2xl font-semibold text-sky-900">{spotlight?.videoUrl ? 'Video live' : 'Add video'}</p>
          <p className="text-xs text-sky-700">CTA: {spotlight?.ctaLabel ? spotlight.ctaLabel : 'Set call-to-action'}</p>
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

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-6">
          <form onSubmit={handleSubmitUpdate} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingUpdateId ? 'Update broadcast' : 'Create broadcast'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingUpdateId(null);
                  setUpdateForm(DEFAULT_UPDATE);
                }}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reset
              </button>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Title
              <input
                type="text"
                required
                value={updateForm.title}
                onChange={(event) => setUpdateForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Launch headline"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Summary
              <textarea
                required
                rows={3}
                value={updateForm.summary}
                onChange={(event) => setUpdateForm((current) => ({ ...current, summary: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Key outcomes, call-to-action, or nurture milestone"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Category
                <select
                  value={updateForm.category}
                  onChange={(event) => setUpdateForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {UPDATE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Status
                <select
                  value={updateForm.status}
                  onChange={(event) => setUpdateForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {UPDATE_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Publish link
                <input
                  type="url"
                  value={updateForm.link}
                  onChange={(event) => setUpdateForm((current) => ({ ...current, link: event.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Publish at
                <input
                  type="datetime-local"
                  value={updateForm.publishedAt}
                  onChange={(event) => setUpdateForm((current) => ({ ...current, publishedAt: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusCircleIcon className="h-4 w-4" />
              {saving ? 'Saving…' : editingUpdateId ? 'Update broadcast' : 'Publish broadcast'}
            </button>
          </form>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent broadcasts</h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <FunnelIcon className="h-3.5 w-3.5" />
                <select
                  value={updateStatusFilter}
                  onChange={(event) => setUpdateStatusFilter(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">All statuses</option>
                  {UPDATE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="space-y-4">
              {filteredUpdates.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  {updateStatusFilter === 'all'
                    ? 'No broadcasts yet. Share programme launches, testimonials, or rituals to keep mentees engaged.'
                    : 'No broadcasts match this status filter.'}
                </li>
              ) : (
                filteredUpdates.map((update) => (
                  <li key={update.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{update.title}</p>
                        <p className="text-xs text-slate-500">{update.category} • {formatDateTime(update.publishedAt)}</p>
                      </div>
                      <StatusBadge label={update.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{update.summary}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {update.link ? (
                        <a
                          href={update.link}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          View resource
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUpdateId(update.id);
                          setUpdateForm({
                            ...DEFAULT_UPDATE,
                            ...update,
                            publishedAt: formatForDateTimeInput(update.publishedAt),
                          });
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUpdate?.(update.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmitAction} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingActionId ? 'Update ritual' : 'Log ritual'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingActionId(null);
                  setActionForm(DEFAULT_ACTION);
                }}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Reset
              </button>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Ritual
              <input
                type="text"
                required
                value={actionForm.label}
                onChange={(event) => setActionForm((current) => ({ ...current, label: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Send async review pack"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Owner
                <input
                  type="text"
                  value={actionForm.owner}
                  onChange={(event) => setActionForm((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Jordan Mentor"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Due date
                <input
                  type="datetime-local"
                  value={actionForm.dueAt}
                  onChange={(event) => setActionForm((current) => ({ ...current, dueAt: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Status
                <select
                  value={actionForm.status}
                  onChange={(event) => setActionForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {ACTION_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Priority
                <select
                  value={actionForm.priority}
                  onChange={(event) => setActionForm((current) => ({ ...current, priority: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {ACTION_PRIORITIES.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <CheckCircleIcon className="h-4 w-4" />
              {saving ? 'Saving…' : editingActionId ? 'Update ritual' : 'Log ritual'}
            </button>
          </form>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational rituals</h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <FunnelIcon className="h-3.5 w-3.5" />
                <select
                  value={actionStatusFilter}
                  onChange={(event) => setActionStatusFilter(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="all">All rituals</option>
                  <option value="overdue">Overdue</option>
                  {ACTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                  {ACTION_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} priority
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ul className="space-y-4">
              {filteredActions.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  {actionStatusFilter === 'all'
                    ? 'No rituals logged yet. Capture mentorship actions so automations can follow up.'
                    : 'No rituals match this filter. Try adjusting the status or priority.'}
                </li>
              ) : (
                filteredActions.map((action) => (
                  <li key={action.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                        <p className="text-xs text-slate-500">
                          {action.owner ? `${action.owner} • ` : ''}
                          {action.dueAt ? formatDateTime(action.dueAt) : 'No deadline'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={action.priority} />
                        <StatusBadge label={action.status} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingActionId(action.id);
                          setActionForm({
                            ...DEFAULT_ACTION,
                            ...action,
                            dueAt: formatForDateTimeInput(action.dueAt),
                          });
                        }}
                        className="text-slate-500 hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAction?.(action.id)}
                        className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmitResource} className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {editingResourceId ? 'Update resource' : 'Add resource'}
              </h3>
              <button type="button" onClick={handleResetResource} className="text-xs font-semibold text-accent hover:underline">
                Reset
              </button>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Title
              <input
                type="text"
                required
                value={resourceForm.title}
                onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Mentor onboarding playbook"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Description
              <textarea
                rows={3}
                value={resourceForm.description}
                onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="What this resource unlocks for mentees"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Type
                <select
                  value={resourceForm.type}
                  onChange={(event) => setResourceForm((current) => ({ ...current, type: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Updated at
                <input
                  type="datetime-local"
                  value={resourceForm.updatedAt}
                  onChange={(event) => setResourceForm((current) => ({ ...current, updatedAt: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Resource link
              <input
                type="url"
                required
                value={resourceForm.link}
                onChange={(event) => setResourceForm((current) => ({ ...current, link: event.target.value }))}
                placeholder="https://"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Thumbnail image URL
                <input
                  type="url"
                  value={resourceForm.thumbnail}
                  onChange={(event) => setResourceForm((current) => ({ ...current, thumbnail: event.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Tags (comma separated)
                <input
                  type="text"
                  value={resourceForm.tags}
                  onChange={(event) => setResourceForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="Launch, Template, Deck"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusCircleIcon className="h-4 w-4" />
              {saving ? 'Saving…' : editingResourceId ? 'Update resource' : 'Save resource'}
            </button>
          </form>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resource library</h3>
                <p className="text-xs text-slate-500">Keep templates, onboarding packs, and decks accessible to mentees and automations.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <FunnelIcon className="h-3.5 w-3.5" />
                  <select
                    value={resourceTypeFilter}
                    onChange={(event) => setResourceTypeFilter(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                  >
                    <option value="all">All types</option>
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="search"
                  value={resourceSearch}
                  onChange={(event) => setResourceSearch(event.target.value)}
                  placeholder="Search assets"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="grid gap-4">
              {filteredResources.length ? (
                filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onEdit={handleEditResource}
                    onDelete={handleDeleteResource}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  {resourceSearch || resourceTypeFilter !== 'all'
                    ? 'No resources match these filters. Try adjusting the type or clearing the search.'
                    : 'No resources yet. Drop in Notion pages, welcome packs, or testimonial reels.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Automation blueprints</p>
            <h3 className="text-lg font-semibold text-slate-900">One-click playbooks to jumpstart updates</h3>
            <p className="text-sm text-slate-600">
              Load proven templates for launches, operations, and community moments. Customise copy before publishing to Explorer.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {HUB_BLUEPRINTS.map((blueprint) => (
            <article
              key={blueprint.id}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">{blueprint.label}</h4>
                <p className="text-xs text-slate-500">{blueprint.summary}</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>
                  <SparklesIcon className="mr-2 inline h-3.5 w-3.5 text-accent" /> Broadcast: {blueprint.update.title}
                </li>
                <li>
                  <CheckCircleIcon className="mr-2 inline h-3.5 w-3.5 text-emerald-500" /> Ritual: {blueprint.action.label}
                </li>
                <li>
                  <LinkIcon className="mr-2 inline h-3.5 w-3.5 text-sky-500" /> Asset: {blueprint.resource.title}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleApplyBlueprint(blueprint)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentDark"
              >
                <PlusCircleIcon className="h-3.5 w-3.5" /> Load blueprint
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Spotlight</p>
            <h3 className="text-lg font-semibold text-slate-900">Keep your Explorer reel fresh</h3>
            <p className="text-sm text-slate-600">Upload multimedia that powers the Explorer hero module and nurture automations.</p>
          </div>
          {spotlight.videoUrl ? (
            <a
              href={spotlight.videoUrl}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent"
            >
              <PlayCircleIcon className="h-4 w-4" />
              Preview
            </a>
          ) : null}
        </div>
          <form onSubmit={handleSaveSpotlight} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Title
              <input
                type="text"
                value={spotlightForm.title ?? ''}
                onChange={(event) => setSpotlightForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Mentor highlight reel"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Description
              <textarea
                rows={3}
                value={spotlightForm.description ?? ''}
                onChange={(event) => setSpotlightForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Hero messaging for Explorer spotlight"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Video URL
                <input
                  type="url"
                  value={spotlightForm.videoUrl ?? ''}
                  onChange={(event) => setSpotlightForm((current) => ({ ...current, videoUrl: event.target.value }))}
                  placeholder="https://"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                CTA label
                <input
                  type="text"
                  value={spotlightForm.ctaLabel ?? ''}
                  onChange={(event) => setSpotlightForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                  placeholder="Share spotlight"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              CTA link
              <input
                type="url"
                value={spotlightForm.ctaLink ?? ''}
                onChange={(event) => setSpotlightForm((current) => ({ ...current, ctaLink: event.target.value }))}
                placeholder="https://"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Thumbnail image URL
                <input
                  type="url"
                  value={spotlightForm.thumbnailUrl ?? ''}
                  onChange={(event) => setSpotlightForm((current) => ({ ...current, thumbnailUrl: event.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Background gradient
                <input
                  type="text"
                  value={spotlightForm.backgroundColor ?? ''}
                  onChange={(event) => setSpotlightForm((current) => ({ ...current, backgroundColor: event.target.value }))}
                  placeholder="from-slate-900 via-emerald-600 to-slate-800"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlayCircleIcon className="h-4 w-4" />
              {saving ? 'Saving…' : 'Update spotlight'}
            </button>
          </form>
          {spotlight.videoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80">
              <iframe
                title="Mentor spotlight video"
                src={spotlight.videoUrl}
                className="h-56 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {spotlight.thumbnailUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <img src={spotlight.thumbnailUrl} alt="Spotlight thumbnail" className="h-48 w-full object-cover" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

MentorHubSection.propTypes = {
  hub: PropTypes.shape({
    updates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        summary: PropTypes.string,
        category: PropTypes.string,
        link: PropTypes.string,
        publishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
      }),
    ),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        owner: PropTypes.string,
        dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        priority: PropTypes.string,
      }),
    ),
    spotlight: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      videoUrl: PropTypes.string,
      ctaLabel: PropTypes.string,
      ctaLink: PropTypes.string,
      thumbnailUrl: PropTypes.string,
      backgroundColor: PropTypes.string,
    }),
    resources: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
        description: PropTypes.string,
        updatedAt: PropTypes.string,
        thumbnail: PropTypes.string,
        tags: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
      }),
    ),
  }).isRequired,
  saving: PropTypes.bool,
  onCreateUpdate: PropTypes.func,
  onUpdateUpdate: PropTypes.func,
  onDeleteUpdate: PropTypes.func,
  onCreateAction: PropTypes.func,
  onUpdateAction: PropTypes.func,
  onDeleteAction: PropTypes.func,
  onCreateResource: PropTypes.func,
  onUpdateResource: PropTypes.func,
  onDeleteResource: PropTypes.func,
  onSaveSpotlight: PropTypes.func,
};

MentorHubSection.defaultProps = {
  saving: false,
  onCreateUpdate: undefined,
  onUpdateUpdate: undefined,
  onDeleteUpdate: undefined,
  onCreateAction: undefined,
  onUpdateAction: undefined,
  onDeleteAction: undefined,
  onCreateResource: undefined,
  onUpdateResource: undefined,
  onDeleteResource: undefined,
  onSaveSpotlight: undefined,
};
