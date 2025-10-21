import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'policies', label: 'Policies' },
  { id: 'security', label: 'Security' },
  { id: 'finance', label: 'Finance' },
  { id: 'hr', label: 'People' },
];

function RepositoryTable({ documents, onUpdate, onDelete, onPublish, onDownload }) {
  const [menuOpenId, setMenuOpenId] = useState(null);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Tags</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((document) => (
            <tr key={document.id} className="bg-white/80 text-sm text-slate-600">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">{document.name}</span>
                  <span className="text-xs text-slate-500">v{document.version} • {document.type}</span>
                </div>
              </td>
              <td className="px-4 py-3">{document.owner || 'Unassigned'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {(document.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-500"
                    >
                      <TagIcon className="h-3.5 w-3.5" aria-hidden="true" /> {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    document.status === 'published'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600',
                  )}
                >
                  {document.status ?? 'draft'}
                </span>
              </td>
              <td className="px-4 py-3">{document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : 'TBC'}</td>
              <td className="px-4 py-3 text-right">
                <div className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId((current) => (current === document.id ? null : document.id))}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  >
                    <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {menuOpenId === document.id && (
                    <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          onDownload?.(document.id);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                      >
                        <CloudArrowDownIcon className="h-4 w-4" aria-hidden="true" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          onUpdate?.(document.id, { status: 'archived' });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          onDelete?.(document.id);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpenId(null);
                          onPublish?.(document.id);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Publish
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocumentRepositoryManager({
  documents = [],
  collections = [],
  onSearch,
  onFilter,
  onUploadClick,
  onUpdateDocument,
  onDeleteDocument,
  onPublishDocument,
  onDownloadDocument,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesFilter = activeFilter === 'all' || (document.tags ?? []).map((tag) => tag.toLowerCase()).includes(activeFilter);
      const matchesSearch = !search.trim()
        || document.name.toLowerCase().includes(search.toLowerCase())
        || (document.owner ?? '').toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [documents, activeFilter, search]);

  return (
    <section className="space-y-6" id="document-repository">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Document repository</h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage templates, contract packs, SOC2 evidence, and compliance reports with versioning and publishing controls.
          </p>
        </div>
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-slate-800"
        >
          <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" /> Upload
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id);
                onFilter?.(filter.id);
              }}
              className={classNames(
                'rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide transition',
                activeFilter === filter.id
                  ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search documents"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              onSearch?.(event.target.value);
            }}
            className="w-48 rounded-full border-0 bg-transparent text-sm text-slate-900 focus:outline-none focus:ring-0"
          />
        </label>
      </div>

      <RepositoryTable
        documents={filteredDocuments}
        onUpdate={onUpdateDocument}
        onDelete={onDeleteDocument}
        onPublish={onPublishDocument}
        onDownload={onDownloadDocument}
      />

      <aside className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-soft md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Collections</p>
          <h3 className="text-lg font-semibold text-slate-900">Organise playbooks</h3>
          <p className="text-sm text-slate-600">
            Create curated bundles for investors, enterprise clients, and auditors. Each collection supports staged approvals
            and watermarking.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            {collections.map((collection) => (
              <li key={collection.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <FolderOpenIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-900">{collection.name}</p>
                  <p className="text-xs text-slate-500">{collection.documents?.length ?? 0} documents</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-900/90 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Instant toolkit</p>
          <h3 className="text-lg font-semibold">One-click export</h3>
          <p className="text-sm text-white/80">
            Download all policy packs with investor-ready cover sheets and optional watermarking for NDAs.
          </p>
          <button
            type="button"
            onClick={() => onDownloadDocument?.('all')}
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/10"
          >
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export all
          </button>
          <button
            type="button"
            onClick={() => onPublishDocument?.('collection')}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 hover:bg-emerald-300/10"
          >
            <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" /> Publish trust pack
          </button>
        </div>
      </aside>
    </section>
  );
}

DocumentRepositoryManager.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      owner: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      status: PropTypes.string,
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  collections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      documents: PropTypes.array,
    }),
  ),
  onSearch: PropTypes.func,
  onFilter: PropTypes.func,
  onUploadClick: PropTypes.func,
  onUpdateDocument: PropTypes.func,
  onDeleteDocument: PropTypes.func,
  onPublishDocument: PropTypes.func,
  onDownloadDocument: PropTypes.func,
};

DocumentRepositoryManager.defaultProps = {
  documents: [],
  collections: [],
  onSearch: undefined,
  onFilter: undefined,
  onUploadClick: undefined,
  onUpdateDocument: undefined,
  onDeleteDocument: undefined,
  onPublishDocument: undefined,
  onDownloadDocument: undefined,
};
