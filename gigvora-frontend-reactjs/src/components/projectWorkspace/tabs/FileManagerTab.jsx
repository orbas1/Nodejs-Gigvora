import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const INITIAL_FORM = {
  label: '',
  storageUrl: '',
  fileType: '',
  sizeBytes: '',
  uploadedBy: '',
  visibility: 'internal',
};

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'client', label: 'Client' },
  { value: 'public', label: 'Public' },
];

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return '0 B';
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function FileManagerTab({ project, actions, canManage }) {
  const files = Array.isArray(project.files) ? project.files : [];
  const storageSummary = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + Number(file.sizeBytes ?? 0), 0);
    return {
      totalFiles: files.length,
      totalBytes,
      readable: formatFileSize(totalBytes),
    };
  }, [files]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = (payload) => ({
    label: payload.label,
    storageUrl: payload.storageUrl,
    fileType: payload.fileType || undefined,
    sizeBytes: payload.sizeBytes ? Number(payload.sizeBytes) : undefined,
    uploadedBy: payload.uploadedBy || undefined,
    visibility: payload.visibility || 'internal',
  });

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createFile(project.id, buildPayload(form));
      resetForm();
      setFeedback({ status: 'success', message: 'File added to workspace.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to add file.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (file) => {
    setEditingId(file.id);
    setEditingForm({
      label: file.label || '',
      storageUrl: file.storageUrl || '',
      fileType: file.fileType || '',
      sizeBytes: file.sizeBytes != null ? String(file.sizeBytes) : '',
      uploadedBy: file.uploadedBy || '',
      visibility: file.visibility || 'internal',
    });
    setFeedback(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateFile(project.id, editingId, buildPayload(editingForm));
      setEditingId(null);
      setFeedback({ status: 'success', message: 'File metadata updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update file.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteFile(project.id, fileId);
      setFeedback({ status: 'success', message: 'File removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove file.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Files stored</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{storageSummary.totalFiles}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Storage used</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{storageSummary.readable}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Last uploader</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {files[0]?.uploadedBy || '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Visibilities</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {[...new Set(files.map((file) => file.visibility || 'internal'))].join(', ') || 'Internal'}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Store project asset</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Label
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Project charter v2"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Storage URL
            <input
              type="url"
              name="storageUrl"
              value={form.storageUrl}
              onChange={(event) => handleChange(event, setForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="https://storage.gigvora.com/files/charter.pdf"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            File type
            <input
              type="text"
              name="fileType"
              value={form.fileType}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="application/pdf"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            File size (bytes)
            <input
              type="number"
              name="sizeBytes"
              value={form.sizeBytes}
              onChange={(event) => handleChange(event, setForm)}
              min={0}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Uploaded by
            <input
              type="text"
              name="uploadedBy"
              value={form.uploadedBy}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Visibility
            <select
              name="visibility"
              value={form.visibility}
              onChange={(event) => handleChange(event, setForm)}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save file
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                File
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Visibility
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Size
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                Uploaded by
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.length ? (
              files.map((file) => (
                <tr key={file.id} className="bg-white">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{file.label}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{file.fileType}</p>
                    <a href={file.storageUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                      Open file ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{file.visibility?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{formatFileSize(file.sizeBytes)}</td>
                  <td className="px-4 py-3 text-slate-600">{file.uploadedBy || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(file)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-sm text-slate-500">
                  No files stored yet. Upload contracts, briefs, and checklists to keep your team aligned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h5 className="text-base font-semibold text-slate-900">Edit file</h5>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-700">
              Label
              <input
                type="text"
                name="label"
                value={editingForm.label}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Storage URL
              <input
                type="url"
                name="storageUrl"
                value={editingForm.storageUrl}
                onChange={(event) => handleChange(event, setEditingForm)}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              File type
              <input
                type="text"
                name="fileType"
                value={editingForm.fileType}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              File size (bytes)
              <input
                type="number"
                name="sizeBytes"
                value={editingForm.sizeBytes}
                onChange={(event) => handleChange(event, setEditingForm)}
                min={0}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Uploaded by
              <input
                type="text"
                name="uploadedBy"
                value={editingForm.uploadedBy}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Visibility
              <select
                name="visibility"
                value={editingForm.visibility}
                onChange={(event) => handleChange(event, setEditingForm)}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save file
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

FileManagerTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    files: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createFile: PropTypes.func.isRequired,
    updateFile: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

FileManagerTab.defaultProps = {
  canManage: true,
};
