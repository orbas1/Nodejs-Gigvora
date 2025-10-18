import { useEffect, useMemo, useState, useRef } from 'react';
import PanelDialog from './PanelDialog.jsx';

const MEDIA_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'banner', label: 'Banner' },
];

function normalizeMediaItem(item = {}) {
  return {
    id: item.id ?? null,
    type: item.type ?? 'image',
    title: item.title ?? '',
    url: item.url ?? '',
    altText: item.altText ?? '',
    description: item.description ?? '',
    position: item.position ?? '',
  };
}

function MediaEditorDialog({ open, item, onClose, onSubmit }) {
  const [formState, setFormState] = useState(() => normalizeMediaItem(item));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialFieldRef = useRef(null);

  useEffect(() => {
    setFormState(normalizeMediaItem(item));
    setError('');
    setSubmitting(false);
  }, [item, open]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        type: formState.type,
        title: formState.title?.trim() || null,
        url: formState.url?.trim() || null,
        altText: formState.altText?.trim() || null,
        description: formState.description?.trim() || null,
        position:
          formState.position === '' || formState.position == null
            ? null
            : Number.isFinite(Number(formState.position))
              ? Number(formState.position)
              : null,
      };
      await onSubmit?.(payload);
      onClose?.();
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to save media asset.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <PanelDialog
      open={open}
      onClose={() => (!submitting ? onClose?.() : null)}
      title={item?.id ? 'Edit media' : 'New media'}
      size="lg"
      initialFocus={initialFieldRef}
      actions={
        <>
          <button
            type="button"
            onClick={() => (!submitting ? onClose?.() : null)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-60"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="media-editor-form"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="media-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="media-type" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </label>
            <select
              id="media-type"
              ref={initialFieldRef}
              value={formState.type}
              onChange={handleChange('type')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {MEDIA_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="media-position" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order
            </label>
            <input
              id="media-position"
              type="number"
              min="0"
              value={formState.position}
              onChange={handleChange('position')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="media-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              id="media-title"
              type="text"
              value={formState.title}
              onChange={handleChange('title')}
              placeholder="Add a caption"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="media-url" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Link
            </label>
            <input
              id="media-url"
              type="url"
              value={formState.url}
              onChange={handleChange('url')}
              placeholder="https://..."
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="media-alt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Alt text
            </label>
            <input
              id="media-alt"
              type="text"
              value={formState.altText}
              onChange={handleChange('altText')}
              placeholder="Describe the asset"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="media-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </label>
            <input
              id="media-description"
              type="text"
              value={formState.description}
              onChange={handleChange('description')}
              placeholder="Internal note"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </form>
    </PanelDialog>
  );
}

export default function MediaGalleryManager({ media = [], onCreate, onUpdate, onDelete }) {
  const orderedMedia = useMemo(
    () =>
      [...media]
        .filter((item) => item && item.url)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.id ?? 0) - (b.id ?? 0)),
    [media],
  );
  const [editorItem, setEditorItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const closeEditor = () => setEditorItem(null);

  const handleCreate = () => {
    setEditorItem({ id: null });
    setError('');
  };

  const handleEdit = (item) => {
    setEditorItem(item);
    setError('');
  };

  const handleDelete = async (item) => {
    if (!item?.id || !onDelete) {
      return;
    }
    setDeletingId(item.id);
    setError('');
    try {
      await onDelete(item.id);
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to delete this asset right now.';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (payload) => {
    if (editorItem?.id && onUpdate) {
      await onUpdate(editorItem.id, payload);
    } else if (onCreate) {
      await onCreate(payload);
    }
  };

  return (
    <section id="profile-media" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Media</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          Add
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {orderedMedia.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Upload banners, videos, or project shots to bring your profile to life.
          </div>
        ) : null}

        {orderedMedia.map((item) => (
          <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setPreviewItem(item)}
              className="relative aspect-[4/3] w-full overflow-hidden"
            >
              {item.type === 'video' ? (
                <iframe
                  title={item.title || 'Agency video'}
                  src={item.url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.altText || item.title || 'Agency media'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <span className="absolute left-4 top-4 inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {item.type}
              </span>
            </button>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">{item.title || 'Untitled'}</h3>
                <p className="text-xs text-slate-500 truncate">{item.description || item.altText || item.url}</p>
              </div>
              <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1">#{item.position ?? 0}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <MediaEditorDialog open={Boolean(editorItem)} item={editorItem} onClose={closeEditor} onSubmit={handleSubmit} />

      <PanelDialog
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'Preview'}
        size="xl"
      >
        {previewItem ? (
          <div className="space-y-4">
            {previewItem.type === 'video' ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-900/5">
                <iframe
                  title={previewItem.title || 'Media preview'}
                  src={previewItem.url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={previewItem.url}
                alt={previewItem.altText || previewItem.title || 'Media preview'}
                className="w-full rounded-2xl object-cover"
              />
            )}
            <div className="space-y-1 text-sm text-slate-600">
              {previewItem.description ? <p>{previewItem.description}</p> : null}
              <a
                href={previewItem.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accentDark"
              >
                Open source
              </a>
            </div>
          </div>
        ) : null}
      </PanelDialog>
    </section>
  );
}
