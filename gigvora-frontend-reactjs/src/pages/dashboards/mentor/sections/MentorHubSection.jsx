import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, CheckCircleIcon, LinkIcon, PlayCircleIcon, PlusCircleIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const UPDATE_CATEGORIES = ['Launches', 'Content', 'Operations', 'Testimonials', 'Growth'];
const UPDATE_STATUSES = ['Draft', 'Scheduled', 'Published'];
const ACTION_STATUSES = ['Not started', 'In progress', 'Blocked', 'Completed'];
const ACTION_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

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

function ResourceCard({ resource }) {
  return (
    <a
      href={resource.link}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{resource.title}</p>
        <StatusBadge label={resource.type} />
      </div>
      <p className="text-xs text-slate-500">Updated {resource.updatedAt ? format(new Date(resource.updatedAt), 'dd MMM yyyy') : 'recently'}</p>
    </a>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    updatedAt: PropTypes.string,
  }).isRequired,
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
  onSaveSpotlight,
}) {
  const [updateForm, setUpdateForm] = useState(DEFAULT_UPDATE);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [actionForm, setActionForm] = useState(DEFAULT_ACTION);
  const [editingActionId, setEditingActionId] = useState(null);
  const [spotlightForm, setSpotlightForm] = useState(() => hub?.spotlight ?? {});
  const [feedback, setFeedback] = useState(null);

  const updates = hub?.updates ?? [];
  const actions = hub?.actions ?? [];
  const resources = hub?.resources ?? [];

  const spotlight = useMemo(() => hub?.spotlight ?? {}, [hub]);

  const handleSubmitUpdate = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = { ...updateForm };
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
    const payload = { ...actionForm };
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
          <span>{updates.length} live updates • {actions.length} rituals in motion</span>
        </div>
      </header>

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

      <div className="grid gap-8 lg:grid-cols-2">
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent broadcasts</h3>
            <ul className="space-y-4">
              {updates.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No broadcasts yet. Share programme launches, testimonials, or rituals to keep mentees engaged.
                </li>
              ) : (
                updates.map((update) => (
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
                          setUpdateForm({ ...DEFAULT_UPDATE, ...update });
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational rituals</h3>
            <ul className="space-y-4">
              {actions.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No rituals logged yet. Capture mentorship actions so automations can follow up.
                </li>
              ) : (
                actions.map((action) => (
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
                          setActionForm({ ...DEFAULT_ACTION, ...action });
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
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
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
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resource library</h3>
          <p className="text-sm text-slate-600">
            Keep templates, onboarding packs, and decks accessible to mentees and automations.
          </p>
          <div className="grid gap-4">
            {resources.length ? resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No resources yet. Drop in Notion pages, welcome packs, or testimonial reels.
              </div>
            )}
          </div>
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
    }),
    resources: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired,
        updatedAt: PropTypes.string,
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
  onSaveSpotlight: undefined,
};
