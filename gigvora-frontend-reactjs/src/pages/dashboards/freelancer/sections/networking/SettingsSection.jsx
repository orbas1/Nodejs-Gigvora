import { useEffect, useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';

const DEFAULT_CARD = {
  title: '',
  headline: '',
  bio: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  linkedinUrl: '',
  calendlyUrl: '',
  portfolioUrl: '',
  spotlightVideoUrl: '',
  coverImageUrl: '',
  videoTranscript: '',
  attachments: [],
};

function AttachmentList({ attachments, onRemove }) {
  if (!attachments?.length) {
    return (
      <p className="text-sm text-slate-500">No attachments yet. Add your case studies, decks, or PDF brochures.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {attachments.map((attachment, index) => (
        <li
          key={`${attachment.url}-${index}`}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{attachment.name}</p>
            <p className="text-xs text-slate-500">{attachment.url}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-red-500"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function SettingsSection({ card, saving, onSave, onRefresh }) {
  const initialCard = useMemo(() => ({ ...DEFAULT_CARD, ...(card ?? {}), coverImageUrl: card?.metadata?.coverImageUrl ?? '' }), [card]);
  const [form, setForm] = useState(initialCard);
  const [attachmentDraft, setAttachmentDraft] = useState({ name: '', url: '' });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setForm(initialCard);
  }, [initialCard]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await onSave?.({
        ...form,
        attachments: form.attachments,
        coverImageUrl: form.coverImageUrl,
        videoTranscript: form.videoTranscript,
      });
      setFeedback({ type: 'success', message: 'Workspace card updated.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message ?? 'Unable to save workspace settings.' });
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentDraft.url) {
      setFeedback({ type: 'error', message: 'Attachment URL is required.' });
      return;
    }
    setForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments ?? []), { name: attachmentDraft.name || attachmentDraft.url, url: attachmentDraft.url }],
    }));
    setAttachmentDraft({ name: '', url: '' });
  };

  const handleRemoveAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <SectionShell
      id="network-settings"
      title="Workspace card"
      description="Control what clients see when they preview your networking profile, business card, and booking details."
      actions={[
        onRefresh ? (
          <button
            key="refresh"
            type="button"
            onClick={() => onRefresh?.()}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Refresh
          </button>
        ) : null,
      ].filter(Boolean)}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
              <input
                value={form.title}
                onChange={handleChange('title')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="Freelance product strategist"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</span>
              <input
                value={form.headline}
                onChange={handleChange('headline')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="Designing AI services for global brands"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</span>
            <textarea
              value={form.bio}
              onChange={handleChange('bio')}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
              placeholder="Share your focus, engagements, and proof points."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact email</span>
              <input
                type="email"
                value={form.contactEmail}
                onChange={handleChange('contactEmail')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="you@gigvora.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
              <input
                value={form.contactPhone}
                onChange={handleChange('contactPhone')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="+44 20 1234 5678"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</span>
              <input
                value={form.websiteUrl}
                onChange={handleChange('websiteUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">LinkedIn</span>
              <input
                value={form.linkedinUrl}
                onChange={handleChange('linkedinUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://linkedin.com/in/you"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calendly</span>
              <input
                value={form.calendlyUrl}
                onChange={handleChange('calendlyUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://calendly.com/you"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio</span>
              <input
                value={form.portfolioUrl}
                onChange={handleChange('portfolioUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://dribbble.com/you"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover image URL</span>
              <input
                value={form.coverImageUrl}
                onChange={handleChange('coverImageUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spotlight video</span>
              <input
                value={form.spotlightVideoUrl}
                onChange={handleChange('spotlightVideoUrl')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                placeholder="https://youtu.be/..."
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Video transcript</span>
            <textarea
              value={form.videoTranscript}
              onChange={handleChange('videoTranscript')}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
              placeholder="Optional transcript for accessibility."
            />
          </label>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachment name</span>
                  <input
                    value={attachmentDraft.name}
                    onChange={(event) => setAttachmentDraft((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                    placeholder="Pitch deck"
                  />
                </label>
                <label className="flex-[2] space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachment URL</span>
                  <input
                    value={attachmentDraft.url}
                    onChange={(event) => setAttachmentDraft((prev) => ({ ...prev, url: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-blue-400 focus:outline-none"
                    placeholder="https://"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="h-10 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Add
                </button>
              </div>
              <AttachmentList attachments={form.attachments} onRemove={handleRemoveAttachment} />
            </div>
          </div>

          {feedback ? (
            <p
              className={`text-sm ${feedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {feedback?.type === 'success' ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Saved</span>
            ) : null}
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Preview</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{form.title || 'Your workspace card'}</h3>
            <p className="mt-2 text-sm text-slate-600">{form.headline || 'Share a focused headline to stand out.'}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{form.bio || 'Tell clients about your most relevant engagements, industries, and outcomes.'}</p>
              <p className="flex flex-wrap gap-3 text-xs text-slate-500">
                {form.contactEmail ? <span className="rounded-full bg-slate-100 px-3 py-1">{form.contactEmail}</span> : null}
                {form.contactPhone ? <span className="rounded-full bg-slate-100 px-3 py-1">{form.contactPhone}</span> : null}
                {form.websiteUrl ? <span className="rounded-full bg-slate-100 px-3 py-1">Website</span> : null}
                {form.linkedinUrl ? <span className="rounded-full bg-slate-100 px-3 py-1">LinkedIn</span> : null}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Attachments</h3>
            <AttachmentList attachments={form.attachments} onRemove={handleRemoveAttachment} />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
