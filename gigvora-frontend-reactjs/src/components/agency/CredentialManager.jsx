import { useEffect, useMemo, useRef, useState } from 'react';
import PanelDialog from './PanelDialog.jsx';

function normalizeCredential(credentialInput = {}, fallbackType = 'qualification') {
  const credential = credentialInput ?? {};
  return {
    id: credential.id ?? null,
    type: credential.type ?? fallbackType,
    title: credential.title ?? '',
    issuer: credential.issuer ?? '',
    issuedAt: credential.issuedAt ?? '',
    expiresAt: credential.expiresAt ?? '',
    credentialUrl: credential.credentialUrl ?? '',
    description: credential.description ?? '',
    referenceId: credential.referenceId ?? '',
    verificationStatus: credential.verificationStatus ?? '',
  };
}

function CredentialEditorDialog({ open, item, onClose, onSubmit, type }) {
  const [formState, setFormState] = useState(() => normalizeCredential(item, type));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const initialRef = useRef(null);

  useEffect(() => {
    setFormState(normalizeCredential(item, type));
    setError('');
    setSubmitting(false);
  }, [item, type, open]);

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
        type: type,
        title: formState.title?.trim() || null,
        issuer: formState.issuer?.trim() || null,
        issuedAt: formState.issuedAt?.trim() || null,
        expiresAt: formState.expiresAt?.trim() || null,
        credentialUrl: formState.credentialUrl?.trim() || null,
        description: formState.description?.trim() || null,
        referenceId: formState.referenceId?.trim() || null,
        verificationStatus: formState.verificationStatus?.trim() || null,
      };
      await onSubmit?.(payload);
      onClose?.();
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to save credential.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <PanelDialog
      open={open}
      onClose={() => (!submitting ? onClose?.() : null)}
      title={item?.id ? 'Edit credential' : 'New credential'}
      size="lg"
      initialFocus={initialRef}
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
            form="credential-editor-form"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="credential-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="credential-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </label>
            <input
              id="credential-title"
              ref={initialRef}
              type="text"
              required
              value={formState.title}
              onChange={handleChange('title')}
              placeholder="Add title"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="credential-issuer" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Issuer
            </label>
            <input
              id="credential-issuer"
              type="text"
              value={formState.issuer}
              onChange={handleChange('issuer')}
              placeholder="Organization"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="credential-issued" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Issued
            </label>
            <input
              id="credential-issued"
              type="date"
              value={formState.issuedAt}
              onChange={handleChange('issuedAt')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="credential-expires" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expires
            </label>
            <input
              id="credential-expires"
              type="date"
              value={formState.expiresAt}
              onChange={handleChange('expiresAt')}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="credential-reference" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reference ID
            </label>
            <input
              id="credential-reference"
              type="text"
              value={formState.referenceId}
              onChange={handleChange('referenceId')}
              placeholder="ID"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="credential-url" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification link
            </label>
            <input
              id="credential-url"
              type="url"
              value={formState.credentialUrl}
              onChange={handleChange('credentialUrl')}
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="credential-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <input
              id="credential-status"
              type="text"
              value={formState.verificationStatus}
              onChange={handleChange('verificationStatus')}
              placeholder="Verified"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="credential-description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </label>
          <textarea
            id="credential-description"
            rows={3}
            value={formState.description}
            onChange={handleChange('description')}
            placeholder="Summary"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </form>
    </PanelDialog>
  );
}

export default function CredentialManager({
  credentials = [],
  type = 'qualification',
  title = 'Credentials',
  onCreate,
  onUpdate,
  onDelete,
}) {
  const filtered = useMemo(
    () => credentials.filter((credential) => credential?.type === type),
    [credentials, type],
  );
  const [editorItem, setEditorItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditorItem({ id: null, type });
    setError('');
  };

  const handleEdit = (credential) => {
    setEditorItem(credential);
    setError('');
  };

  const handleDelete = async (credential) => {
    if (!credential?.id || !onDelete) {
      return;
    }
    setDeletingId(credential.id);
    setError('');
    try {
      await onDelete(credential.id);
    } catch (err) {
      const message = err?.body?.message ?? err?.message ?? 'Unable to remove this credential right now.';
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Nothing recorded yet. Add your latest {title.toLowerCase()}.
          </div>
        ) : null}
        {filtered.map((credential) => (
          <article key={credential.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setViewItem(credential)}
                className="text-left"
              >
                <h3 className="text-sm font-semibold text-slate-900">{credential.title}</h3>
                <p className="text-xs text-slate-500">{credential.issuer || 'Issuer not provided'}</p>
              </button>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  {credential.issuedAt || 'No date'}
                </span>
                {credential.expiresAt ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1">Expires {credential.expiresAt}</span>
                ) : null}
                {credential.verificationStatus ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{credential.verificationStatus}</span>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {credential.credentialUrl ? (
                  <a
                    href={credential.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    View
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(credential)}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(credential)}
                  className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                  disabled={deletingId === credential.id}
                >
                  {deletingId === credential.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <CredentialEditorDialog open={Boolean(editorItem)} item={editorItem} onClose={() => setEditorItem(null)} onSubmit={handleSubmit} type={type} />

      <PanelDialog
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        title={viewItem?.title || 'Details'}
        size="md"
      >
        {viewItem ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{viewItem.issuer || 'Issuer not provided'}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">Issued {viewItem.issuedAt || '—'}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{viewItem.expiresAt ? `Expires ${viewItem.expiresAt}` : 'No expiry'}</span>
              {viewItem.referenceId ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">ID {viewItem.referenceId}</span>
              ) : null}
            </div>
            {viewItem.description ? <p>{viewItem.description}</p> : null}
            {viewItem.credentialUrl ? (
              <a
                href={viewItem.credentialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accentDark"
              >
                Open credential
              </a>
            ) : null}
          </div>
        ) : null}
      </PanelDialog>
    </section>
  );
}
