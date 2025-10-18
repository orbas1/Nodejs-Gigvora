import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'disabled', label: 'Disabled' },
];

const STORAGE_CLASS_OPTIONS = [
  { value: '', label: 'Select storage class (optional)' },
  { value: 'standard', label: 'Standard' },
  { value: 'standard_ia', label: 'Standard-IA' },
  { value: 'one_zone_ia', label: 'One Zone-IA' },
  { value: 'intelligent_tiering', label: 'Intelligent-Tiering' },
  { value: 'glacier', label: 'Glacier Flexible Retrieval' },
  { value: 'glacier_deep_archive', label: 'Glacier Deep Archive' },
  { value: 'coldline', label: 'Coldline / Archive' },
];

const initialState = {
  locationId: '',
  name: '',
  description: '',
  status: 'active',
  filterPrefix: '',
  transitionAfterDays: '',
  transitionStorageClass: '',
  expireAfterDays: '',
  deleteExpiredObjects: false,
  compressObjects: false,
};

export default function LifecycleRuleDrawer({ open, rule, locations, onClose, onSubmit, onDelete, saving }) {
  const [form, setForm] = useState(initialState);
  const isEditing = Boolean(rule?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(() => {
      if (!rule) {
        return {
          ...initialState,
          locationId: locations?.[0]?.id ?? '',
        };
      }
      return {
        locationId: rule.locationId ?? locations?.[0]?.id ?? '',
        name: rule.name ?? '',
        description: rule.description ?? '',
        status: rule.status ?? 'active',
        filterPrefix: rule.filterPrefix ?? '',
        transitionAfterDays:
          rule.transitionAfterDays != null ? String(rule.transitionAfterDays) : '',
        transitionStorageClass: rule.transitionStorageClass ?? '',
        expireAfterDays: rule.expireAfterDays != null ? String(rule.expireAfterDays) : '',
        deleteExpiredObjects: Boolean(rule.deleteExpiredObjects),
        compressObjects: Boolean(rule.compressObjects),
      };
    });
  }, [rule, open, locations]);

  const disableInputs = useMemo(() => Boolean(saving), [saving]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => {
      if (type === 'checkbox') {
        return { ...previous, [name]: checked };
      }
      return { ...previous, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      locationId: form.locationId ? Number(form.locationId) : undefined,
      name: form.name || undefined,
      description: form.description || undefined,
      status: form.status || undefined,
      filterPrefix: form.filterPrefix || undefined,
      transitionStorageClass: form.transitionStorageClass || undefined,
      deleteExpiredObjects: form.deleteExpiredObjects,
      compressObjects: form.compressObjects,
    };

    if (form.transitionAfterDays !== '' && form.transitionAfterDays != null) {
      const numeric = Number(form.transitionAfterDays);
      if (!Number.isNaN(numeric)) {
        payload.transitionAfterDays = numeric;
      }
    }

    if (form.expireAfterDays !== '' && form.expireAfterDays != null) {
      const numeric = Number(form.expireAfterDays);
      if (!Number.isNaN(numeric)) {
        payload.expireAfterDays = numeric;
      }
    }

    if (typeof onSubmit === 'function') {
      await onSubmit(payload);
    }
  };

  const handleDelete = async () => {
    if (typeof onDelete === 'function' && rule?.id) {
      await onDelete();
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl bg-white shadow-xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {isEditing ? 'Edit rule' : 'New rule'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">Automate clean-up for this site.</p>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                      <div className="space-y-2">
                        <label htmlFor="locationId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Site
                        </label>
                        <select
                          id="locationId"
                          name="locationId"
                          value={form.locationId}
                          onChange={handleChange}
                          disabled={disableInputs || (isEditing && Boolean(rule?.locationId))}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        >
                          {locations.map((locationOption) => (
                            <option key={locationOption.id} value={locationOption.id}>
                              {locationOption.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Rule name
                        </label>
                        <input
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          disabled={disableInputs}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          placeholder="Archive inactive deliverables"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={form.description}
                          onChange={handleChange}
                          disabled={disableInputs}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          placeholder="Transition completed deliverables to Glacier after 30 days and purge after one year."
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="filterPrefix" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Object prefix filter
                          </label>
                          <input
                            id="filterPrefix"
                            name="filterPrefix"
                            value={form.filterPrefix}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="deliverables/"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="transitionAfterDays"
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Transition after (days)
                          </label>
                          <input
                            id="transitionAfterDays"
                            name="transitionAfterDays"
                            type="number"
                            min="1"
                            step="1"
                            value={form.transitionAfterDays}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="transitionStorageClass"
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Transition storage class
                          </label>
                          <select
                            id="transitionStorageClass"
                            name="transitionStorageClass"
                            value={form.transitionStorageClass}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {STORAGE_CLASS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="expireAfterDays" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Expire after (days)
                          </label>
                          <input
                            id="expireAfterDays"
                            name="expireAfterDays"
                            type="number"
                            min="1"
                            step="1"
                            value={form.expireAfterDays}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="deleteExpiredObjects"
                            checked={form.deleteExpiredObjects}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Delete objects once expiration threshold is reached</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="compressObjects"
                            checked={form.compressObjects}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Compress objects before archival</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          {isEditing && typeof onDelete === 'function' ? (
                            <button
                              type="button"
                              onClick={handleDelete}
                              disabled={saving}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete rule
                            </button>
                          ) : null}
                        </div>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create rule'}
                        </button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

LifecycleRuleDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  rule: PropTypes.shape({
    id: PropTypes.number,
    locationId: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.string,
    filterPrefix: PropTypes.string,
    transitionAfterDays: PropTypes.number,
    transitionStorageClass: PropTypes.string,
    expireAfterDays: PropTypes.number,
    deleteExpiredObjects: PropTypes.bool,
    compressObjects: PropTypes.bool,
  }),
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
};

LifecycleRuleDrawer.defaultProps = {
  rule: null,
  locations: [],
  onDelete: undefined,
  saving: false,
};
