import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';

const ENCRYPTION_OPTIONS = [
  { value: '', label: 'Inherit from storage location' },
  { value: 'managed', label: 'Provider managed encryption' },
  { value: 'sse-s3', label: 'SSE-S3' },
  { value: 'sse-kms', label: 'SSE-KMS' },
  { value: 'client-side', label: 'Client-side encryption' },
  { value: 'none', label: 'No encryption (not recommended)' },
];

const initialState = {
  locationId: '',
  name: '',
  description: '',
  pathPrefix: '',
  allowedMimeTypes: '',
  allowedRoles: '',
  maxSizeMb: 50,
  requireModeration: false,
  encryption: '',
  expiresAfterMinutes: '',
  active: true,
};

function normaliseListString(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function UploadPresetDrawer({ open, preset, locations, onClose, onSubmit, onDelete, saving }) {
  const [form, setForm] = useState(initialState);
  const isEditing = Boolean(preset?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(() => {
      if (!preset) {
        return {
          ...initialState,
          locationId: locations?.[0]?.id ?? '',
        };
      }
      return {
        locationId: preset.locationId ?? locations?.[0]?.id ?? '',
        name: preset.name ?? '',
        description: preset.description ?? '',
        pathPrefix: preset.pathPrefix ?? '',
        allowedMimeTypes: Array.isArray(preset.allowedMimeTypes)
          ? preset.allowedMimeTypes.join(', ')
          : '',
        allowedRoles: Array.isArray(preset.allowedRoles) ? preset.allowedRoles.join(', ') : '',
        maxSizeMb: preset.maxSizeMb != null ? Number(preset.maxSizeMb) : 50,
        requireModeration: Boolean(preset.requireModeration),
        encryption: preset.encryption ?? '',
        expiresAfterMinutes:
          preset.expiresAfterMinutes != null ? String(preset.expiresAfterMinutes) : '',
        active: Boolean(preset.active ?? true),
      };
    });
  }, [preset, open, locations]);

  const disableInputs = useMemo(() => Boolean(saving), [saving]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => {
      if (type === 'checkbox') {
        return { ...previous, [name]: checked };
      }
      if (type === 'number') {
        return { ...previous, [name]: value === '' ? '' : Number(value) };
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
      pathPrefix: form.pathPrefix || undefined,
      allowedMimeTypes: normaliseListString(form.allowedMimeTypes),
      allowedRoles: normaliseListString(form.allowedRoles),
      maxSizeMb: form.maxSizeMb != null && form.maxSizeMb !== '' ? Number(form.maxSizeMb) : undefined,
      requireModeration: form.requireModeration,
      encryption: form.encryption || undefined,
      active: Boolean(form.active),
    };

    if (form.expiresAfterMinutes !== '' && form.expiresAfterMinutes != null) {
      const numeric = Number(form.expiresAfterMinutes);
      if (!Number.isNaN(numeric)) {
        payload.expiresAfterMinutes = numeric;
      }
    }

    if (typeof onSubmit === 'function') {
      await onSubmit(payload);
    }
  };

  const handleDelete = async () => {
    if (typeof onDelete === 'function' && preset?.id) {
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
                        {isEditing ? 'Edit preset' : 'New preset'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">Define upload guardrails for this site.</p>
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
                          disabled={disableInputs || (isEditing && Boolean(preset?.locationId))}
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
                          Preset name
                        </label>
                        <input
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          disabled={disableInputs}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          placeholder="Profile media uploads"
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
                          placeholder="Route profile images to CDN-optimised storage and flag large uploads for moderation."
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="pathPrefix" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Path prefix
                          </label>
                          <input
                            id="pathPrefix"
                            name="pathPrefix"
                            value={form.pathPrefix}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="uploads/profile-media"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="maxSizeMb" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Max file size (MB)
                          </label>
                          <input
                            id="maxSizeMb"
                            name="maxSizeMb"
                            type="number"
                            min="1"
                            step="1"
                            value={form.maxSizeMb}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label
                            htmlFor="allowedMimeTypes"
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Allowed MIME types
                          </label>
                          <input
                            id="allowedMimeTypes"
                            name="allowedMimeTypes"
                            value={form.allowedMimeTypes}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="image/png, image/jpeg, image/webp"
                          />
                          <p className="text-xs text-slate-500">Comma separated list. Leave blank to allow defaults.</p>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="allowedRoles" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Allowed roles
                          </label>
                          <input
                            id="allowedRoles"
                            name="allowedRoles"
                            value={form.allowedRoles}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="admin, company"
                          />
                          <p className="text-xs text-slate-500">Comma separated list of roles permitted to use this preset.</p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="requireModeration"
                            checked={form.requireModeration}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Flag uploads for moderation review</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="active"
                            checked={form.active}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Preset enabled</span>
                        </label>
                        <div className="space-y-2">
                          <label htmlFor="encryption" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Encryption mode
                          </label>
                          <select
                            id="encryption"
                            name="encryption"
                            value={form.encryption}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {ENCRYPTION_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="expiresAfterMinutes"
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Signed URL expiry (minutes)
                          </label>
                          <input
                            id="expiresAfterMinutes"
                            name="expiresAfterMinutes"
                            type="number"
                            min="5"
                            step="1"
                            value={form.expiresAfterMinutes}
                            onChange={handleChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
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
                              Delete preset
                            </button>
                          ) : null}
                        </div>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create preset'}
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

UploadPresetDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  preset: PropTypes.shape({
    id: PropTypes.number,
    locationId: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    pathPrefix: PropTypes.string,
    allowedMimeTypes: PropTypes.arrayOf(PropTypes.string),
    maxSizeMb: PropTypes.number,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
    requireModeration: PropTypes.bool,
    encryption: PropTypes.string,
    expiresAfterMinutes: PropTypes.number,
    active: PropTypes.bool,
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

UploadPresetDrawer.defaultProps = {
  preset: null,
  locations: [],
  onDelete: undefined,
  saving: false,
};
