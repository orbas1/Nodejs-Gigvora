import { useMemo, useState } from 'react';

function buildMentorLabel(mentor) {
  if (!mentor) return '';
  const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(' ') || `Mentor #${mentor.id}`;
  const headline = mentor.profile?.headline || mentor.profile?.missionStatement || null;
  return headline ? `${name} — ${headline}` : name;
}

function formatSession(session) {
  if (!session) return '';
  const mentorName = session.mentor ? buildMentorLabel(session.mentor) : `Mentor #${session.mentorId}`;
  return `${session.topic} • ${mentorName}`;
}

export default function MentorReviewForm({
  sessions = [],
  mentors = [],
  onSubmit,
  onCancel,
  initialValues = {},
  submitting = false,
}) {
  const [formState, setFormState] = useState(() => ({
    mentorId: initialValues.mentorId ?? (initialValues.session?.mentorId ?? ''),
    sessionId: initialValues.sessionId ?? '',
    rating: initialValues.rating ?? 5,
    wouldRecommend: initialValues.wouldRecommend ?? true,
    headline: initialValues.headline ?? '',
    feedback: initialValues.feedback ?? '',
    praiseHighlights: Array.isArray(initialValues.praiseHighlights) ? initialValues.praiseHighlights.join(', ') : '',
    improvementAreas: Array.isArray(initialValues.improvementAreas) ? initialValues.improvementAreas.join(', ') : '',
    isPublic: initialValues.isPublic ?? false,
  }));

  const mentorOptions = useMemo(() => {
    const map = new Map();
    mentors.concat(sessions.map((session) => session.mentor)).forEach((mentor) => {
      if (mentor && mentor.id && !map.has(mentor.id)) {
        map.set(mentor.id, mentor);
      }
    });
    return Array.from(map.values());
  }, [mentors, sessions]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!onSubmit) return;
    const payload = {
      mentorId: Number(formState.mentorId),
      sessionId: formState.sessionId ? Number(formState.sessionId) : undefined,
      rating: Number(formState.rating),
      wouldRecommend: Boolean(formState.wouldRecommend),
      headline: formState.headline || undefined,
      feedback: formState.feedback || undefined,
      praiseHighlights: formState.praiseHighlights
        ? formState.praiseHighlights.split(',').map((item) => item.trim()).filter(Boolean)
        : undefined,
      improvementAreas: formState.improvementAreas
        ? formState.improvementAreas.split(',').map((item) => item.trim()).filter(Boolean)
        : undefined,
      isPublic: Boolean(formState.isPublic),
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Session (optional)</span>
        <select
          name="sessionId"
          value={formState.sessionId}
          onChange={(event) => {
            handleChange(event);
            if (event.target.value) {
              const session = sessions.find((item) => String(item.id) === event.target.value);
              if (session?.mentorId) {
                setFormState((prev) => ({ ...prev, mentorId: session.mentorId }));
              }
            }
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        >
          <option value="">Review a mentor without linking a session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatSession(session)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Mentor</span>
        <select
          name="mentorId"
          required
          value={formState.mentorId}
          onChange={handleChange}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        >
          <option value="">Select mentor…</option>
          {mentorOptions.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {buildMentorLabel(mentor)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Rating</span>
          <input
            type="number"
            name="rating"
            min="1"
            max="5"
            value={formState.rating}
            onChange={handleChange}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
            required
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="wouldRecommend"
            checked={formState.wouldRecommend}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span className="font-medium text-slate-700">Would recommend this mentor</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            checked={formState.isPublic}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span className="font-medium text-slate-700">Share this review with the mentor</span>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Headline</span>
        <input
          name="headline"
          value={formState.headline}
          onChange={handleChange}
          placeholder="e.g. Exceptional interview prep partner"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-700">Detailed feedback</span>
        <textarea
          name="feedback"
          value={formState.feedback}
          onChange={handleChange}
          rows="4"
          placeholder="Capture what worked well and what you'd adjust for next time."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Highlights (comma separated)</span>
          <input
            name="praiseHighlights"
            value={formState.praiseHighlights}
            onChange={handleChange}
            placeholder="Timely feedback, Deep industry knowledge"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700">Improvement areas (comma separated)</span>
          <input
            name="improvementAreas"
            value={formState.improvementAreas}
            onChange={handleChange}
            placeholder="More role-specific examples"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            disabled={submitting}
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  );
}
