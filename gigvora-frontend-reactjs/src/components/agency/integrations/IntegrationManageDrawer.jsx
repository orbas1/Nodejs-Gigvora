import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  KeyIcon,
  LinkIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'connected', label: 'Connected' },
  { value: 'pending', label: 'Pending' },
  { value: 'disconnected', label: 'Disconnected' },
  { value: 'error', label: 'Error' },
];

const SYNC_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const SECRET_TYPES = [
  { value: 'api_key', label: 'API key' },
  { value: 'oauth_token', label: 'OAuth token' },
  { value: 'webhook_secret', label: 'Webhook secret' },
  { value: 'custom', label: 'Custom' },
];

const STATUS_TONES = {
  connected: 'bg-emerald-500',
  pending: 'bg-amber-500',
  disconnected: 'bg-slate-400',
  error: 'bg-rose-500',
};

function listToString(list) {
  if (!Array.isArray(list)) {
    return '';
  }
  return list.join(', ');
}

function stringToList(value) {
  if (!value) {
    return [];
  }
  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter((item, index, self) => item.length > 0 && self.indexOf(item) === index);
}

function createDraft(integration) {
  return {
    displayName: integration?.displayName ?? '',
    status: integration?.status ?? 'pending',
    syncFrequency: integration?.syncFrequency ?? 'daily',
    owner: integration?.metadata?.owner ?? '',
    environment: integration?.metadata?.environment ?? '',
    regions: listToString(integration?.metadata?.regions),
    scopes: listToString(integration?.metadata?.scopes),
    channels: listToString(integration?.metadata?.channels),
    notes: integration?.metadata?.notes ?? '',
  };
}

function SecretManager({ integration, onRotateSecret }) {
  const [open, setOpen] = useState(false);
  const [activeSecretId, setActiveSecretId] = useState(null);
  const [form, setForm] = useState({ name: '', secretType: SECRET_TYPES[0].value, secretValue: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(false);
    setActiveSecretId(null);
    setForm({ name: '', secretType: SECRET_TYPES[0].value, secretValue: '' });
    setSaving(false);
    setError(null);
  }, [integration?.id]);

  const handleOpen = (secret = null) => {
    if (secret) {
      setActiveSecretId(secret.id);
      setForm({ name: secret.name ?? '', secretType: secret.secretType ?? SECRET_TYPES[0].value, secretValue: '' });
    } else {
      setActiveSecretId(null);
      setForm({ name: `${integration.displayName} credential`, secretType: SECRET_TYPES[0].value, secretValue: '' });
    }
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.secretValue || form.secretValue.trim().length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onRotateSecret(integration.id, {
        secretId: activeSecretId ?? undefined,
        name: form.name,
        secretType: form.secretType,
        secretValue: form.secretValue,
      });
      setOpen(false);
      setForm({ name: '', secretType: SECRET_TYPES[0].value, secretValue: '' });
      setActiveSecretId(null);
    } catch (err) {
      setError(err?.message ?? 'Unable to save credential.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Credentials</h3>
        <button
          type="button"
          onClick={() => handleOpen()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
      {integration?.secrets?.length ? (
        <ul className="space-y-2 text-sm text-slate-700">
          {integration.secrets.map((secret) => (
            <li key={secret.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div>
                <p className="font-semibold text-slate-800">{secret.name}</p>
                <p className="text-xs text-slate-500">
                  Rotated {secret.lastRotatedAt ? new Date(secret.lastRotatedAt).toLocaleString() : 'never'} · ****{secret.lastFour ?? '----'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpen(secret)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                <KeyIcon className="h-4 w-4" aria-hidden="true" />
                Rotate
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No credentials yet.</p>
      )}

      {open ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{activeSecretId ? 'Rotate credential' : 'New credential'}</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 transition hover:text-slate-700">
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Label
            <input
              className="mt-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
            <select
              className="mt-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              value={form.secretType}
              onChange={(event) => setForm((prev) => ({ ...prev, secretType: event.target.value }))}
            >
              {SECRET_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Secret
            <input
              className="mt-1 rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
              value={form.secretValue}
              onChange={(event) => setForm((prev) => ({ ...prev, secretValue: event.target.value }))}
              type="password"
              placeholder="Paste secret"
            />
          </label>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Saving…' : activeSecretId ? 'Rotate' : 'Create'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function WebhookWizard({
  open,
  webhook,
  eventCatalog,
  onClose,
  onSubmit,
  submitting,
}) {
  const steps = ['basics', 'events', 'security'];
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [values, setValues] = useState(() => ({
    name: webhook?.name ?? 'Automation webhook',
    status: webhook?.status ?? 'active',
    targetUrl: webhook?.targetUrl ?? '',
    eventTypes: webhook?.eventTypes ?? [],
    verificationToken: webhook?.verificationToken ?? '',
    secretValue: '',
  }));

  const groupedEvents = useMemo(() => eventCatalog ?? [], [eventCatalog]);
  const selectedEvents = useMemo(() => new Set(values.eventTypes ?? []), [values.eventTypes]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setValues({
        name: webhook?.name ?? 'Automation webhook',
        status: webhook?.status ?? 'active',
        targetUrl: webhook?.targetUrl ?? '',
        eventTypes: webhook?.eventTypes ?? [],
        verificationToken: webhook?.verificationToken ?? '',
        secretValue: '',
      });
      setError(null);
      return;
    }
    setValues({
      name: webhook?.name ?? 'Automation webhook',
      status: webhook?.status ?? 'active',
      targetUrl: webhook?.targetUrl ?? '',
      eventTypes: webhook?.eventTypes ?? [],
      verificationToken: webhook?.verificationToken ?? '',
      secretValue: '',
    });
    setStepIndex(0);
    setError(null);
  }, [open, webhook]);

  const toggleEvent = (eventKey) => {
    setValues((prev) => {
      const next = new Set(prev.eventTypes ?? []);
      if (next.has(eventKey)) {
        next.delete(eventKey);
      } else {
        next.add(eventKey);
      }
      return { ...prev, eventTypes: Array.from(next) };
    });
  };

  const validateBasics = () => {
    if (!values.name || !values.targetUrl) {
      setError('Name and URL are required.');
      return false;
    }
    try {
      const parsed = new URL(values.targetUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Protocol');
      }
    } catch (err) {
      setError('Enter a valid URL.');
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (steps[stepIndex] === 'basics' && !validateBasics()) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
    setError(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateBasics()) {
      setStepIndex(0);
      return;
    }
    onSubmit?.({
      name: values.name,
      status: values.status,
      targetUrl: values.targetUrl,
      eventTypes: values.eventTypes,
      verificationToken: values.verificationToken,
      secretValue: values.secretValue ? values.secretValue : undefined,
    });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={submitting ? () => {} : onClose}>
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
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white p-6 shadow-2xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {webhook ? 'Edit webhook' : 'New webhook'}
                </Dialog.Title>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  Step {stepIndex + 1} of {steps.length}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {steps[stepIndex] === 'basics' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Name
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={values.name}
                          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Status
                        <select
                          className="mt-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={values.status}
                          onChange={(event) => setValues((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700 sm:col-span-2">
                        Target URL
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={values.targetUrl}
                          onChange={(event) => setValues((prev) => ({ ...prev, targetUrl: event.target.value }))}
                          placeholder="https://example.com/webhook"
                        />
                      </label>
                    </div>
                  ) : null}

                  {steps[stepIndex] === 'events' ? (
                    <div className="space-y-3">
                      {groupedEvents.length ? (
                        groupedEvents.map((group) => (
                          <div key={group.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(group.events ?? []).map((event) => {
                                const checked = selectedEvents.has(event.key);
                                return (
                                  <button
                                    key={event.key}
                                    type="button"
                                    onClick={() => toggleEvent(event.key)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                      checked
                                        ? 'bg-accent text-white shadow-sm'
                                        : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                                    }`}
                                  >
                                    {event.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No events published for this provider.</p>
                      )}
                    </div>
                  ) : null}

                  {steps[stepIndex] === 'security' ? (
                    <div className="grid gap-4">
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Verification token
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={values.verificationToken}
                          onChange={(event) => setValues((prev) => ({ ...prev, verificationToken: event.target.value }))}
                          placeholder="Optional token"
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-700">
                        Rotate secret
                        <input
                          className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                          value={values.secretValue}
                          onChange={(event) => setValues((prev) => ({ ...prev, secretValue: event.target.value }))}
                          placeholder="Optional new signing secret"
                          type="password"
                        />
                      </label>
                    </div>
                  ) : null}

                  {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={stepIndex === 0 ? onClose : goBack}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                      disabled={submitting}
                    >
                      <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                      {stepIndex === 0 ? 'Close' : 'Back'}
                    </button>
                    {stepIndex === steps.length - 1 ? (
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting ? 'Saving…' : 'Save webhook'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Next
                      </button>
                    )}
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

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'creds', label: 'Creds' },
  { id: 'hooks', label: 'Hooks' },
  { id: 'run', label: 'Run' },
];

export default function IntegrationManageDrawer({
  open,
  integration,
  availableProviders,
  webhookEventCatalog,
  onClose,
  onUpdate,
  onRotateSecret,
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestConnection,
}) {
  const provider = useMemo(
    () => availableProviders?.find((item) => item.key === integration?.providerKey) ?? null,
    [availableProviders, integration?.providerKey],
  );
  const [activeTab, setActiveTab] = useState('info');
  const [draft, setDraft] = useState(() => createDraft(integration));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [webhookEditor, setWebhookEditor] = useState({ open: false, webhook: null });
  const [webhookSaving, setWebhookSaving] = useState(false);

  useEffect(() => {
    setDraft(createDraft(integration));
    setActiveTab('info');
    setTestResult(null);
    setWebhookEditor({ open: false, webhook: null });
  }, [integration]);

  useEffect(() => {
    if (!open) {
      setDraft(createDraft(integration));
      setActiveTab('info');
      setTestResult(null);
      setWebhookEditor({ open: false, webhook: null });
    }
  }, [open, integration]);

  if (!integration) {
    return null;
  }

  const handleFieldChange = (field) => (event) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onUpdate(integration.id, {
        displayName: draft.displayName,
        status: draft.status,
        syncFrequency: draft.syncFrequency,
        metadata: {
          owner: draft.owner,
          environment: draft.environment,
          regions: stringToList(draft.regions),
          scopes: stringToList(draft.scopes),
          channels: stringToList(draft.channels),
          notes: draft.notes,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await onTestConnection(integration.id);
      setTestResult({
        status: result?.status ?? 'unknown',
        latency: result?.latencyMs ?? null,
        checkedAt: Date.now(),
        error: null,
      });
    } catch (error) {
      setTestResult({ status: 'error', error: error?.message ?? 'Unable to test connection.', checkedAt: Date.now() });
    } finally {
      setTesting(false);
    }
  };

  const openWebhook = (webhook = null) => {
    setWebhookEditor({ open: true, webhook });
  };

  const closeWebhook = () => {
    setWebhookEditor({ open: false, webhook: null });
  };

  const saveWebhook = async (payload) => {
    setWebhookSaving(true);
    try {
      if (webhookEditor.webhook) {
        await onUpdateWebhook(integration.id, webhookEditor.webhook.id, payload);
      } else {
        await onCreateWebhook(integration.id, payload);
      }
      setWebhookEditor({ open: false, webhook: null });
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleDeleteWebhook = async (webhook) => {
    if (!window.confirm(`Remove webhook "${webhook.name}"?`)) {
      return;
    }
    await onDeleteWebhook(integration.id, webhook.id);
  };

  const statusTone = STATUS_TONES[integration.status] ?? STATUS_TONES.pending;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving || webhookSaving ? () => {} : onClose}>
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
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full justify-end p-0">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="flex h-full w-full max-w-4xl flex-col overflow-y-auto bg-white shadow-2xl">
                  <header className="border-b border-slate-200 bg-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusTone}`} />
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {provider?.name ?? integration.providerKey}
                          </p>
                        </div>
                        <Dialog.Title className="text-2xl font-semibold text-slate-900">
                          {integration.displayName}
                        </Dialog.Title>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Sync {integration.syncFrequency}</span>
                          {integration.metadata?.owner ? <span>Owner {integration.metadata.owner}</span> : null}
                          {integration.lastSyncedAt ? <span>Last sync {new Date(integration.lastSyncedAt).toLocaleString()}</span> : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        disabled={saving || webhookSaving}
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    <nav className="mt-6 flex gap-2">
                      {TABS.map((tab) => {
                        const active = tab.id === activeTab;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                              active
                                ? 'bg-accent text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </header>

                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {activeTab === 'info' ? (
                      <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Name
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.displayName}
                              onChange={handleFieldChange('displayName')}
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Status
                            <select
                              className="mt-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.status}
                              onChange={handleFieldChange('status')}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Sync
                            <select
                              className="mt-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.syncFrequency}
                              onChange={handleFieldChange('syncFrequency')}
                            >
                              {SYNC_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Owner
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.owner}
                              onChange={handleFieldChange('owner')}
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Environment
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.environment}
                              onChange={handleFieldChange('environment')}
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Regions
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.regions}
                              onChange={handleFieldChange('regions')}
                              placeholder="us-east-1, eu-west-1"
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700">
                            Channels
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.channels}
                              onChange={handleFieldChange('channels')}
                              placeholder="#revops, alerts"
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700 sm:col-span-2">
                            Scopes
                            <input
                              className="mt-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.scopes}
                              onChange={handleFieldChange('scopes')}
                              placeholder="api, refresh_token"
                            />
                          </label>
                          <label className="flex flex-col text-sm font-medium text-slate-700 sm:col-span-2">
                            Notes
                            <textarea
                              className="mt-1 min-h-[100px] rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none"
                              value={draft.notes}
                              onChange={handleFieldChange('notes')}
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setDraft(createDraft(integration))}
                            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                            disabled={saving}
                          >
                            Reset
                          </button>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={saving}
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    {activeTab === 'creds' ? (
                      <SecretManager integration={integration} onRotateSecret={onRotateSecret} />
                    ) : null}

                    {activeTab === 'hooks' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-900">Webhooks</h3>
                          <button
                            type="button"
                            onClick={() => openWebhook(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            <PlusIcon className="h-4 w-4" aria-hidden="true" />
                            Add
                          </button>
                        </div>
                        {integration.webhooks?.length ? (
                          <ul className="space-y-3 text-sm text-slate-700">
                            {integration.webhooks.map((webhook) => (
                              <li key={webhook.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{webhook.name}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                      <span className="inline-flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />{webhook.targetUrl}</span>
                                      <span>Status {webhook.status}</span>
                                      <span>{webhook.eventTypes?.length ?? 0} events</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openWebhook(webhook)}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWebhook(webhook)}
                                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                    >
                                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                {webhook.secret ? (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Signing secret ****{webhook.secret.lastFour ?? '----'} (v{webhook.secret.version ?? 1})
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">No webhooks yet.</p>
                        )}
                      </div>
                    ) : null}

                    {activeTab === 'run' ? (
                      <div className="space-y-5">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Connection check</p>
                              <p className="text-xs text-slate-500">
                                {testResult?.checkedAt
                                  ? `Checked ${new Date(testResult.checkedAt).toLocaleString()}`
                                  : 'Run a live test to validate credentials.'}
                              </p>
                              {testResult ? (
                                <p
                                  className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                    testResult.error
                                      ? 'bg-rose-100 text-rose-700'
                                      : testResult.status === 'connected'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                                  {testResult.error
                                    ? testResult.error
                                    : `Status ${testResult.status}${
                                        testResult.latency != null ? ` · ${testResult.latency}ms` : ''
                                      }`}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={handleTest}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                              disabled={testing}
                            >
                              <ArrowPathIcon className={`h-5 w-5 ${testing ? 'animate-spin' : ''}`} aria-hidden="true" />
                              {testing ? 'Testing…' : 'Run test'}
                            </button>
                          </div>
                        </div>
                        {provider?.docsUrl ? (
                          <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accentDark"
                          >
                            Provider docs
                          </a>
                        ) : null}
                        {integration.incidents?.length ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-900">Incidents</p>
                            <ul className="space-y-2">
                              {integration.incidents.map((incident, index) => (
                                <li
                                  key={incident.id ?? index}
                                  className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                                >
                                  {incident.summary ?? incident.description ?? 'Incident'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <WebhookWizard
                    open={webhookEditor.open}
                    webhook={webhookEditor.webhook}
                    eventCatalog={webhookEventCatalog}
                    onClose={closeWebhook}
                    onSubmit={saveWebhook}
                    submitting={webhookSaving}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
