import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const VIEW_MODES = ['grid', 'list'];
const SORT_FIELDS = [
  { id: 'updatedAt', label: 'Recently updated' },
  { id: 'name', label: 'Alphabetical' },
  { id: 'size', label: 'File size' },
  { id: 'owner', label: 'Owner' },
];

const DEFAULT_FILES = [
  {
    id: 'blueprint',
    name: 'Experience blueprint.pdf',
    type: 'PDF',
    size: 5_300_000,
    updatedAt: new Date(),
    owner: 'Nina Patel',
    tags: ['Design', 'Executive'],
    version: 6,
    status: 'Approved',
  },
  {
    id: 'playbook',
    name: 'Go-to-market playbook.docx',
    type: 'Document',
    size: 8_900_000,
    updatedAt: new Date().setDate(new Date().getDate() - 2),
    owner: 'Jordan Hicks',
    tags: ['Enablement'],
    version: 3,
    status: 'Draft',
  },
  {
    id: 'preview',
    name: 'Product walkthrough.mp4',
    type: 'Video',
    size: 45_600_000,
    updatedAt: new Date().setDate(new Date().getDate() - 1),
    owner: 'Production Studio',
    tags: ['Showcase'],
    version: 2,
    status: 'In review',
  },
];

const DEFAULT_FOLDERS = [
  { id: 'executive', name: 'Executive updates', updatedAt: new Date(), fileCount: 12 },
  { id: 'design', name: 'Design systems', updatedAt: new Date().setDate(new Date().getDate() - 5), fileCount: 18 },
  { id: 'compliance', name: 'Compliance & legal', updatedAt: new Date().setDate(new Date().getDate() - 9), fileCount: 7 },
];

const STORAGE_DEFAULT = {
  used: 124_000_000,
  capacity: 512_000_000,
  sharedWith: ['Founders circle', 'Core leadership', 'Finance'],
};

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${size.toFixed(size > 10 ? 0 : 1)} ${units[exponent]}`;
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function FileCard({ file, onPreview, onDownload, onShare }) {
  return (
    <article className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{file.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{file.type}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">v{file.version ?? 1}</span>
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <p>Owner: {file.owner ?? 'Unassigned'}</p>
        <p>Updated {formatDate(file.updatedAt)}</p>
        <p>Size: {formatSize(file.size)}</p>
        <p>Status: <span className="font-semibold text-slate-700">{file.status ?? '—'}</span></p>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
        {file.tags?.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-600">
            #{tag}
          </span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPreview?.(file)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => onDownload?.(file)}
          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => onShare?.(file)}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Share
        </button>
      </div>
    </article>
  );
}

FileCard.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    size: PropTypes.number,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    owner: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }).isRequired,
  onPreview: PropTypes.func,
  onDownload: PropTypes.func,
  onShare: PropTypes.func,
};

FileCard.defaultProps = {
  onPreview: undefined,
  onDownload: undefined,
  onShare: undefined,
};

export default function FileVault({ files, folders, onPreview, onDownload, onShare, onUpload, onCreateFolder, storage }) {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState(() => new Set());
  const [selectedOwners, setSelectedOwners] = useState(() => new Set());
  const [sort, setSort] = useState({ field: 'updatedAt', direction: 'desc' });
  const [selectedFiles, setSelectedFiles] = useState(() => new Set());

  const mergedFiles = files?.length ? files : DEFAULT_FILES;
  const mergedFolders = folders?.length ? folders : DEFAULT_FOLDERS;
  const storageMeta = storage ?? STORAGE_DEFAULT;

  const allTags = useMemo(() => {
    const set = new Set();
    mergedFiles.forEach((file) => file.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [mergedFiles]);

  const allOwners = useMemo(() => {
    const set = new Set();
    mergedFiles.forEach((file) => file.owner && set.add(file.owner));
    return Array.from(set);
  }, [mergedFiles]);

  const filteredFiles = useMemo(() => {
    let result = [...mergedFiles];
    if (search) {
      const query = search.toLowerCase();
      result = result.filter((file) => file.name.toLowerCase().includes(query) || file.tags?.some((tag) => tag.toLowerCase().includes(query)));
    }
    if (selectedTags.size) {
      result = result.filter((file) => file.tags?.some((tag) => selectedTags.has(tag)));
    }
    if (selectedOwners.size) {
      result = result.filter((file) => (file.owner ? selectedOwners.has(file.owner) : false));
    }
    result.sort((a, b) => {
      const { field, direction } = sort;
      const order = direction === 'asc' ? 1 : -1;
      if (field === 'updatedAt' || field === 'size') {
        const aValue = a[field] ?? 0;
        const bValue = b[field] ?? 0;
        return aValue > bValue ? order * -1 : aValue < bValue ? order : 0;
      }
      const aValue = (a[field] ?? '').toString().toLowerCase();
      const bValue = (b[field] ?? '').toString().toLowerCase();
      if (aValue > bValue) return order;
      if (aValue < bValue) return order * -1;
      return 0;
    });
    return result;
  }, [mergedFiles, search, selectedTags, selectedOwners, sort]);

  const utilisation = Math.min((storageMeta.used / storageMeta.capacity) * 100, 100);

  function toggleTag(tag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function toggleOwner(owner) {
    setSelectedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(owner)) {
        next.delete(owner);
      } else {
        next.add(owner);
      }
      return next;
    });
  }

  function toggleSelection(fileId) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  function renderGrid() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredFiles.map((file) => (
          <label key={file.id} className="cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedFiles.has(file.id)}
              onChange={() => toggleSelection(file.id)}
            />
            <FileCard file={file} onPreview={onPreview} onDownload={onDownload} onShare={onShare} />
          </label>
        ))}
        {!filteredFiles.length ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No files match the current filters. Refine your tags or owners to reveal more assets.
          </div>
        ) : null}
      </div>
    );
  }

  function renderList() {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">File</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-left">Size</th>
              <th className="px-4 py-3 text-left">Updated</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFiles.map((file) => (
              <tr key={`list-${file.id}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => toggleSelection(file.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.type}</p>
                    </div>
                  </label>
                </td>
                <td className="px-4 py-3">{file.owner ?? 'Unassigned'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{file.tags?.join(', ')}</td>
                <td className="px-4 py-3">{formatSize(file.size)}</td>
                <td className="px-4 py-3">{formatDate(file.updatedAt)}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{file.status ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onPreview?.(file)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload?.(file)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => onShare?.(file)}
                      className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Share
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredFiles.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No files match the current filters. Refine your tags or owners to reveal more assets.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6 rounded-[40px] border border-slate-200 bg-white/85 p-8 shadow-lg shadow-slate-900/5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">File vault</p>
          <h2 className="text-2xl font-semibold text-slate-900">Enterprise-ready asset hub</h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Curate, version, and govern documents with the elegance expected from modern executive suites. Multi-select, share,
            and preview without leaving the workspace cockpit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={clsx(
                'rounded-full border px-3 py-1 font-semibold capitalize transition',
                viewMode === mode
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Storage used</p>
          <p className="text-2xl font-semibold text-slate-900">{formatSize(storageMeta.used)}</p>
          <p className="text-xs text-slate-500">of {formatSize(storageMeta.capacity)}</p>
        </div>
        <div className="md:col-span-2">
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
              style={{ width: `${utilisation}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Shared with {storageMeta.sharedWith.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpload?.()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Upload files
          </button>
          <button
            type="button"
            onClick={() => onCreateFolder?.()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            New folder
          </button>
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 text-xs text-slate-500 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart filters</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={clsx(
                  'rounded-full border px-3 py-1 font-semibold',
                  selectedTags.has(tag)
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                #{tag}
              </button>
            ))}
            {!allTags.length ? <span className="text-slate-400">No tags yet</span> : null}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owners</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {allOwners.map((owner) => (
              <button
                type="button"
                key={owner}
                onClick={() => toggleOwner(owner)}
                className={clsx(
                  'rounded-full border px-3 py-1 font-semibold',
                  selectedOwners.has(owner)
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                {owner}
              </button>
            ))}
            {!allOwners.length ? <span className="text-slate-400">No owners recorded</span> : null}
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find files"
              className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Sort</span>
            <select
              value={sort.field}
              onChange={(event) => setSort((prev) => ({ ...prev, field: event.target.value }))}
              className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
            >
              {SORT_FIELDS.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSort((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {sort.direction === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div>{viewMode === 'grid' ? renderGrid() : renderList()}</div>
        <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Shared folders</h3>
          <ul className="space-y-3">
            {mergedFolders.map((folder) => (
              <li key={folder.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{folder.name}</p>
                <p className="text-xs text-slate-500">{folder.fileCount} assets · Updated {formatDate(folder.updatedAt)}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-700">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Selection</h4>
            <p className="mt-2 text-sm font-semibold">{selectedFiles.size} files selected</p>
            <p className="text-xs">Total size {formatSize(Array.from(selectedFiles).reduce((total, fileId) => {
              const file = mergedFiles.find((item) => item.id === fileId);
              return total + (file?.size ?? 0);
            }, 0))}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectedFiles.forEach((fileId) => {
                  const file = mergedFiles.find((item) => item.id === fileId);
                  if (file) {
                    onShare?.(file);
                  }
                })}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Share selection
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles(new Set());
                }}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
              >
                Clear
              </button>
            </div>
          </div>
        </aside>
      </section>
    </article>
  );
}

FileVault.propTypes = {
  files: PropTypes.arrayOf(FileCard.propTypes.file),
  folders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      fileCount: PropTypes.number,
    }),
  ),
  onPreview: PropTypes.func,
  onDownload: PropTypes.func,
  onShare: PropTypes.func,
  onUpload: PropTypes.func,
  onCreateFolder: PropTypes.func,
  storage: PropTypes.shape({
    used: PropTypes.number,
    capacity: PropTypes.number,
    sharedWith: PropTypes.arrayOf(PropTypes.string),
  }),
};

FileVault.defaultProps = {
  files: undefined,
  folders: undefined,
  onPreview: undefined,
  onDownload: undefined,
  onShare: undefined,
  onUpload: undefined,
  onCreateFolder: undefined,
  storage: undefined,
};
