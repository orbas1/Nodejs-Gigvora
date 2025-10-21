import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

const EMPTY_RESOURCE = { label: '', url: '', type: '' };

function normalizeMeetingProviders(providers) {
  if (!Array.isArray(providers)) {
    return [];
  }

  return providers
    .map((provider) => {
      if (!provider) {
        return null;
      }

      if (typeof provider === 'string') {
        const trimmed = provider.trim();
        if (!trimmed) {
          return null;
        }
        return { value: trimmed, label: trimmed };
      }

      if (typeof provider === 'object') {
        const value =
          provider.value ?? provider.id ?? provider.slug ?? provider.name ?? provider.label;
        if (!value) {
          return null;
        }
        const label = provider.label ?? provider.name ?? provider.title ?? String(value);
        return { value: String(value), label };
      }

      return null;
    })
    .filter(Boolean);
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM d, yyyy p');
  } catch (error) {
    return '—';
  }
}

function StatusBadge({ status }) {
  const normalized = `${status ?? ''}`.toLowerCase();
  const styles = {
    scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
    requested: 'bg-amber-100 text-amber-700 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {normalized.replace(/_/g, ' ') || 'unknown'}
    </span>
  );
}

function buildEditForm(session) {
  if (!session) {
    return null;
  }
  return {
    topic: session.topic ?? '',
    agenda: session.agenda ?? '',
    status: session.status ?? 'scheduled',
    scheduledAt: session.scheduledAt ? session.scheduledAt.slice(0, 16) : '',
    durationMinutes: session.durationMinutes ?? '',
    meetingProvider: session.meetingProvider ?? '',
    meetingUrl: session.meetingUrl ?? '',
    recordingUrl: session.recordingUrl ?? '',
    notesSummary: session.notesSummary ?? '',
    followUpAt: session.followUpAt ? session.followUpAt.slice(0, 10) : '',
    adminOwnerId: session.adminOwnerId ?? '',
    serviceLineId: session.serviceLineId ?? '',
    feedbackRating: session.feedbackRating ?? '',
    feedbackSummary: session.feedbackSummary ?? '',
    cancellationReason: session.cancellationReason ?? '',
    resourceLinks: session.resourceLinks?.length ? session.resourceLinks.map((link) => ({ ...EMPTY_RESOURCE, ...link })) : [
      { ...EMPTY_RESOURCE },
    ],
  };
}

export default function MentoringSessionDetailPanel({
  session,
  open,
  catalog,
  onClose,
  onUpdateSession,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCreateAction,
  onUpdateAction,
  onDeleteAction,
  updating,
}) {
  const [editForm, setEditForm] = useState(() => buildEditForm(session));
  const [resourceDrafts, setResourceDrafts] = useState(editForm?.resourceLinks ?? [EMPTY_RESOURCE]);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteEdits, setNoteEdits] = useState({});
  const [actionDraft, setActionDraft] = useState({ title: '', assigneeId: '', priority: 'normal', dueAt: '' });

  useEffect(() => {
    setEditForm(buildEditForm(session));
    setResourceDrafts(session?.resourceLinks?.length ? session.resourceLinks.map((link) => ({ ...EMPTY_RESOURCE, ...link })) : [
      { ...EMPTY_RESOURCE },
    ]);
    setNoteDraft('');
    setEditingNoteId(null);
    setNoteEdits({});
    setActionDraft({ title: '', assigneeId: '', priority: 'normal', dueAt: '' });
  }, [session?.id]);

  const mentors = useMemo(() => catalog?.mentors ?? [], [catalog?.mentors]);
  const mentees = useMemo(() => catalog?.mentees ?? [], [catalog?.mentees]);
  const owners = useMemo(() => catalog?.owners ?? [], [catalog?.owners]);
  const serviceLines = useMemo(() => catalog?.serviceLines ?? [], [catalog?.serviceLines]);
  const statuses = catalog?.statuses ?? [];
  const meetingProviderOptions = useMemo(
    () => normalizeMeetingProviders(catalog?.meetingProviders),
    [catalog?.meetingProviders],
  );
  const actionStatuses = catalog?.actionStatuses ?? [];
  const actionPriorities = catalog?.actionPriorities ?? [];

  if (!session) {
    return null;
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleResourceChange = (index, field, value) => {
    setResourceDrafts((current) => current.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry)));
  };

  const addResource = () => {
    setResourceDrafts((current) => [...current, { ...EMPTY_RESOURCE }]);
  };

  const removeResource = (index) => {
    setResourceDrafts((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSave = (event) => {
    event.preventDefault();
    const payload = {
      topic: editForm.topic,
      agenda: editForm.agenda || undefined,
      status: editForm.status,
      scheduledAt: editForm.scheduledAt || undefined,
      durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : undefined,
      meetingProvider: editForm.meetingProvider || undefined,
      meetingUrl: editForm.meetingUrl || undefined,
      recordingUrl: editForm.recordingUrl || undefined,
      notesSummary: editForm.notesSummary || undefined,
      followUpAt: editForm.followUpAt || undefined,
      adminOwnerId: editForm.adminOwnerId ? Number(editForm.adminOwnerId) : undefined,
      serviceLineId: editForm.serviceLineId ? Number(editForm.serviceLineId) : undefined,
      feedbackRating: editForm.feedbackRating !== '' ? Number(editForm.feedbackRating) : undefined,
      feedbackSummary: editForm.feedbackSummary || undefined,
      cancellationReason: editForm.cancellationReason || undefined,
      resourceLinks: resourceDrafts
        .map((resource) => ({
          label: resource.label?.trim() || undefined,
          url: resource.url?.trim(),
          type: resource.type?.trim() || undefined,
        }))
        .filter((resource) => resource.url),
    };
    onUpdateSession?.(session.id, payload);
  };

  const handleNoteSubmit = async (event) => {
    event.preventDefault();
    if (!noteDraft.trim()) {
      return;
    }
    if (!onCreateNote) {
      setNoteDraft('');
      return;
    }
    try {
      await onCreateNote(session.id, { body: noteDraft, visibility: 'internal' });
      setNoteDraft('');
    } catch (error) {
      // keep current draft for retry on failure
    }
  };

  const handleNoteEdit = (noteId, body) => {
    setNoteEdits((current) => ({ ...current, [noteId]: body }));
  };

  const commitNoteEdit = async (noteId) => {
    const body = noteEdits[noteId];
    if (!body?.trim()) {
      return;
    }
    if (!onUpdateNote) {
      setEditingNoteId(null);
      return;
    }
    try {
      await onUpdateNote(session.id, noteId, { body, visibility: 'internal' });
      setEditingNoteId(null);
    } catch (error) {
      // keep editing state so the user can retry
    }
  };

  const handleActionSubmit = async (event) => {
    event.preventDefault();
    if (!actionDraft.title.trim()) {
      return;
    }
    if (!onCreateAction) {
      setActionDraft({ title: '', assigneeId: '', priority: 'normal', dueAt: '' });
      return;
    }
    try {
      await onCreateAction(session.id, {
        title: actionDraft.title,
        assigneeId: actionDraft.assigneeId ? Number(actionDraft.assigneeId) : undefined,
        priority: actionDraft.priority || 'normal',
        dueAt: actionDraft.dueAt || undefined,
      });
      setActionDraft({ title: '', assigneeId: '', priority: 'normal', dueAt: '' });
    } catch (error) {
      // retain the draft if the action creation fails
    }
  };

  const handleActionUpdate = (actionId, updates) => {
    onUpdateAction?.(session.id, actionId, updates);
  };

  const handleActionDelete = (actionId) => {
    onDeleteAction?.(session.id, actionId);
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-full max-w-3xl transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session #{session.id}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{session.topic}</h2>
            <p className="text-sm text-slate-600">{session.mentor ? `${session.mentor.firstName} ${session.mentor.lastName}` : 'Unknown mentor'} · {formatDate(session.scheduledAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSave} className="space-y-6">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Session summary</h3>
                <StatusBadge status={session.status} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</span>
                  <input
                    type="text"
                    name="topic"
                    value={editForm?.topic ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Session focus"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    name="status"
                    value={editForm?.status ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {statuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</span>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={editForm?.scheduledAt ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (mins)</span>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={editForm?.durationMinutes ?? ''}
                    onChange={handleFieldChange}
                    min="15"
                    max="240"
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up date</span>
                  <input
                    type="date"
                    name="followUpAt"
                    value={editForm?.followUpAt ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin owner</span>
                  <select
                    name="adminOwnerId"
                    value={editForm?.adminOwnerId ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Unassigned</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.firstName} {owner.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service line</span>
                  <select
                    name="serviceLineId"
                    value={editForm?.serviceLineId ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">General</option>
                    {serviceLines.map((line) => (
                      <option key={line.id ?? line.slug} value={line.id ?? ''}>
                        {line.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</span>
                <textarea
                  name="agenda"
                  value={editForm?.agenda ?? ''}
                  onChange={handleFieldChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={3}
                  placeholder="Talking points or preparation guidance"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Logistics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting provider</span>
                  <select
                    name="meetingProvider"
                    value={editForm?.meetingProvider ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select provider</option>
                    {meetingProviderOptions.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                    {!meetingProviderOptions.find((option) => option.value === editForm?.meetingProvider) &&
                    editForm?.meetingProvider ? (
                      <option value={editForm.meetingProvider}>{editForm.meetingProvider}</option>
                    ) : null}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting URL</span>
                  <input
                    type="url"
                    name="meetingUrl"
                    value={editForm?.meetingUrl ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="https://..."
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recording link</span>
                  <input
                    type="url"
                    name="recordingUrl"
                    value={editForm?.recordingUrl ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="https://..."
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Internal notes</span>
                  <textarea
                    name="notesSummary"
                    value={editForm?.notesSummary ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    rows={2}
                    placeholder="Coordinator notes or risk flags"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Outcome tracking</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback rating</span>
                  <input
                    type="number"
                    name="feedbackRating"
                    value={editForm?.feedbackRating ?? ''}
                    onChange={handleFieldChange}
                    min="0"
                    max="5"
                    step="0.1"
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cancellation reason</span>
                  <textarea
                    name="cancellationReason"
                    value={editForm?.cancellationReason ?? ''}
                    onChange={handleFieldChange}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    rows={2}
                    placeholder="If cancelled, document why"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback summary</span>
                <textarea
                  name="feedbackSummary"
                  value={editForm?.feedbackSummary ?? ''}
                  onChange={handleFieldChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={3}
                  placeholder="Highlights, wins, or escalations from the session"
                />
              </label>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Resource links</h3>
                <button
                  type="button"
                  onClick={addResource}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                >
                  Add resource
                </button>
              </div>
              <div className="space-y-3">
                {resourceDrafts.map((resource, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[1.2fr_2fr_1fr_auto]">
                    <input
                      value={resource.label ?? ''}
                      onChange={(event) => handleResourceChange(index, 'label', event.target.value)}
                      placeholder="Label"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={resource.url ?? ''}
                      onChange={(event) => handleResourceChange(index, 'url', event.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      value={resource.type ?? ''}
                      onChange={(event) => handleResourceChange(index, 'type', event.target.value)}
                      placeholder="Type"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300"
                      disabled={resourceDrafts.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center rounded-full border border-blue-400 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          <section className="mt-8 space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
                <p className="text-sm text-slate-600">Capture discovery insights, red flags, or next steps after the session.</p>
              </div>
            </header>
            <form onSubmit={handleNoteSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add an internal note</span>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={3}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Document feedback, escalations, or commitments."
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                >
                  Post note
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {session.sessionNotes?.length ? (
                session.sessionNotes.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  const draftValue = noteEdits[note.id] ?? note.body;
                  return (
                    <article key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <header className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'System note'}
                          </span>
                          <span className="text-xs text-slate-500">{formatDate(note.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(isEditing ? null : note.id);
                              setNoteEdits((current) => ({ ...current, [note.id]: note.body }));
                            }}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote?.(session.id, note.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      </header>
                      <div className="mt-3 text-sm text-slate-700">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={draftValue}
                              onChange={(event) => handleNoteEdit(note.id, event.target.value)}
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => commitNoteEdit(note.id)}
                                className="rounded-full border border-blue-300 bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{note.body}</p>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                  No notes yet. Add the first one to document coaching insights and client signals.
                </p>
              )}
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Action items</h3>
                <p className="text-sm text-slate-600">Assign follow-ups to mentors, mentees, or admins and keep the cadence tight.</p>
              </div>
            </header>
            <form onSubmit={handleActionSubmit} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                  <input
                    value={actionDraft.title}
                    onChange={(event) => setActionDraft((current) => ({ ...current, title: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Send recap deck"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</span>
                  <select
                    value={actionDraft.assigneeId}
                    onChange={(event) => setActionDraft((current) => ({ ...current, assigneeId: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Unassigned</option>
                    {[...mentors, ...mentees, ...owners].map((user) => (
                      <option key={`assignee-${user.id}`} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</span>
                  <select
                    value={actionDraft.priority}
                    onChange={(event) => setActionDraft((current) => ({ ...current, priority: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {actionPriorities.map((priority) => (
                      <option key={priority.value ?? priority} value={priority.value ?? priority}>
                        {priority.label ?? priority}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Due date</span>
                  <input
                    type="date"
                    value={actionDraft.dueAt}
                    onChange={(event) => setActionDraft((current) => ({ ...current, dueAt: event.target.value }))}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                >
                  Add action
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {session.actionItems?.length ? (
                session.actionItems.map((action) => (
                  <article key={action.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                        <p className="text-xs text-slate-500">
                          {action.assignee ? `${action.assignee.firstName} ${action.assignee.lastName}` : 'Unassigned'} ·{' '}
                          {action.dueAt ? `Due ${formatDate(action.dueAt)}` : 'No due date'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={action.status}
                          onChange={(event) => handleActionUpdate(action.id, { status: event.target.value })}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                        >
                          {actionStatuses.map((statusOption) => (
                            <option key={statusOption.value ?? statusOption} value={statusOption.value ?? statusOption}>
                              {statusOption.label ?? statusOption}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleActionDelete(action.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    </header>
                    {action.description ? (
                      <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                  No action items assigned. Create a follow-up to keep mentors and mentees accountable.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}
