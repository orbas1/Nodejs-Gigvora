import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import { createStoryBlock, uploadStoryBlockVersion } from '../../services/coverLetters.js';

function StatusBanner({ tone, message, onDismiss }) {
  const toneClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-accentSoft text-accent border-accent/40',
  };
  return (
    <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone] || toneClasses.info}`}>
      <p className="font-medium">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

StatusBanner.propTypes = {
  tone: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  message: PropTypes.string.isRequired,
  onDismiss: PropTypes.func,
};

function TextInput({ multiline = false, ...props }) {
  const className =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100';
  if (multiline) {
    return <textarea {...props} className={`${className} min-h-[120px] resize-y`} />;
  }
  return <input {...props} className={className} />;
}

TextInput.propTypes = {
  multiline: PropTypes.bool,
};

function FieldGroup({ label, description, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {description ? <span className="text-xs text-slate-500">{description}</span> : null}
      {children}
    </label>
  );
}

FieldGroup.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default function StoryBlockWorkshop({ userId, storyBlocks, onSuccess }) {
  const [createState, setCreateState] = useState({
    title: '',
    tone: '',
    summary: '',
    content: '',
    impact: '',
    tags: '',
  });
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  const [updateState, setUpdateState] = useState({
    blockId: '',
    title: '',
    tone: '',
    summary: '',
    content: '',
    impact: '',
  });
  const [updating, setUpdating] = useState(false);

  const createTags = useMemo(() => {
    return createState.tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }, [createState.tags]);

  const handleResetCreate = useCallback(() => {
    setCreateState({ title: '', tone: '', summary: '', content: '', impact: '', tags: '' });
  }, []);

  const handleResetUpdate = useCallback(() => {
    setUpdateState({ blockId: '', title: '', tone: '', summary: '', content: '', impact: '' });
  }, []);

  const handleSelectBlock = useCallback(
    (blockId) => {
      setUpdateState((prev) => {
        if (!blockId) {
          return { blockId: '', title: '', tone: '', summary: '', content: '', impact: '' };
        }
        const block = storyBlocks.find((item) => `${item.id}` === `${blockId}`);
        if (!block) {
          return { blockId: '', title: '', tone: '', summary: '', content: '', impact: '' };
        }
        return {
          blockId: `${block.id}`,
          title: block.title ?? '',
          tone: block.metadata?.tone ?? block.tone ?? '',
          summary: block.latestVersion?.summary ?? block.summary ?? '',
          content: block.latestVersion?.content ?? block.content ?? '',
          impact: block.metadata?.impact ?? '',
        };
      });
    },
    [storyBlocks],
  );

  async function handleCreate(event) {
    event.preventDefault();
    if (!createState.title.trim()) {
      setStatus({ tone: 'error', message: 'A story block title is required.' });
      return;
    }
    if (!createState.content.trim()) {
      setStatus({ tone: 'error', message: 'Add story block content before saving.' });
      return;
    }
    setCreating(true);
    setStatus(null);
    try {
      const payload = {
        title: createState.title.trim(),
        tone: createState.tone.trim() || undefined,
        summary: createState.summary.trim() || undefined,
        content: createState.content.trim(),
        impact: createState.impact.trim() || undefined,
        tags: createTags,
      };
      const block = await createStoryBlock(userId, payload);
      setStatus({ tone: 'success', message: `${block.title} added to your story block library.` });
      handleResetCreate();
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to create the story block.';
      setStatus({ tone: 'error', message });
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!updateState.blockId) {
      setStatus({ tone: 'error', message: 'Select a story block to update.' });
      return;
    }
    if (!updateState.content.trim()) {
      setStatus({ tone: 'error', message: 'Updated story block content is required.' });
      return;
    }
    setUpdating(true);
    setStatus(null);
    try {
      const payload = {
        title: updateState.title.trim() || undefined,
        summary: updateState.summary.trim() || undefined,
        content: updateState.content.trim(),
        metadata: {
          tone: updateState.tone.trim() || undefined,
          impact: updateState.impact.trim() || undefined,
        },
      };
      await uploadStoryBlockVersion(userId, updateState.blockId, payload);
      setStatus({ tone: 'success', message: 'Story block updated successfully.' });
      handleResetUpdate();
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to update the story block.';
      setStatus({ tone: 'error', message });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      {status ? <StatusBanner tone={status.tone} message={status.message} onDismiss={() => setStatus(null)} /> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Create a reusable story block</h3>
        <p className="mt-1 text-sm text-slate-500">
          Capture proof points, outcomes, and narratives that can be embedded across cover letters and proposals.
        </p>
        <form className="mt-4 grid gap-4" onSubmit={handleCreate}>
          <FieldGroup label="Story block title" description="Give collaborators and AI tooling clear context.">
            <TextInput
              name="title"
              value={createState.title}
              onChange={(event) => setCreateState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Platform transformation wins"
              required
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Tone" description="Describe the voice or energy of this story block.">
            <TextInput
              name="tone"
              value={createState.tone}
              onChange={(event) => setCreateState((prev) => ({ ...prev, tone: event.target.value }))}
              placeholder="Confident and data-backed"
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Summary" description="High-level summary visible in dashboards.">
            <TextInput
              multiline
              name="summary"
              value={createState.summary}
              onChange={(event) => setCreateState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Showcase measurable transformation delivered for enterprise clients."
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Content" description="Full narrative or bullet points.">
            <TextInput
              multiline
              name="content"
              value={createState.content}
              onChange={(event) => setCreateState((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Led a cross-functional programme that..."
              required
              disabled={creating}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Impact" description="Optional quantified outcome or highlight.">
              <TextInput
                name="impact"
                value={createState.impact}
                onChange={(event) => setCreateState((prev) => ({ ...prev, impact: event.target.value }))}
                placeholder="Scaled ARR by 42% in 9 months"
                disabled={creating}
              />
            </FieldGroup>
            <FieldGroup label="Tags" description="Comma-separated tags for quick search.">
              <TextInput
                name="tags"
                value={createState.tags}
                onChange={(event) => setCreateState((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="growth, enterprise, product"
                disabled={creating}
              />
            </FieldGroup>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={creating}
            >
              {creating ? 'Saving…' : 'Save story block'}
            </button>
            <button
              type="button"
              onClick={handleResetCreate}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              disabled={creating}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Update an existing story block</h3>
        <p className="mt-1 text-sm text-slate-500">Refresh content, tone, or impact metrics while keeping version history intact.</p>
        <form className="mt-4 grid gap-4" onSubmit={handleUpdate}>
          <FieldGroup label="Story block" description="Pick the block you want to revise.">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              value={updateState.blockId}
              onChange={(event) => handleSelectBlock(event.target.value)}
              disabled={updating}
            >
              <option value="">Select a story block</option>
              {storyBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.title}
                </option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label="Title" description="Optional title update.">
            <TextInput
              name="updateTitle"
              value={updateState.title}
              onChange={(event) => setUpdateState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Platform transformation wins"
              disabled={updating}
            />
          </FieldGroup>
          <FieldGroup label="Tone" description="Refresh how this story should feel.">
            <TextInput
              name="updateTone"
              value={updateState.tone}
              onChange={(event) => setUpdateState((prev) => ({ ...prev, tone: event.target.value }))}
              placeholder="Confident and data-backed"
              disabled={updating}
            />
          </FieldGroup>
          <FieldGroup label="Summary" description="Give collaborators a quick digest of changes.">
            <TextInput
              multiline
              name="updateSummary"
              value={updateState.summary}
              onChange={(event) => setUpdateState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Updated revenue metrics and stakeholder quotes."
              disabled={updating}
            />
          </FieldGroup>
          <FieldGroup label="Content" description="Full narrative with refreshed details.">
            <TextInput
              multiline
              name="updateContent"
              value={updateState.content}
              onChange={(event) => setUpdateState((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Updated story block content..."
              disabled={updating}
              required
            />
          </FieldGroup>
          <FieldGroup label="Impact" description="Update the quantified outcome or highlight.">
            <TextInput
              name="updateImpact"
              value={updateState.impact}
              onChange={(event) => setUpdateState((prev) => ({ ...prev, impact: event.target.value }))}
              placeholder="Scaled ARR by 42% in 9 months"
              disabled={updating}
            />
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={updating}
            >
              {updating ? 'Saving…' : 'Save updates'}
            </button>
            <button
              type="button"
              onClick={handleResetUpdate}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              disabled={updating}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

StoryBlockWorkshop.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  storyBlocks: PropTypes.arrayOf(PropTypes.object),
  onSuccess: PropTypes.func,
};

StoryBlockWorkshop.defaultProps = {
  storyBlocks: [],
  onSuccess: undefined,
};
