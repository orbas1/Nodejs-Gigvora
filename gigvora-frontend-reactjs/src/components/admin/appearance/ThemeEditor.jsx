import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PlusIcon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
];

function buildThemeDraft(theme) {
  return {
    id: theme?.id ?? '',
    name: theme?.name ?? '',
    slug: theme?.slug ?? '',
    status: theme?.status ?? 'draft',
    isDefault: Boolean(theme?.isDefault),
    description: theme?.description ?? '',
    tokens: {
      colors: {
        primary: theme?.tokens?.colors?.primary ?? '#2563eb',
        secondary: theme?.tokens?.colors?.secondary ?? '#0ea5e9',
        accent: theme?.tokens?.colors?.accent ?? '#f97316',
        background: theme?.tokens?.colors?.background ?? '#f8fafc',
        surface: theme?.tokens?.colors?.surface ?? '#ffffff',
        text: theme?.tokens?.colors?.textPrimary ?? '#0f172a',
      },
      typography: {
        headingFamily: theme?.tokens?.typography?.headingFamily ?? 'Inter',
        bodyFamily: theme?.tokens?.typography?.bodyFamily ?? 'Inter',
        baseFontSize: theme?.tokens?.typography?.baseFontSize ?? 16,
      },
    },
  };
}

function ThemeForm({ open, onClose, onSubmit, initialTheme, saving }) {
  const [draft, setDraft] = useState(() => buildThemeDraft(initialTheme));

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(buildThemeDraft(initialTheme));
  }, [initialTheme, open]);

  const handleChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleColorChange = (key, value) => {
    setDraft((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        colors: { ...current.tokens.colors, [key]: value },
      },
    }));
  };

  const handleTypographyChange = (field, value) => {
    setDraft((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        typography: { ...current.tokens.typography, [field]: value },
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...draft, tokens: {
      colors: {
        primary: draft.tokens.colors.primary,
        secondary: draft.tokens.colors.secondary,
        accent: draft.tokens.colors.accent,
        background: draft.tokens.colors.background,
        surface: draft.tokens.colors.surface,
        textPrimary: draft.tokens.colors.text,
      },
      typography: {
        headingFamily: draft.tokens.typography.headingFamily,
        bodyFamily: draft.tokens.typography.bodyFamily,
        baseFontSize: Number(draft.tokens.typography.baseFontSize) || 16,
      },
    } });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {draft.id ? 'Edit theme' : 'New theme'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Name</span>
                      <input
                        type="text"
                        required
                        value={draft.name}
                        onChange={(event) => handleChange('name', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Key</span>
                      <input
                        type="text"
                        required
                        value={draft.slug}
                        onChange={(event) => handleChange('slug', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Status</span>
                      <select
                        value={draft.status}
                        onChange={(event) => handleChange('status', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                      <input
                        id="theme-default"
                        type="checkbox"
                        checked={draft.isDefault}
                        onChange={(event) => handleChange('isDefault', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Make default</span>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {COLOR_FIELDS.map((field) => (
                      <label key={field.key} className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">{field.label}</span>
                        <input
                          type="color"
                          value={draft.tokens.colors[field.key]}
                          onChange={(event) => handleColorChange(field.key, event.target.value)}
                          className="h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Heading font</span>
                      <input
                        type="text"
                        value={draft.tokens.typography.headingFamily}
                        onChange={(event) => handleTypographyChange('headingFamily', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Body font</span>
                      <input
                        type="text"
                        value={draft.tokens.typography.bodyFamily}
                        onChange={(event) => handleTypographyChange('bodyFamily', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Base size</span>
                      <input
                        type="number"
                        min="12"
                        max="22"
                        value={draft.tokens.typography.baseFontSize}
                        onChange={(event) => handleTypographyChange('baseFontSize', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-400"
                    >
                      {saving ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function ThemeCard({ theme, onEdit, onMakeDefault, onRemove, disabled }) {
  const colors = theme?.tokens?.colors ?? {};
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{theme.name}</p>
          <p className="text-sm text-slate-500">{theme.slug}</p>
        </div>
        {theme.isDefault ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Live
          </span>
        ) : null}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Object.entries(colors)
          .slice(0, 6)
          .map(([key, value]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{key}</span>
              <span
                className="h-12 w-full rounded-2xl border border-slate-200"
                style={{ backgroundColor: value }}
              />
            </div>
          ))}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <SwatchIcon className="h-4 w-4" />
          <span>{theme.status}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(theme)}
            disabled={disabled}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onMakeDefault(theme)}
            disabled={disabled || theme.isDefault}
            className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-600 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => onRemove(theme)}
            disabled={disabled}
            aria-label={`Delete theme ${theme.name}`}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThemeEditor({
  themes = [],
  isLoading,
  onCreateTheme,
  onUpdateTheme,
  onActivateTheme,
  onDeleteTheme,
  onNotify,
}) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [saving, setSaving] = useState(false);

  const sortedThemes = useMemo(() => {
    return [...themes].sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? 1 : -1;
    });
  }, [themes]);

  const handleOpenCreate = () => {
    setSelectedTheme(null);
    setOpen(true);
  };

  const handleOpenEdit = (theme) => {
    setSelectedTheme(theme);
    setOpen(true);
  };

  const handleSubmit = async (draft) => {
    setSaving(true);
    try {
      if (draft.id) {
        await onUpdateTheme(draft.id, {
          name: draft.name,
          slug: draft.slug,
          status: draft.status,
          isDefault: draft.isDefault,
          tokens: draft.tokens,
        });
        onNotify?.('Theme saved', 'success');
      } else {
        await onCreateTheme({
          name: draft.name,
          slug: draft.slug,
          status: draft.status,
          isDefault: draft.isDefault,
          tokens: draft.tokens,
        });
        onNotify?.('Theme created', 'success');
      }
      setOpen(false);
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to save theme', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (theme) => {
    try {
      await onActivateTheme(theme.id);
      onNotify?.('Theme made live', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to make theme live', 'error');
    }
  };

  const handleDelete = async (theme) => {
    if (!window.confirm(`Delete theme ${theme.name}?`)) {
      return;
    }
    try {
      await onDeleteTheme(theme.id);
      onNotify?.('Theme removed', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to delete theme', 'error');
    }
  };

  return (
    <section id="view-themes" className="space-y-6 rounded-4xl border border-slate-200 bg-slate-50/80 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Themes</h2>
          <p className="text-sm text-slate-500">Control colors and fonts for the platform.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading themes…</div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {sortedThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onEdit={handleOpenEdit}
            onMakeDefault={handleSetDefault}
            onRemove={handleDelete}
            disabled={saving}
          />
        ))}
        {sortedThemes.length === 0 && !isLoading ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
            <p className="text-sm font-medium text-slate-500">No themes yet</p>
            <p className="text-xs text-slate-400">Create a theme to get started.</p>
          </div>
        ) : null}
      </div>

      <ThemeForm
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        onSubmit={handleSubmit}
        initialTheme={selectedTheme}
        saving={saving}
      />
    </section>
  );
}
