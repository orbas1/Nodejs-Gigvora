import { useEffect, useMemo, useState } from 'react';

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

function buildDefaultForm(defaults) {
  return {
    mentorId: defaults?.mentorId ?? '',
    menteeId: defaults?.menteeId ?? '',
    serviceLineId: defaults?.serviceLineId ?? '',
    adminOwnerId: defaults?.adminOwnerId ?? '',
    topic: defaults?.topic ?? '',
    agenda: defaults?.agenda ?? '',
    scheduledAt: defaults?.scheduledAt ?? '',
    durationMinutes: defaults?.durationMinutes ?? 60,
    meetingUrl: defaults?.meetingUrl ?? '',
    meetingProvider: defaults?.meetingProvider ?? '',
    notesSummary: defaults?.notesSummary ?? '',
    followUpAt: defaults?.followUpAt ?? '',
    resourceLinks: defaults?.resourceLinks?.length ? [...defaults.resourceLinks] : [EMPTY_RESOURCE],
    initialNote: '',
  };
}

export default function MentoringSessionForm({ catalog, defaults, onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState(() => buildDefaultForm(defaults));
  const mentors = useMemo(() => catalog?.mentors ?? [], [catalog?.mentors]);
  const mentees = useMemo(() => catalog?.mentees ?? [], [catalog?.mentees]);
  const owners = useMemo(() => catalog?.owners ?? [], [catalog?.owners]);
  const serviceLines = useMemo(() => catalog?.serviceLines ?? [], [catalog?.serviceLines]);
  const meetingProviderOptions = useMemo(
    () => normalizeMeetingProviders(catalog?.meetingProviders),
    [catalog?.meetingProviders],
  );

  useEffect(() => {
    setForm(buildDefaultForm(defaults));
  }, [defaults]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleResourceChange = (index, field, value) => {
    setForm((current) => {
      const next = current.resourceLinks.map((resource, idx) => (idx === index ? { ...resource, [field]: value } : resource));
      return { ...current, resourceLinks: next };
    });
  };

  const addResource = () => {
    setForm((current) => ({ ...current, resourceLinks: [...current.resourceLinks, { ...EMPTY_RESOURCE }] }));
  };

  const removeResource = (index) => {
    setForm((current) => ({
      ...current,
      resourceLinks: current.resourceLinks.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      mentorId: form.mentorId ? Number(form.mentorId) : undefined,
      menteeId: form.menteeId ? Number(form.menteeId) : undefined,
      serviceLineId: form.serviceLineId ? Number(form.serviceLineId) : undefined,
      adminOwnerId: form.adminOwnerId ? Number(form.adminOwnerId) : undefined,
      topic: form.topic,
      agenda: form.agenda || undefined,
      scheduledAt: form.scheduledAt,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      meetingUrl: form.meetingUrl || undefined,
      meetingProvider: form.meetingProvider || undefined,
      notesSummary: form.notesSummary || undefined,
      followUpAt: form.followUpAt || undefined,
      resourceLinks: form.resourceLinks
        .map((resource) => ({
          label: resource.label?.trim() || undefined,
          url: resource.url?.trim(),
          type: resource.type?.trim() || undefined,
        }))
        .filter((resource) => resource.url),
      sessionNotes: form.initialNote
        ? [
            {
              body: form.initialNote,
              visibility: 'internal',
            },
          ]
        : undefined,
    };

    if (!onSubmit) {
      setForm(buildDefaultForm(defaults));
      return;
    }

    try {
      await onSubmit(payload);
      setForm(buildDefaultForm(defaults));
    } catch (error) {
      // allow parent to surface submission errors without losing the current draft
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentor *</span>
          <select
            name="mentorId"
            value={form.mentorId}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">Select mentor</option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.firstName} {mentor.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentee *</span>
          <select
            name="menteeId"
            value={form.menteeId}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">Select mentee</option>
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {mentee.firstName} {mentee.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service line</span>
          <select
            name="serviceLineId"
            value={form.serviceLineId}
            onChange={handleInputChange}
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
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
          <select
            name="adminOwnerId"
            value={form.adminOwnerId}
            onChange={handleInputChange}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic *</span>
          <input
            name="topic"
            value={form.topic}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Session focus"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule *</span>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={form.scheduledAt}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (mins)</span>
          <input
            type="number"
            name="durationMinutes"
            value={form.durationMinutes}
            onChange={handleInputChange}
            min="15"
            max="240"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up</span>
          <input
            type="date"
            name="followUpAt"
            value={form.followUpAt}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agenda</span>
        <textarea
          name="agenda"
          value={form.agenda}
          onChange={handleInputChange}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          rows={3}
          placeholder="Talking points"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</span>
          <select
            name="meetingProvider"
            value={form.meetingProvider}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select</option>
            {meetingProviderOptions.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
            {!meetingProviderOptions.find((option) => option.value === form.meetingProvider) &&
            form.meetingProvider ? (
              <option value={form.meetingProvider}>{form.meetingProvider}</option>
            ) : null}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting URL</span>
          <input
            type="url"
            name="meetingUrl"
            value={form.meetingUrl}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="https://meeting-link"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Internal briefing</span>
          <textarea
            name="notesSummary"
            value={form.notesSummary}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            placeholder="Coordinator notes"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add an internal note</span>
          <textarea
            name="initialNote"
            value={form.initialNote}
            onChange={handleInputChange}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            placeholder="Share context for mentors or onboarding leads"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Resources</p>
          <button
            type="button"
            onClick={addResource}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
          >
            Add
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.resourceLinks.map((resource, index) => (
            <div key={`resource-${index}`} className="grid gap-2 md:grid-cols-[2fr,3fr,auto]">
              <input
                type="text"
                value={resource.label}
                onChange={(event) => handleResourceChange(index, 'label', event.target.value)}
                placeholder="Label"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="url"
                value={resource.url}
                onChange={(event) => handleResourceChange(index, 'url', event.target.value)}
                placeholder="https://..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required={index === 0}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={resource.type ?? ''}
                  onChange={(event) => handleResourceChange(index, 'type', event.target.value)}
                  placeholder="Type"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => removeResource(index)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300 disabled:opacity-40"
                  disabled={form.resourceLinks.length <= 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save session'}
        </button>
      </div>
    </form>
  );
}
