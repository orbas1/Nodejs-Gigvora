import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ensureDateTimeLocal } from './helpers.js';

function buildDraft(fields, item) {
  return fields.reduce((accumulator, field) => {
    if (item) {
      if (typeof field.getValue === 'function') {
        accumulator[field.name] = field.getValue(item);
      } else if (field.type === 'checkbox') {
        accumulator[field.name] = Boolean(item?.[field.name]);
      } else if (field.type === 'datetime-local') {
        accumulator[field.name] = ensureDateTimeLocal(item?.[field.name]);
      } else if (field.type === 'number') {
        const value = item?.[field.name];
        accumulator[field.name] = value == null ? '' : String(value);
      } else {
        accumulator[field.name] = item?.[field.name] ?? '';
      }
    } else if (field.type === 'checkbox') {
      accumulator[field.name] = field.defaultValue ?? false;
    } else if (field.defaultValue != null) {
      accumulator[field.name] = field.defaultValue;
    } else {
      accumulator[field.name] = '';
    }
    return accumulator;
  }, {});
}

function sanitisePayload(fields, draft, { mode, originalItem }) {
  const payload = {};
  for (const field of fields) {
    const rawValue = draft[field.name];
    if (field.required && (rawValue == null || rawValue === '' || (field.type === 'checkbox' && rawValue === false))) {
      throw new Error(`${field.label} is required.`);
    }

    let parsedValue = rawValue;
    if (typeof field.parse === 'function') {
      parsedValue = field.parse(rawValue, { mode, originalItem });
    } else if (field.type === 'number') {
      parsedValue = rawValue === '' ? null : Number(rawValue);
    } else if (field.type === 'checkbox') {
      parsedValue = Boolean(rawValue);
    } else if (typeof rawValue === 'string') {
      parsedValue = rawValue.trim();
    }

    if (parsedValue !== undefined) {
      payload[field.name] = parsedValue;
    }
  }
  return payload;
}

function FieldInput({ field, value, onChange }) {
  const commonProps = {
    id: field.name,
    name: field.name,
    value: value ?? '',
    onChange: (event) => onChange(field.name, event.target.value),
    className:
      'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100',
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case 'textarea':
      return <textarea rows={field.rows ?? 3} {...commonProps} />;
    case 'select':
      return (
        <select {...commonProps}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <input
          id={field.name}
          name={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      );
    case 'datetime-local':
      return <input type="datetime-local" {...commonProps} />;
    case 'color':
      return (
        <input
          type="color"
          id={field.name}
          name={field.name}
          value={value || '#0ea5e9'}
          onChange={(event) => onChange(field.name, event.target.value)}
          className="h-9 w-16 cursor-pointer rounded border border-slate-200"
        />
      );
    default:
      return <input type={field.type ?? 'text'} {...commonProps} />;
  }
}

FieldInput.propTypes = {
  field: PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    options: PropTypes.array,
    rows: PropTypes.number,
    placeholder: PropTypes.string,
  }).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};

export default function ResourceManager({
  title,
  description,
  items,
  fields,
  columns,
  createLabel,
  emptyLabel,
  itemName,
  loading = false,
  disabled = false,
  readOnlyMessage,
  onCreate,
  onUpdate,
  onDelete,
  lastUpdated,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [currentItem, setCurrentItem] = useState(null);
  const [draft, setDraft] = useState(() => buildDraft(fields, null));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const sortedItems = useMemo(() => (Array.isArray(items) ? [...items] : []), [items]);
  const effectiveDisabled = disabled || loading;
  const disabledTitle = effectiveDisabled && readOnlyMessage ? readOnlyMessage : undefined;

  const openCreateDialog = () => {
    if (effectiveDisabled) {
      return;
    }
    setMode('create');
    setCurrentItem(null);
    setDraft(buildDraft(fields, null));
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    if (effectiveDisabled) {
      return;
    }
    setMode('edit');
    setCurrentItem(item);
    setDraft(buildDraft(fields, item));
    setError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!saving) {
      setDialogOpen(false);
      setCurrentItem(null);
    }
  };

  const handleChange = (name, value) => {
    setDraft((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (effectiveDisabled) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = sanitisePayload(fields, draft, { mode, originalItem: currentItem });
      if (mode === 'create') {
        await onCreate?.(payload);
      } else {
        await onUpdate?.(currentItem, payload);
      }
      setDialogOpen(false);
      setCurrentItem(null);
    } catch (submitError) {
      setError(submitError?.message ?? 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    if (!onDelete || effectiveDisabled) {
      return;
    }
    const confirmed = window.confirm(`Delete this ${itemName}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }
    const executeDelete = () => {
      try {
        const result = onDelete(item);
        if (result && typeof result.then === 'function') {
          result.catch((deleteError) => {
            // eslint-disable-next-line no-alert
            window.alert(deleteError?.message ?? `Unable to delete ${itemName}.`);
          });
        }
      } catch (deleteError) {
        // eslint-disable-next-line no-alert
        window.alert(deleteError?.message ?? `Unable to delete ${itemName}.`);
      }
    };

    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      window.setTimeout(executeDelete, 0);
    } else {
      executeDelete();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-busy={loading}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          {disabled && readOnlyMessage ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
              {readOnlyMessage}
            </p>
          ) : null}
          {lastUpdated ? (
            <p className="mt-1 text-xs text-slate-400">Last refreshed {lastUpdated.toLocaleString?.() ?? lastUpdated}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateDialog}
            disabled={effectiveDisabled}
            title={disabledTitle}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            {createLabel}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 animate-pulse" aria-live="polite">
            Loading {itemName}s…
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            {emptyLabel}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {columns.map((column) => (
                    <th key={column.id} scope="col" className="px-3 py-2">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => (
                  <tr key={item.id ?? item.title} className="hover:bg-slate-50">
                    {columns.map((column) => (
                      <td key={column.id} className="px-3 py-2 align-top text-slate-700">
                        {typeof column.render === 'function' ? column.render(item) : item[column.id] ?? '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(item)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={effectiveDisabled}
                          aria-disabled={effectiveDisabled}
                          title={disabledTitle}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={effectiveDisabled}
                          aria-disabled={effectiveDisabled}
                          title={disabledTitle}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Transition.Root show={dialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDialog}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center px-4 py-8 text-center sm:items-center sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {mode === 'create' ? createLabel : `Edit ${itemName}`}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">
                        {mode === 'create' ? 'Capture a new record for this workspace.' : 'Update the existing record and save your changes.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-400 transition hover:text-slate-600"
                      onClick={closeDialog}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {fields.map((field) => (
                      <div key={field.name} className="space-y-1">
                        <label htmlFor={field.name} className="block text-sm font-semibold text-slate-700">
                          {field.label}
                          {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
                        </label>
                        <FieldInput field={field} value={draft[field.name]} onChange={handleChange} />
                        {field.helpText ? (
                          <p className="text-xs text-slate-500">{field.helpText}</p>
                        ) : null}
                      </div>
                    ))}

                    {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={closeDialog}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? 'Saving…' : mode === 'create' ? 'Create record' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}

ResourceManager.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  items: PropTypes.array,
  fields: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, render: PropTypes.func })).isRequired,
  createLabel: PropTypes.string.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  itemName: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnlyMessage: PropTypes.string,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  lastUpdated: PropTypes.instanceOf(Date),
};
