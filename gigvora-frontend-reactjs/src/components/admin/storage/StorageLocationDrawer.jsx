import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';

const PROVIDER_OPTIONS = [
  { value: 'cloudflare_r2', label: 'Cloudflare R2' },
  { value: 'aws_s3', label: 'Amazon S3' },
  { value: 'azure_blob', label: 'Azure Blob Storage' },
  { value: 'gcp_storage', label: 'Google Cloud Storage' },
  { value: 'digitalocean_spaces', label: 'DigitalOcean Spaces' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'disabled', label: 'Disabled' },
];

function formatDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function parseDateTimeLocal(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

const initialFormState = {
  locationKey: '',
  name: '',
  provider: 'cloudflare_r2',
  bucket: '',
  region: '',
  endpoint: '',
  publicBaseUrl: '',
  defaultPathPrefix: '',
  status: 'active',
  isPrimary: false,
  versioningEnabled: false,
  replicationEnabled: false,
  kmsKeyArn: '',
  accessKeyId: '',
  roleArn: '',
  externalId: '',
  currentUsageMb: '',
  objectCount: '',
  ingestBytes24h: '',
  egressBytes24h: '',
  errorCount24h: '',
  lastInventoryAt: '',
  secretAccessKey: '',
  secretAction: 'set',
  hasStoredSecret: false,
};

export default function StorageLocationDrawer({ open, location, onClose, onSubmit, onDelete, saving }) {
  const [form, setForm] = useState(initialFormState);
  const isEditing = Boolean(location?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(() => {
      if (!location) {
        return { ...initialFormState };
      }
      const hasStoredSecret = Boolean(location.credentials?.hasSecretAccessKey);
      return {
        ...initialFormState,
        locationKey: location.key ?? '',
        name: location.name ?? '',
        provider: location.provider ?? 'cloudflare_r2',
        bucket: location.bucket ?? '',
        region: location.region ?? '',
        endpoint: location.endpoint ?? '',
        publicBaseUrl: location.publicBaseUrl ?? '',
        defaultPathPrefix: location.defaultPathPrefix ?? '',
        status: location.status ?? 'active',
        isPrimary: Boolean(location.isPrimary),
        versioningEnabled: Boolean(location.versioningEnabled),
        replicationEnabled: Boolean(location.replicationEnabled),
        kmsKeyArn: location.kmsKeyArn ?? '',
        accessKeyId: location.credentials?.accessKeyId ?? '',
        roleArn: location.credentials?.roleArn ?? '',
        externalId: location.credentials?.externalId ?? '',
        currentUsageMb:
          location.metrics?.currentUsageMb != null ? String(location.metrics.currentUsageMb) : '',
        objectCount: location.metrics?.objectCount != null ? String(location.metrics.objectCount) : '',
        ingestBytes24h:
          location.metrics?.ingestBytes24h != null ? String(location.metrics.ingestBytes24h) : '',
        egressBytes24h:
          location.metrics?.egressBytes24h != null ? String(location.metrics.egressBytes24h) : '',
        errorCount24h:
          location.metrics?.errorCount24h != null ? String(location.metrics.errorCount24h) : '',
        lastInventoryAt: formatDateTimeLocal(location.metrics?.lastInventoryAt),
        secretAccessKey: '',
        secretAction: hasStoredSecret ? 'preserve' : 'set',
        hasStoredSecret,
      };
    });
  }, [location, open]);

  const disableInputs = useMemo(() => Boolean(saving), [saving]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => {
      if (type === 'checkbox') {
        return { ...previous, [name]: checked };
      }
      return { ...previous, [name]: value };
    });
  };

  const handleSecretChange = (event) => {
    const { value } = event.target;
    setForm((previous) => {
      const next = { ...previous, secretAccessKey: value };
      if (value && value.length) {
        next.secretAction = 'set';
      } else if (previous.hasStoredSecret) {
        next.secretAction = 'preserve';
      } else {
        next.secretAction = 'set';
      }
      return next;
    });
  };

  const handleClearSecret = () => {
    setForm((previous) => ({
      ...previous,
      secretAccessKey: '',
      secretAction: 'clear',
      hasStoredSecret: false,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      locationKey: form.locationKey || undefined,
      name: form.name || undefined,
      provider: form.provider || undefined,
      bucket: form.bucket || undefined,
      region: form.region || undefined,
      endpoint: form.endpoint || undefined,
      publicBaseUrl: form.publicBaseUrl || undefined,
      defaultPathPrefix: form.defaultPathPrefix || undefined,
      status: form.status || undefined,
      isPrimary: form.isPrimary,
      versioningEnabled: form.versioningEnabled,
      replicationEnabled: form.replicationEnabled,
      kmsKeyArn: form.kmsKeyArn || undefined,
      accessKeyId: form.accessKeyId || undefined,
      roleArn: form.roleArn || undefined,
      externalId: form.externalId || undefined,
    };

    const numericFields = [
      ['currentUsageMb', 'currentUsageMb'],
      ['objectCount', 'objectCount'],
      ['ingestBytes24h', 'ingestBytes24h'],
      ['egressBytes24h', 'egressBytes24h'],
      ['errorCount24h', 'errorCount24h'],
    ];

    numericFields.forEach(([field, key]) => {
      const value = form[field];
      if (value !== '' && value != null) {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          payload[key] = numeric;
        }
      }
    });

    const timestamp = parseDateTimeLocal(form.lastInventoryAt);
    if (timestamp) {
      payload.lastInventoryAt = timestamp;
    } else if (form.lastInventoryAt === '') {
      payload.lastInventoryAt = null;
    }

    if (form.secretAction === 'set' && form.secretAccessKey) {
      payload.secretAccessKey = form.secretAccessKey;
    } else if (form.secretAction === 'clear') {
      payload.secretAccessKey = null;
    }

    if (typeof onSubmit === 'function') {
      await onSubmit(payload);
    }
  };

  const handleDelete = async () => {
    if (typeof onDelete === 'function' && location?.id) {
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {isEditing ? 'Edit site' : 'New site'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">Connect the bucket and access details.</p>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="locationKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Location key
                          </label>
                          <input
                            id="locationKey"
                            name="locationKey"
                            value={form.locationKey}
                            onChange={handleInputChange}
                            disabled={disableInputs || isEditing}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="primary-content"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Display name
                          </label>
                          <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="Primary storage"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="provider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Provider
                          </label>
                          <select
                            id="provider"
                            name="provider"
                            value={form.provider}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          >
                            {PROVIDER_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="bucket" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bucket / container
                          </label>
                          <input
                            id="bucket"
                            name="bucket"
                            value={form.bucket}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="gigvora-app-content"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="region" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Region
                          </label>
                          <input
                            id="region"
                            name="region"
                            value={form.region}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="eu-west-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="endpoint" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            API endpoint
                          </label>
                          <input
                            id="endpoint"
                            name="endpoint"
                            value={form.endpoint}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="https://s3.eu-west-1.amazonaws.com"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label htmlFor="publicBaseUrl" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Public base URL
                          </label>
                          <input
                            id="publicBaseUrl"
                            name="publicBaseUrl"
                            value={form.publicBaseUrl}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="https://cdn.gigvora.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="defaultPathPrefix" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Default path prefix
                          </label>
                          <input
                            id="defaultPathPrefix"
                            name="defaultPathPrefix"
                            value={form.defaultPathPrefix}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="media/"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleInputChange}
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
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="isPrimary"
                            checked={form.isPrimary}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Designate as primary storage</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                          <input
                            type="checkbox"
                            name="versioningEnabled"
                            checked={form.versioningEnabled}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Object versioning enabled</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:col-span-2">
                          <input
                            type="checkbox"
                            name="replicationEnabled"
                            checked={form.replicationEnabled}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-slate-600">Cross-region replication enabled</span>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="accessKeyId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Access key ID
                          </label>
                          <input
                            id="accessKeyId"
                            name="accessKeyId"
                            value={form.accessKeyId}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="AKIA..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="roleArn" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Role ARN / principal
                          </label>
                          <input
                            id="roleArn"
                            name="roleArn"
                            value={form.roleArn}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="arn:aws:iam::123:role/gigvora-storage"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="externalId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            External ID / audience
                          </label>
                          <input
                            id="externalId"
                            name="externalId"
                            value={form.externalId}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="gigvora-platform"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="kmsKeyArn" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            KMS key ARN
                          </label>
                          <input
                            id="kmsKeyArn"
                            name="kmsKeyArn"
                            value={form.kmsKeyArn}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder="arn:aws:kms:..."
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label htmlFor="secretAccessKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Secret access key
                          </label>
                          <input
                            id="secretAccessKey"
                            name="secretAccessKey"
                            type="password"
                            value={form.secretAccessKey}
                            onChange={handleSecretChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                            placeholder={form.hasStoredSecret ? 'Secret retained - enter a new value to rotate' : 'Paste provider secret'}
                          />
                          {form.hasStoredSecret && form.secretAction === 'preserve' ? (
                            <p className="text-xs text-slate-500">Existing secret will be preserved. Enter a new value to rotate or clear it.</p>
                          ) : null}
                          {form.hasStoredSecret && form.secretAction !== 'clear' ? (
                            <button
                              type="button"
                              onClick={handleClearSecret}
                              disabled={disableInputs}
                              className="mt-2 text-xs font-semibold text-rose-600 transition hover:text-rose-500"
                            >
                              Clear stored secret
                            </button>
                          ) : null}
                          {form.secretAction === 'clear' ? (
                            <p className="text-xs text-rose-600">Secret will be removed when you save.</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="currentUsageMb" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current usage (MB)
                          </label>
                          <input
                            id="currentUsageMb"
                            name="currentUsageMb"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.currentUsageMb}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="objectCount" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Object count
                          </label>
                          <input
                            id="objectCount"
                            name="objectCount"
                            type="number"
                            min="0"
                            step="1"
                            value={form.objectCount}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="ingestBytes24h" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ingest last 24h (bytes)
                          </label>
                          <input
                            id="ingestBytes24h"
                            name="ingestBytes24h"
                            type="number"
                            min="0"
                            step="1"
                            value={form.ingestBytes24h}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="egressBytes24h" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Egress last 24h (bytes)
                          </label>
                          <input
                            id="egressBytes24h"
                            name="egressBytes24h"
                            type="number"
                            min="0"
                            step="1"
                            value={form.egressBytes24h}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="errorCount24h" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Errors last 24h
                          </label>
                          <input
                            id="errorCount24h"
                            name="errorCount24h"
                            type="number"
                            min="0"
                            step="1"
                            value={form.errorCount24h}
                            onChange={handleInputChange}
                            disabled={disableInputs}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="lastInventoryAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Last inventory timestamp
                          </label>
                          <input
                            id="lastInventoryAt"
                            name="lastInventoryAt"
                            type="datetime-local"
                            value={form.lastInventoryAt}
                            onChange={handleInputChange}
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
                              Delete location
                            </button>
                          ) : null}
                        </div>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create location'}
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

StorageLocationDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  location: PropTypes.shape({
    id: PropTypes.number,
    key: PropTypes.string,
    name: PropTypes.string,
    provider: PropTypes.string,
    bucket: PropTypes.string,
    region: PropTypes.string,
    endpoint: PropTypes.string,
    publicBaseUrl: PropTypes.string,
    defaultPathPrefix: PropTypes.string,
    status: PropTypes.string,
    isPrimary: PropTypes.bool,
    versioningEnabled: PropTypes.bool,
    replicationEnabled: PropTypes.bool,
    kmsKeyArn: PropTypes.string,
    credentials: PropTypes.shape({
      accessKeyId: PropTypes.string,
      roleArn: PropTypes.string,
      externalId: PropTypes.string,
      hasSecretAccessKey: PropTypes.bool,
    }),
    metrics: PropTypes.shape({
      currentUsageMb: PropTypes.number,
      objectCount: PropTypes.number,
      ingestBytes24h: PropTypes.number,
      egressBytes24h: PropTypes.number,
      errorCount24h: PropTypes.number,
      lastInventoryAt: PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
};

StorageLocationDrawer.defaultProps = {
  location: null,
  onDelete: undefined,
  saving: false,
};
