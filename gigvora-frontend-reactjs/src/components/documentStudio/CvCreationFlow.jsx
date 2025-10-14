import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import { createCvDocument, uploadCvVersion } from '../../services/cvDocuments.js';

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

export default function CvCreationFlow({ userId, baseline, onSuccess }) {
  const [creationState, setCreationState] = useState({
    title: '',
    roleTag: '',
    geographyTag: '',
    persona: '',
    impact: '',
    summary: '',
    content: '',
    tags: '',
  });
  const [creationFile, setCreationFile] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState('');
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasBaseline = Boolean(baseline);

  const resetCreationForm = useCallback(() => {
    setCreationState({
      title: '',
      roleTag: '',
      geographyTag: '',
      persona: '',
      impact: '',
      summary: '',
      content: '',
      tags: '',
    });
    setCreationFile(null);
  }, []);

  const tagsAsArray = useMemo(() => {
    return creationState.tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }, [creationState.tags]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!creationState.title.trim()) {
      setStatus({ tone: 'error', message: 'A title is required to create your CV document.' });
      return;
    }
    setCreating(true);
    setStatus(null);
    try {
      const payload = {
        title: creationState.title.trim(),
        roleTag: creationState.roleTag.trim() || undefined,
        geographyTag: creationState.geographyTag.trim() || undefined,
        persona: creationState.persona.trim() || undefined,
        impact: creationState.impact.trim() || undefined,
        summary: creationState.summary.trim() || undefined,
        content: creationState.content.trim() || undefined,
        tags: tagsAsArray,
        isBaseline: !hasBaseline,
        metadata: hasBaseline && baseline ? { variantOf: baseline.id } : undefined,
      };
      if (creationFile) {
        const base64 = await readFileAsBase64(creationFile);
        payload.file = {
          fileName: creationFile.name,
          mimeType: creationFile.type,
          size: creationFile.size,
          base64,
        };
      }
      const document = await createCvDocument(userId, payload);
      setStatus({ tone: 'success', message: `${document.title} is ready in your document studio.` });
      resetCreationForm();
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to create the CV document.';
      setStatus({ tone: 'error', message });
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!baseline) {
      setStatus({ tone: 'warning', message: 'Create your baseline CV before uploading additional versions.' });
      return;
    }
    if (!uploadFile) {
      setStatus({ tone: 'error', message: 'Select a CV file before uploading a new version.' });
      return;
    }
    setUploading(true);
    setStatus(null);
    try {
      const base64 = await readFileAsBase64(uploadFile);
      const payload = {
        summary: uploadSummary.trim() || undefined,
        setAsBaseline: true,
        file: {
          fileName: uploadFile.name,
          mimeType: uploadFile.type,
          size: uploadFile.size,
          base64,
          storageKey: undefined,
        },
      };
      const document = await uploadCvVersion(userId, baseline.id, payload);
      setStatus({ tone: 'success', message: `Version v${document.latestVersion.versionNumber} uploaded and ready for review.` });
      setUploadFile(null);
      setUploadSummary('');
      onSuccess?.();
    } catch (error) {
      const message = error?.body?.message || error?.message || 'Unable to upload the CV version.';
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
            <h3 className="text-lg font-semibold text-slate-900">{hasBaseline ? 'Create targeted CV variants' : 'Create your baseline CV'}</h3>
            <p className="text-sm text-slate-500">
              {hasBaseline
                ? 'Spin up variants with precise positioning, metrics, and AI-ready tags for instant recruiter delivery.'
                : 'Establish your enterprise baseline CV with persona clarity, quantified impact, and secure distribution controls.'}
            </p>
          </div>
          <span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
            {hasBaseline ? 'Variants enabled' : 'Baseline required'}
          </span>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleCreate}>
          <FieldGroup label="Document title" description="Use an explicit title for dashboards and recruiter share links.">
            <TextInput
              name="title"
              value={creationState.title}
              onChange={(event) => setCreationState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Principal Product Designer CV"
              required
              disabled={creating}
            />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Role focus" description="Tag a role archetype or team focus.">
              <TextInput
                name="roleTag"
                value={creationState.roleTag}
                onChange={(event) => setCreationState((prev) => ({ ...prev, roleTag: event.target.value }))}
                placeholder="Product Design Leader"
                disabled={creating}
              />
            </FieldGroup>
            <FieldGroup label="Geography" description="Lock market context for compensation benchmarking.">
              <TextInput
                name="geographyTag"
                value={creationState.geographyTag}
                onChange={(event) => setCreationState((prev) => ({ ...prev, geographyTag: event.target.value }))}
                placeholder="Berlin, EU"
                disabled={creating}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Persona narrative" description="Align messaging with the audience you are targeting.">
            <TextInput
              name="persona"
              value={creationState.persona}
              onChange={(event) => setCreationState((prev) => ({ ...prev, persona: event.target.value }))}
              placeholder="Transformation-focused design operator"
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Quantified impact" description="Summarise the macro impact and wins in a single line.">
            <TextInput
              name="impact"
              value={creationState.impact}
              onChange={(event) => setCreationState((prev) => ({ ...prev, impact: event.target.value }))}
              placeholder="Scaled design ops to 12 markets with +27% NPS"
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Executive summary" description="High level summary surfaced in recruiter dashboards.">
            <TextInput
              name="summary"
              value={creationState.summary}
              onChange={(event) => setCreationState((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Award-winning product designer operating across EU enterprise ecosystems."
              multiline
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Detailed content (optional)" description="Paste rich text content for AI scoring and keyword extraction.">
            <TextInput
              name="content"
              value={creationState.content}
              onChange={(event) => setCreationState((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Paste markdown or plaintext CV copy..."
              multiline
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Tags" description="Comma-separated tags powering filters and analytics.">
            <TextInput
              name="tags"
              value={creationState.tags}
              onChange={(event) => setCreationState((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="design systems, enterprise, growth"
              disabled={creating}
            />
          </FieldGroup>
          <FieldGroup label="Attach CV file" description="Upload PDF or DOCX for watermarking, compliance and instant exports.">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.docm,.rtf"
              onChange={(event) => setCreationFile(event.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-accentSoft"
              disabled={creating}
            />
            {creationFile ? (
              <p className="text-xs text-slate-500">
                {creationFile.name} · {(creationFile.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={creating}
            >
              {creating ? 'Saving…' : hasBaseline ? 'Create variant' : 'Create baseline CV'}
            </button>
            <button
              type="button"
              onClick={resetCreationForm}
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
            <h3 className="text-lg font-semibold text-slate-900">Upload and promote a new CV version</h3>
            <p className="text-sm text-slate-500">
              Push recruiter-ready updates with watermarking, approval workflows, and AI scoring retained across every version.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent shadow-sm">
            {baseline ? `Current baseline v${baseline.latestVersion?.versionNumber ?? 1}` : 'Baseline pending'}
          </span>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={handleUpload}>
          <FieldGroup label="Upload CV file" description="Select the PDF or DOCX with the refreshed story.">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.docm,.rtf"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-accent/40 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent hover:file:bg-accentSoft"
              disabled={uploading}
            />
            {uploadFile ? (
              <p className="text-xs text-slate-500">
                {uploadFile.name} · {(uploadFile.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </FieldGroup>
          <FieldGroup label="Version summary" description="Outline what changed for reviewers and recruiters.">
            <TextInput
              multiline
              name="uploadSummary"
              value={uploadSummary}
              onChange={(event) => setUploadSummary(event.target.value)}
              placeholder="Integrated Q1 product metrics, refreshed brand storytelling, updated leadership bullets."
              disabled={uploading}
            />
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload version & set baseline'}
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadFile(null);
                setUploadSummary('');
              }}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              disabled={uploading}
            >
              Clear selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CvCreationFlow.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  baseline: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    latestVersion: PropTypes.shape({
      versionNumber: PropTypes.number,
    }),
  }),
  onSuccess: PropTypes.func,
};
