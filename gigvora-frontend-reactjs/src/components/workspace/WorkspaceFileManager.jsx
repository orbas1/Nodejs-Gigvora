import { useState } from 'react';

function formatBytes(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = number;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export default function WorkspaceFileManager({ files = [], onSave, onDelete }) {
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
    fileType: '',
    storageProvider: '',
    storagePath: '',
    version: '',
    sizeBytes: '',
    checksum: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  function handleEdit(entry) {
    setForm({
      id: entry.id,
      name: entry.name ?? '',
      category: entry.category ?? '',
      fileType: entry.fileType ?? '',
      storageProvider: entry.storageProvider ?? '',
      storagePath: entry.storagePath ?? '',
      version: entry.version ?? '',
      sizeBytes: entry.sizeBytes ?? '',
      checksum: entry.checksum ?? '',
      tags: (entry.tags ?? []).join(', '),
    });
    setFeedback(null);
    setError(null);
  }

  function resetForm() {
    setForm({
      id: null,
      name: '',
      category: '',
      fileType: '',
      storageProvider: '',
      storagePath: '',
      version: '',
      sizeBytes: '',
      checksum: '',
      tags: '',
    });
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSave) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSave({
        id: form.id,
        name: form.name,
        category: form.category,
        fileType: form.fileType,
        storageProvider: form.storageProvider,
        storagePath: form.storagePath,
        version: form.version,
        sizeBytes: form.sizeBytes === '' ? null : Number(form.sizeBytes),
        checksum: form.checksum,
        tags: form.tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setFeedback(form.id ? 'File record updated.' : 'File record added.');
      resetForm();
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    if (!onDelete) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onDelete(entry);
      if (form.id === entry.id) {
        resetForm();
      }
      setFeedback('File removed.');
    } catch (deleteError) {
      setError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">File manager</h2>
          <p className="text-sm text-slate-600">Index project documents, design assets, and recorded sessions.</p>
        </div>
        <div className="text-sm text-slate-600">Stored files: {files.length}</div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Provider</th>
              <th className="px-4 py-2 text-left">Version</th>
              <th className="px-4 py-2 text-left">Size</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2" aria-label="actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {files.length ? (
              files.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{entry.name}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.category ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.fileType ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.storageProvider ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{entry.version ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{formatBytes(entry.sizeBytes)}</td>
                  <td className="px-4 py-2 text-slate-500">{(entry.tags ?? []).join(', ') || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-slate-500">
                  No files stored yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Edit file record' : 'Add file record'}</h3>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-name">
            File name
          </label>
          <input
            id="file-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-category">
            Category
          </label>
          <input
            id="file-category"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Design, contract, meeting"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-type">
            File type
          </label>
          <input
            id="file-type"
            value={form.fileType}
            onChange={(event) => setForm((prev) => ({ ...prev, fileType: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="application/pdf"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-provider">
            Storage provider
          </label>
          <input
            id="file-provider"
            value={form.storageProvider}
            onChange={(event) => setForm((prev) => ({ ...prev, storageProvider: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-path">
            Storage path / URL
          </label>
          <input
            id="file-path"
            value={form.storagePath}
            onChange={(event) => setForm((prev) => ({ ...prev, storagePath: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="https://drive.google.com/..."
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-version">
            Version
          </label>
          <input
            id="file-version"
            value={form.version}
            onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-size">
            Size (bytes)
          </label>
          <input
            id="file-size"
            type="number"
            step="1"
            value={form.sizeBytes}
            onChange={(event) => setForm((prev) => ({ ...prev, sizeBytes: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-checksum">
            Checksum
          </label>
          <input
            id="file-checksum"
            value={form.checksum}
            onChange={(event) => setForm((prev) => ({ ...prev, checksum: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file-tags">
            Tags (comma separated)
          </label>
          <input
            id="file-tags"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        {feedback ? <p className="md:col-span-2 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? (
          <p className="md:col-span-2 text-sm text-rose-600">{error.message ?? 'Unable to save file.'}</p>
        ) : null}
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? 'Saving…' : form.id ? 'Update file' : 'Add file'}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
