import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from '../../utils/classNames.js';

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All access levels' },
  { value: 'internal', label: 'Internal only' },
  { value: 'client', label: 'Shared with client' },
  { value: 'public', label: 'Public' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'size-desc', label: 'Largest file' },
  { value: 'size-asc', label: 'Smallest file' },
];

const EMPTY_FILE = {
  label: '',
  storageUrl: '',
  fileType: '',
  sizeBytes: '',
  uploadedBy: '',
  visibility: 'internal',
};

function formatFileSize(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return '0 B';
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function buildPayload(payload) {
  const sizeValue = payload.sizeBytes === '' || payload.sizeBytes == null ? undefined : Number(payload.sizeBytes);
  return {
    label: payload.label,
    storageUrl: payload.storageUrl,
    fileType: payload.fileType || undefined,
    sizeBytes:
      sizeValue == null || Number.isNaN(sizeValue) || sizeValue < 0 ? undefined : Math.round(sizeValue),
    uploadedBy: payload.uploadedBy || undefined,
    visibility: payload.visibility || 'internal',
  };
}

function FileRow({ file, onEdit, onDelete, canManage = true }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{file.label}</span>
          <span className="text-xs text-slate-500">{file.fileType || '—'}</span>
        </div>
      </td>
      <td className="py-3 pr-3 text-sm text-slate-600">
        <a
          href={file.storageUrl}
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open link
        </a>
      </td>
      <td className="py-3 pr-3 text-sm text-slate-600">{formatFileSize(file.sizeBytes)}</td>
      <td className="py-3 pr-3 text-sm text-slate-600">{file.uploadedBy || '—'}</td>
      <td className="py-3 pr-3">
        <span
          className={classNames('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', {
            'bg-slate-100 text-slate-600': file.visibility === 'internal',
            'bg-sky-100 text-sky-700': file.visibility === 'client',
            'bg-emerald-100 text-emerald-700': file.visibility === 'public',
          })}
        >
          {file.visibility || 'internal'}
        </span>
      </td>
      <td className="py-3 text-right text-sm">
        {canManage ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEdit(file)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-300"
            >
              Remove
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

FileRow.propTypes = {
  file: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canManage: PropTypes.bool,
};

export default function FileVault({ project = {}, actions, canManage = true }) {
  const files = Array.isArray(project?.files) ? project.files : [];
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [sort, setSort] = useState('newest');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FILE);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const storageSummary = useMemo(() => {
    if (!files.length) {
      return {
        totalFiles: 0,
        totalBytes: 0,
        readable: formatFileSize(0),
        uniqueVisibilities: [],
        lastUploader: '—',
      };
    }
    const totalBytes = files.reduce((sum, file) => sum + Number(file.sizeBytes ?? 0), 0);
    const sortedByRecency = files
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return {
      totalFiles: files.length,
      totalBytes,
      readable: formatFileSize(totalBytes),
      uniqueVisibilities: Array.from(new Set(files.map((file) => file.visibility || 'internal'))),
      lastUploader: sortedByRecency[0]?.uploadedBy || '—',
    };
  }, [files]);

  const sortedFiles = useMemo(() => {
    const cloned = files.slice();
    cloned.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
        case 'size-desc':
          return Number(b.sizeBytes ?? 0) - Number(a.sizeBytes ?? 0);
        case 'size-asc':
          return Number(a.sizeBytes ?? 0) - Number(b.sizeBytes ?? 0);
        case 'newest':
        default:
          return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      }
    });
    return cloned;
  }, [files, sort]);

  const filteredFiles = useMemo(() => {
    return sortedFiles.filter((file) => {
      const matchesVisibility = visibility === 'all' ? true : file.visibility === visibility;
      const matchesSearch = search
        ? [file.label, file.fileType, file.uploadedBy]
            .filter((value) => value != null)
            .some((value) => String(value).toLowerCase().includes(search.toLowerCase()))
        : true;
      return matchesVisibility && matchesSearch;
    });
  }, [sortedFiles, visibility, search]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetState = () => {
    setForm(EMPTY_FILE);
    setEditingId(null);
    setCreating(false);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createFile(project.id, buildPayload(form));
      resetState();
      setFeedback({ status: 'success', message: 'File stored in vault.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to store file.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!canManage || editingId == null) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateFile(project.id, editingId, buildPayload(form));
      resetState();
      setFeedback({ status: 'success', message: 'File metadata updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update file.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (file) => {
    setEditingId(file.id);
    setForm({
      label: file.label || '',
      storageUrl: file.storageUrl || '',
      fileType: file.fileType || '',
      sizeBytes: file.sizeBytes != null ? String(file.sizeBytes) : '',
      uploadedBy: file.uploadedBy || '',
      visibility: file.visibility || 'internal',
    });
    setCreating(true);
    setFeedback(null);
  };

  const handleDelete = async (file) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteFile(project.id, file.id);
      if (editingId === file.id) {
        resetState();
      }
      setFeedback({ status: 'success', message: 'File removed from vault.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove file.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">File vault</p>
        <h4 className="mt-3 text-lg font-semibold text-slate-900">Secure project asset storage</h4>
        <p className="mt-2 text-sm text-slate-600">
          Centralise briefs, approvals, creative assets, and legal files with granular visibility controls and audit-ready
          metadata.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Files stored</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{storageSummary.totalFiles}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Storage used</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{storageSummary.readable}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Access levels</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-900">
              {storageSummary.uniqueVisibilities.join(', ') || 'Internal'}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Last uploader</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-900">{storageSummary.lastUploader}</dd>
          </div>
        </dl>
      </section>

      {feedback ? (
        <div
          className={classNames('rounded-2xl border px-4 py-3 text-sm', {
            'border-emerald-200 bg-emerald-50 text-emerald-700': feedback.status === 'success',
            'border-rose-200 bg-rose-50 text-rose-600': feedback.status === 'error',
          })}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, type, or owner"
                className="min-w-[160px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setEditingId(null);
                setForm(EMPTY_FILE);
              }}
              className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accent/90"
              disabled={!canManage}
            >
              {creating ? 'Manage asset' : 'Add asset'}
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Asset</th>
                  <th className="py-2 pr-3 font-semibold">Link</th>
                  <th className="py-2 pr-3 font-semibold">Size</th>
                  <th className="py-2 pr-3 font-semibold">Owner</th>
                  <th className="py-2 pr-3 font-semibold">Visibility</th>
                  <th className="py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length ? (
                  filteredFiles.map((file) => (
                    <FileRow key={file.id} file={file} onEdit={handleEdit} onDelete={handleDelete} canManage={canManage} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No files found. Adjust filters or upload a new asset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {editingId ? 'Update metadata' : 'Store new asset'}
          </h5>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="mt-4 space-y-4">
            <label className="flex flex-col text-sm text-slate-700">
              Label
              <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleFormChange}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="Executive summary deck"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Storage URL
              <input
                type="url"
                name="storageUrl"
                value={form.storageUrl}
                onChange={handleFormChange}
                required
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="https://storage.gigvora.com/files/deck.pdf"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              File type
              <input
                type="text"
                name="fileType"
                value={form.fileType}
                onChange={handleFormChange}
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
                onChange={handleFormChange}
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
                onChange={handleFormChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <label className="flex flex-col text-sm text-slate-700">
              Visibility
              <select
                name="visibility"
                value={form.visibility}
                onChange={handleFormChange}
                disabled={!canManage || submitting}
                className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="internal">Internal</option>
                <option value="client">Client</option>
                <option value="public">Public</option>
              </select>
            </label>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetState}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
                disabled={!creating && editingId == null}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canManage || submitting}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Upload file'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

FileVault.propTypes = {
  project: PropTypes.object.isRequired,
  actions: PropTypes.shape({
    createFile: PropTypes.func.isRequired,
    updateFile: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};
