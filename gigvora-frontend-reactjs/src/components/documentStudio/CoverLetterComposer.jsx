import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import { createCoverLetter, uploadCoverLetterVersion } from '../../services/coverLetters.js';

async function readFileAsBase64(file) {
  if (!file) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      } else {
        reject(new Error('Unsupported file payload.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

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

export default function CoverLetterComposer({ userId, templates, storyBlocks, onSuccess }) {
  const [createState, setCreateState] = useState({
    title: '',
    targetRole: '',
    targetCompany: '',
    tone: '',
    summary: '',
    body: '',
    callToAction: '',
    tags: '',
    toneScore: '',
  });
  const [selectedStoryBlocks, setSelectedStoryBlocks] = useState(() => new Set());
  const [createFile, setCreateFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  const [uploadState, setUploadState] = useState({
    templateId: '',
    summary: '',
    content: '',
    toneScore: '',
    qualityScore: '',
  });
  const [uploadStoryBlocks, setUploadStoryBlocks] = useState(() => new Set());
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const tagArray = useMemo(() => {
    return createState.tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }, [createState.tags]);

  const createMetrics = useMemo(() => {
    const metrics = {};
    if (createState.toneScore) {
      metrics.toneScore = Number(createState.toneScore);
    }
    return metrics;
  }, [createState.toneScore]);

  const updateMetrics = useMemo(() => {
    const metrics = {};
    if (uploadState.toneScore) {
      metrics.toneScore = Number(uploadState.toneScore);
    }
    if (uploadState.qualityScore) {
      metrics.qualityScore = Number(uploadState.qualityScore);
    }
    return metrics;
  }, [uploadState.toneScore, uploadState.qualityScore]);

  const handleStoryBlockToggle = useCallback((id) => {
    setSelectedStoryBlocks((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleUploadStoryBlockToggle = useCallback((id) => {
    setUploadStoryBlocks((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const resetCreateForm = useCallback(() => {
    setCreateState({
      title: '',
      targetRole: '',
      targetCompany: '',
      tone: '',
      summary: '',
      body: '',
      callToAction: '',
      tags: '',
      toneScore: '',
    });
    setSelectedStoryBlocks(new Set());
    setCreateFile(null);
  }, []);

  const resetUploadForm = useCallback(() => {
    setUploadState({ templateId: '', summary: '', content: '', toneScore: '', qualityScore: '' });
    setUploadStoryBlocks(new Set());
    setUploadFile(null);
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!createState.title.trim()) {
      setStatus({ tone: 'error', message: 'A cover letter title is required.' });
      return;
    }
    setCreating(true);
    setStatus(null);
    try {
      const payload = {
        title: createState.title.trim(),
        targetRole: createState.targetRole.trim() || undefined,
        targetCompany: createState.targetCompany.trim() || undefined,
        tone: createState.tone.trim() || undefined,
        summary: createState.summary.trim() || undefined,
        content: createState.body.trim() || undefined,
        callToAction: createState.callToAction.trim() || undefined,
        tags: tagArray,
        storyBlocks: Array.from(selectedStoryBlocks),
        metrics: Object.keys(createMetrics).length ? createMetrics : undefined,
      };
      if (createFile) {
        const base64 = await readFileAsBase64(createFile);
        payload.file = {
          fileName: createFile.name,
          mimeType: createFile.type,
          size: createFile.size,
          base64,
        };
      }
      const document = await createCoverLetter(userId, payload);
      setStatus({ tone: 'success', message: `${document.title} saved to your cover letter library.` });
      resetCreateForm();
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to create the cover letter.';
      setStatus({ tone: 'error', message });
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!uploadState.templateId) {
      setStatus({ tone: 'error', message: 'Select a cover letter to update.' });
      return;
    }
    if (!uploadState.content.trim() && !uploadFile) {
      setStatus({ tone: 'error', message: 'Provide updated content or attach a file for the new version.' });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const payload = {
        summary: uploadState.summary.trim() || undefined,
        content: uploadState.content.trim() || undefined,
        storyBlocks: Array.from(uploadStoryBlocks),
        metrics: Object.keys(updateMetrics).length ? updateMetrics : undefined,
      };
      if (uploadFile) {
        const base64 = await readFileAsBase64(uploadFile);
        payload.file = {
          fileName: uploadFile.name,
          mimeType: uploadFile.type,
          size: uploadFile.size,
          base64,
        };
      }
      const document = await uploadCoverLetterVersion(userId, uploadState.templateId, payload);
      setStatus({ tone: 'success', message: `Version v${document.latestVersion?.versionNumber ?? ''} ready for review.` });
      resetUploadForm();
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to upload the new cover letter version.';
      setStatus({ tone: 'error', message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {status ? <StatusBanner tone={status.tone} message={status.message} onDismiss={() => setStatus(null)} /> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Compose a new cover letter template</h3>
            <p className="text-sm text-slate-500">
              Personalise outreach with reusable templates, tone coaching, and curated story blocks.
            </p>
          </div>
          <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
            {templates.length ? `${templates.length} templates` : 'First template'}
          </span>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleCreate}>
          <FieldGroup label="Template title" description="Used across dashboards, exports, and recruiter share links.">
            <TextInput
              name="title"
              value={createState.title}
              onChange={(event) => setCreateState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Head of Product outreach"
              required
              disabled={creating}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Target role" description="Who is this letter tailored for?">
              <TextInput
                name="targetRole"
                value={createState.targetRole}
                onChange={(event) => setCreateState((prev) => ({ ...prev, targetRole: event.target.value }))}
                placeholder="Chief Product Officer"
                disabled={creating}
              />
            </FieldGroup>
            <FieldGroup label="Target company" description="Optional signal for recruiter analytics.">
              <TextInput
                name="targetCompany"
                value={createState.targetCompany}
                onChange={(event) => setCreateState((prev) => ({ ...prev, targetCompany: event.target.value }))}
                placeholder="Gigvora"
                disabled={creating}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Tone & positioning" description="Capture the voice and positioning guidance.">
            <TextInput
              name="tone"
              value={createState.tone}
              onChange={(event) => setCreateState((prev) => ({ ...prev, tone: event.target.value }))}
              placeholder="Strategic, executive-ready, confident"
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Executive summary" description="High-level overview surfaced in dashboards.">
            <TextInput
              multiline
              name="summary"
              value={createState.summary}
              onChange={(event) => setCreateState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Highlight headline achievements and why you are relevant."
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Body" description="Main cover letter content or talking points.">
            <TextInput
              multiline
              name="body"
              value={createState.body}
              onChange={(event) => setCreateState((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Craft your personalised message..."
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Call to action" description="Close the loop with a clear ask.">
            <TextInput
              name="callToAction"
              value={createState.callToAction}
              onChange={(event) => setCreateState((prev) => ({ ...prev, callToAction: event.target.value }))}
              placeholder="Let's schedule a 20-minute alignment call next week."
              disabled={creating}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Tags" description="Comma-separated tags for filters and analytics.">
              <TextInput
                name="tags"
                value={createState.tags}
                onChange={(event) => setCreateState((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="enterprise, scale-up, leadership"
                disabled={creating}
              />
            </FieldGroup>
            <FieldGroup label="Tone score" description="Optional baseline score from your coach or AI audit.">
              <TextInput
                type="number"
                name="toneScore"
                step="0.1"
                min="0"
                max="100"
                value={createState.toneScore}
                onChange={(event) => setCreateState((prev) => ({ ...prev, toneScore: event.target.value }))}
                placeholder="88"
                disabled={creating}
              />
            </FieldGroup>
          </div>
          {storyBlocks.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-700">Attach story blocks</p>
              <p className="text-xs text-slate-500">Select approved narratives to embed automatically.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {storyBlocks.map((block) => (
                  <label
                    key={block.id}
                    className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoryBlocks.has(block.id)}
                      onChange={() => handleStoryBlockToggle(block.id)}
                      className="mt-0.5"
                      disabled={creating}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{block.title}</span>
                      {block.summary ? <span className="text-xs text-slate-500">{block.summary}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <FieldGroup label="Attach file" description="Upload PDF or DOCX for watermarking and exports.">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.docm,.rtf"
              onChange={(event) => setCreateFile(event.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-accentSoft"
              disabled={creating}
            />
            {createFile ? (
              <p className="text-xs text-slate-500">{createFile.name} · {(createFile.size / 1024).toFixed(1)} KB</p>
            ) : null}
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={creating}
            >
              {creating ? 'Saving…' : 'Create cover letter'}
            </button>
            <button
              type="button"
              onClick={resetCreateForm}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              disabled={creating}
            >
              Reset form
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-accentSoft/40 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload a new cover letter version</h3>
            <p className="text-sm text-slate-500">
              Keep recruiter-ready outreach updated with tracked changes, tone scoring, and story block governance.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent shadow-sm">
            {templates.length ? `${templates.length} templates available` : 'Create a template first'}
          </span>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleUpload}>
          <FieldGroup label="Select template" description="Choose the template to update.">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              value={uploadState.templateId}
              onChange={(event) => setUploadState((prev) => ({ ...prev, templateId: event.target.value }))}
              disabled={uploading}
              required
            >
              <option value="" disabled>
                Select a cover letter
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label="Version summary" description="Share context for reviewers and mentors.">
            <TextInput
              multiline
              name="summary"
              value={uploadState.summary}
              onChange={(event) => setUploadState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Refreshed opener and added growth metrics."
              disabled={uploading}
            />
          </FieldGroup>
          <FieldGroup label="Content"
            description="Paste updated copy or leave empty if uploading a file.">
            <TextInput
              multiline
              name="content"
              value={uploadState.content}
              onChange={(event) => setUploadState((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Updated cover letter content..."
              disabled={uploading}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Tone score" description="Optional updated tone score.">
              <TextInput
                type="number"
                name="toneScore"
                step="0.1"
                min="0"
                max="100"
                value={uploadState.toneScore}
                onChange={(event) => setUploadState((prev) => ({ ...prev, toneScore: event.target.value }))}
                placeholder="90"
                disabled={uploading}
              />
            </FieldGroup>
            <FieldGroup label="Quality score" description="Optional QA score from mentor or AI audit.">
              <TextInput
                type="number"
                name="qualityScore"
                step="0.1"
                min="0"
                max="100"
                value={uploadState.qualityScore}
                onChange={(event) => setUploadState((prev) => ({ ...prev, qualityScore: event.target.value }))}
                placeholder="92"
                disabled={uploading}
              />
            </FieldGroup>
          </div>
          {storyBlocks.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-700">Story blocks</p>
              <p className="text-xs text-slate-500">Refresh which building blocks power this template.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {storyBlocks.map((block) => (
                  <label
                    key={`update-${block.id}`}
                    className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={uploadStoryBlocks.has(block.id)}
                      onChange={() => handleUploadStoryBlockToggle(block.id)}
                      className="mt-0.5"
                      disabled={uploading}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{block.title}</span>
                      {block.summary ? <span className="text-xs text-slate-500">{block.summary}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <FieldGroup label="Upload file" description="Upload PDF or DOCX with tracked changes.">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.docm,.rtf"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-accent/40 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent hover:file:bg-accentSoft"
              disabled={uploading}
            />
            {uploadFile ? (
              <p className="text-xs text-slate-500">{uploadFile.name} · {(uploadFile.size / 1024).toFixed(1)} KB</p>
            ) : null}
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload new version'}
            </button>
            <button
              type="button"
              onClick={resetUploadForm}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              disabled={uploading}
            >
              Clear form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CoverLetterComposer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  templates: PropTypes.arrayOf(PropTypes.object),
  storyBlocks: PropTypes.arrayOf(PropTypes.object),
  onSuccess: PropTypes.func,
};

CoverLetterComposer.defaultProps = {
  templates: [],
  storyBlocks: [],
  onSuccess: undefined,
};
