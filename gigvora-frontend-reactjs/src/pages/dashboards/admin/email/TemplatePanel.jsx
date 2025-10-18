import { useMemo, useState } from 'react';
import {
  EyeIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

function TemplateSummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TemplateCard({ template, onEdit, onPreview, onDelete, onTest }) {
  const tags = Array.isArray(template.tags) ? template.tags : [];
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              template.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {template.enabled ? 'Active' : 'Paused'}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-600">{template.subject}</p>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {template.category ? <span className="rounded-full bg-slate-100 px-3 py-1">{template.category}</span> : null}
          <span className="rounded-full bg-slate-100 px-3 py-1">v{template.version}</span>
        </div>
        {tags.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-3 py-1 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => onTest?.(template)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          Test
        </button>
        <button
          type="button"
          onClick={() => onPreview?.(template)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          <EyeIcon className="h-4 w-4" aria-hidden="true" />
          View
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(template)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(template)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default function TemplatePanel({
  templates,
  summary,
  loading,
  onCreate,
  onEdit,
  onPreview,
  onDelete,
  onTest,
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const list = new Set();
    (templates || []).forEach((template) => {
      if (template?.category) {
        list.add(template.category);
      }
    });
    return Array.from(list);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (templates || []).filter((template) => {
      if (category !== 'all' && template.category !== category) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = `${template.name} ${template.subject} ${template.slug}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [templates, search, category]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Templates</h2>
          <p className="text-sm text-slate-500">Transactional library</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New
        </button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <TemplateSummaryCard label="Total" value={summary?.total ?? 0} />
        <TemplateSummaryCard label="Active" value={summary?.enabled ?? 0} />
        <TemplateSummaryCard label="Categories" value={categories.length} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-500">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {loading && !templates?.length ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">Loading...</div>
        ) : null}
        {!loading && filteredTemplates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
            No templates
          </div>
        ) : null}
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={onEdit}
            onPreview={onPreview}
            onDelete={onDelete}
            onTest={onTest}
          />
        ))}
      </div>
    </div>
  );
}
