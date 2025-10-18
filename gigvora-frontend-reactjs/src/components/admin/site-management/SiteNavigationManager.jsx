import { useEffect, useMemo, useState } from 'react';

const MENU_LABELS = {
  primary: 'Header',
  secondary: 'Secondary',
  footer: 'Footer',
  utility: 'Utility',
};

const MENU_OPTIONS = Object.entries(MENU_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY_LINK = {
  id: null,
  menuKey: 'primary',
  label: '',
  url: '',
  description: '',
  icon: '',
  orderIndex: 0,
  isExternal: false,
  openInNewTab: false,
  allowedRoles: [],
};

function normalizeLinks(navigation = {}) {
  const buckets = Array.isArray(navigation)
    ? navigation
    : Object.entries(navigation).flatMap(([menuKey, links]) =>
        (Array.isArray(links) ? links : []).map((link) => ({ ...link, menuKey })),
      );

  return buckets
    .map((link, index) => ({
      ...EMPTY_LINK,
      ...link,
      id: link.id ?? `link-${index}`,
      menuKey: link.menuKey ?? 'primary',
      label: link.label ?? 'Link',
      url: link.url ?? '#',
      description: link.description ?? '',
      icon: link.icon ?? '',
      orderIndex: Number.isFinite(link.orderIndex) ? link.orderIndex : index,
      isExternal: Boolean(link.isExternal),
      openInNewTab: Boolean(link.openInNewTab),
      allowedRoles: Array.isArray(link.allowedRoles) ? link.allowedRoles : [],
    }))
    .sort((a, b) => {
      if (a.menuKey === b.menuKey) {
        return a.orderIndex - b.orderIndex;
      }
      return a.menuKey.localeCompare(b.menuKey);
    });
}

function parseRoles(value) {
  return value
    .split(',')
    .map((role) => role.trim())
    .filter((role) => role.length > 0);
}

function LinkEditorSheet({ open, mode, value, busy = false, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_LINK);
  const [rolesDraft, setRolesDraft] = useState('');

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_LINK);
      setRolesDraft('');
      return;
    }
    const source = value ? { ...EMPTY_LINK, ...value } : { ...EMPTY_LINK };
    setForm(source);
    setRolesDraft(Array.isArray(source.allowedRoles) ? source.allowedRoles.join(', ') : '');
  }, [open, value]);

  const handleFieldChange = (field) => (event) => {
    const nextValue =
      event.target.type === 'checkbox'
        ? event.target.checked
        : field === 'orderIndex'
        ? Number(event.target.value ?? 0)
        : event.target.value;
    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      orderIndex: Number.isFinite(form.orderIndex) ? form.orderIndex : 0,
      allowedRoles: parseRoles(rolesDraft),
    };
    onSubmit?.(payload);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transform transition-opacity duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {mode === 'edit' ? 'Edit link' : 'New link'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                disabled={busy}
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-8 py-6">
            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Menu</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.menuKey}
                onChange={handleFieldChange('menuKey')}
                disabled={busy}
              >
                {MENU_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Label</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.label}
                  onChange={handleFieldChange('label')}
                  placeholder="Home"
                  disabled={busy}
                  required
                />
              </label>
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-800">URL</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.url}
                  onChange={handleFieldChange('url')}
                  placeholder="https://gigvora.com"
                  disabled={busy}
                  required
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Description</span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={form.description}
                onChange={handleFieldChange('description')}
                placeholder="Optional tooltip"
                disabled={busy}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Icon</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.icon}
                  onChange={handleFieldChange('icon')}
                  placeholder="heroicons-outline:home"
                  disabled={busy}
                />
              </label>
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Order</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={form.orderIndex}
                  onChange={handleFieldChange('orderIndex')}
                  disabled={busy}
                  min={0}
                />
              </label>
            </div>

            <label className="block text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Allowed roles</span>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={rolesDraft}
                onChange={(event) => setRolesDraft(event.target.value)}
                placeholder="admin, marketing"
                disabled={busy}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={form.isExternal}
                  onChange={handleFieldChange('isExternal')}
                  disabled={busy}
                />
                <span className="font-semibold text-slate-800">External link</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={form.openInNewTab}
                  onChange={handleFieldChange('openInNewTab')}
                  disabled={busy}
                />
                <span className="font-semibold text-slate-800">Open in new tab</span>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200 px-8 py-5">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                disabled={busy}
              >
                {busy ? 'Saving…' : 'Save link'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SiteNavigationManager({ navigation, disabled = false, onCreate, onUpdate, onDelete }) {
  const links = useMemo(() => normalizeLinks(navigation), [navigation]);
  const [activeMenu, setActiveMenu] = useState('primary');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [selectedLink, setSelectedLink] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const menuLinks = useMemo(
    () => links.filter((link) => link.menuKey === activeMenu),
    [links, activeMenu],
  );

  const openCreate = () => {
    setEditorMode('create');
    setSelectedLink({ ...EMPTY_LINK, menuKey: activeMenu, orderIndex: menuLinks.length });
    setEditorOpen(true);
    setStatus('');
    setError('');
  };

  const openEdit = (link) => {
    setEditorMode('edit');
    setSelectedLink(link);
    setEditorOpen(true);
    setStatus('');
    setError('');
  };

  const handleDelete = async (link) => {
    if (!link?.id || typeof onDelete !== 'function') {
      return;
    }
    const confirmed = window.confirm(`Remove ${link.label}?`);
    if (!confirmed) {
      return;
    }
    try {
      await onDelete(link.id);
      setStatus('Link removed');
      setError('');
    } catch (err) {
      setError(err?.message || 'Unable to remove navigation link.');
    }
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    setStatus('');
    setError('');
    try {
      if (editorMode === 'edit' && payload.id && typeof onUpdate === 'function') {
        await onUpdate(payload.id, payload);
        setStatus('Link updated');
      } else if (editorMode === 'create' && typeof onCreate === 'function') {
        await onCreate(payload);
        setStatus('Link added');
        if (payload.menuKey) {
          setActiveMenu(payload.menuKey);
        }
      }
      setEditorOpen(false);
      setSelectedLink(null);
    } catch (err) {
      setError(err?.message || 'Unable to save navigation link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Menu</h2>
          <p className="text-sm text-slate-500">Header, footer, and utility links.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {status ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              {status}
            </span>
          ) : null}
          {error ? (
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {MENU_OPTIONS.map((option) => {
          const isActive = activeMenu === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveMenu(option.value)}
              className={`min-w-[88px] rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
              disabled={disabled}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{MENU_LABELS[activeMenu]}</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          disabled={disabled}
        >
          Add link
        </button>
      </div>

      {menuLinks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
          No links yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {menuLinks.map((link) => (
            <li key={link.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                  <p className="mt-1 break-words text-xs text-slate-500">{link.url}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  #{link.orderIndex + 1}
                </span>
              </div>
              {link.allowedRoles.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {link.allowedRoles.map((role) => (
                    <span
                      key={`${link.id}-${role}`}
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}
              {link.description ? (
                <p className="mt-3 text-xs text-slate-500">{link.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(link)}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  disabled={disabled}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link)}
                  className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  disabled={disabled}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LinkEditorSheet
        open={editorOpen}
        mode={editorMode}
        value={selectedLink}
        busy={busy}
        onClose={() => {
          setEditorOpen(false);
          setSelectedLink(null);
        }}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
