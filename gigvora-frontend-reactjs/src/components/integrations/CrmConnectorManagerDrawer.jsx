import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, KeyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FieldMappingEditor from './FieldMappingEditor.jsx';
import RoleAssignmentEditor from './RoleAssignmentEditor.jsx';
import IncidentList from './IncidentList.jsx';
import SyncHistoryList from './SyncHistoryList.jsx';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const SECTIONS = [
  { id: 'settings', label: 'Settings' },
  { id: 'sync', label: 'Sync' },
  { id: 'keys', label: 'Keys' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'roles', label: 'Roles' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'history', label: 'History' },
];

function SectionNav({ active, onSelect }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4">
      {SECTIONS.map((section) => {
        const isActive = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800',
            ].join(' ')}
          >
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function CrmConnectorManagerDrawer({
  open,
  onClose,
  connector,
  defaults,
  onUpdateSettings,
  onRotateCredential,
  onUpdateFieldMappings,
  onUpdateRoleAssignments,
  onTriggerSync,
  onCreateIncident,
  onResolveIncident,
}) {
  const providerConfig = defaults?.providers?.[connector?.providerKey] ?? {};
  const syncFrequencies = defaults?.syncFrequencies ?? ['manual', 'hourly', 'daily', 'weekly'];
  const environments = defaults?.environments ?? ['production', 'sandbox'];
  const incidentSeverities = defaults?.incidentSeverities ?? ['low', 'medium', 'high', 'critical'];

  const [activeSection, setActiveSection] = useState('settings');
  const [settings, setSettings] = useState({ environment: 'production', syncFrequency: 'daily' });
  const [savingSettings, setSavingSettings] = useState(false);

  const [credentialState, setCredentialState] = useState({
    secret: '',
    credentialType: 'api_key',
    expiresAt: '',
  });
  const [rotating, setRotating] = useState(false);

  const [fieldMappings, setFieldMappings] = useState([]);
  const [savingMappings, setSavingMappings] = useState(false);

  const [roleAssignments, setRoleAssignments] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const [syncForm, setSyncForm] = useState({ trigger: 'manual', notes: '' });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!connector) {
      return;
    }
    setSettings({
      environment: connector.environment ?? 'production',
      syncFrequency: connector.syncFrequency ?? providerConfig.defaultSyncFrequency ?? 'daily',
    });
    setFieldMappings(connector.fieldMappings ?? []);
    setRoleAssignments(connector.roleAssignments ?? []);
    setCredentialState((previous) => ({
      ...previous,
      secret: '',
      expiresAt: '',
      credentialType:
        connector.authType === 'api_key'
          ? 'api_key'
          : connector.authType === 'service_account'
          ? 'service_account'
          : previous.credentialType,
    }));
    setSyncForm({ trigger: 'manual', notes: '' });
  }, [connector, providerConfig.defaultSyncFrequency]);

  useEffect(() => {
    if (open) {
      setActiveSection('settings');
    }
  }, [open]);

  const modules = providerConfig.modules ?? [];
  const lastCredential = connector?.credential ?? null;

  const openIncidents = useMemo(
    () => (connector?.incidents ?? []).filter((incident) => incident.status !== 'resolved'),
    [connector?.incidents],
  );

  const nextSyncDescription = connector?.nextSyncAt
    ? `${formatRelativeTime(connector.nextSyncAt)} · ${formatAbsolute(connector.nextSyncAt)}`
    : connector?.syncFrequency === 'manual'
    ? 'Manual only'
    : 'Scheduled when active';

  const handleSaveSettings = async () => {
    if (!connector?.providerKey || !onUpdateSettings) {
      return;
    }
    setSavingSettings(true);
    try {
      await onUpdateSettings(connector.providerKey, {
        environment: settings.environment,
        syncFrequency: settings.syncFrequency,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRotateCredential = async (event) => {
    event.preventDefault();
    if (!connector?.providerKey || !onRotateCredential || !credentialState.secret.trim()) {
      return;
    }
    setRotating(true);
    try {
      await onRotateCredential(connector.providerKey, credentialState.secret, {
        integrationId: connector.id,
        credentialType: credentialState.credentialType,
        expiresAt: credentialState.expiresAt || undefined,
      });
      setCredentialState((previous) => ({ ...previous, secret: '', expiresAt: '' }));
    } finally {
      setRotating(false);
    }
  };

  const handleSaveMappings = async () => {
    if (!connector?.providerKey || !onUpdateFieldMappings) {
      return;
    }
    setSavingMappings(true);
    try {
      await onUpdateFieldMappings(connector.providerKey, fieldMappings, { integrationId: connector.id });
    } finally {
      setSavingMappings(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!connector?.providerKey || !onUpdateRoleAssignments) {
      return;
    }
    setSavingRoles(true);
    try {
      await onUpdateRoleAssignments(connector.providerKey, roleAssignments, { integrationId: connector.id });
    } finally {
      setSavingRoles(false);
    }
  };

  const handleTriggerSync = async (event) => {
    event.preventDefault();
    if (!connector?.providerKey || !onTriggerSync) {
      return;
    }
    setSyncing(true);
    try {
      await onTriggerSync(connector.providerKey, {
        integrationId: connector.id,
        trigger: syncForm.trigger,
        notes: syncForm.notes || null,
      });
      setSyncForm({ trigger: syncForm.trigger, notes: '' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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
          <div className="flex min-h-full items-stretch justify-center p-4 text-center sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-4xl bg-white text-left shadow-2xl">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">{connector?.name}</Dialog.Title>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{connector?.environment ?? 'production'}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{connector?.syncFrequency ?? 'manual'}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{modules.length} modules</span>
                      {openIncidents.length ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-600">
                          {openIncidents.length} open incident{openIncidents.length === 1 ? '' : 's'}
                        </span>
                      ) : null}
                      {connector?.lastSyncedAt ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                          Last sync {formatRelativeTime(connector.lastSyncedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </header>

                <SectionNav active={activeSection} onSelect={setActiveSection} />

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {activeSection === 'settings' ? (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environment</label>
                          <select
                            value={settings.environment}
                            onChange={(event) =>
                              setSettings((previous) => ({ ...previous, environment: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          >
                            {environments.map((environment) => (
                              <option key={environment} value={environment}>
                                {environment.charAt(0).toUpperCase() + environment.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sync</label>
                          <select
                            value={settings.syncFrequency}
                            onChange={(event) =>
                              setSettings((previous) => ({ ...previous, syncFrequency: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          >
                            {syncFrequencies.map((frequency) => (
                              <option key={frequency} value={frequency}>
                                {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">Next sync</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{nextSyncDescription}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onTriggerSync?.(connector?.providerKey, {
                                integrationId: connector?.id,
                              })
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                          >
                            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                            Run sync
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingSettings ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === 'sync' ? (
                    <form onSubmit={handleTriggerSync} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</label>
                          <select
                            value={syncForm.trigger}
                            onChange={(event) => setSyncForm((previous) => ({ ...previous, trigger: event.target.value }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          >
                            <option value="manual">Manual</option>
                            <option value="full_resync">Full resync</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                          <input
                            type="text"
                            value={syncForm.notes}
                            onChange={(event) => setSyncForm((previous) => ({ ...previous, notes: event.target.value }))}
                            placeholder="Optional note"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={syncing}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                          {syncing ? 'Running…' : 'Run sync'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {activeSection === 'keys' ? (
                    <form onSubmit={handleRotateCredential} className="space-y-4">
                      {lastCredential ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-800">Fingerprint {lastCredential.fingerprint ?? '—'}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            Rotated {lastCredential.lastRotatedAt ? formatRelativeTime(lastCredential.lastRotatedAt) : 'unknown'}
                          </p>
                        </div>
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                          <select
                            value={credentialState.credentialType}
                            onChange={(event) =>
                              setCredentialState((previous) => ({ ...previous, credentialType: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          >
                            <option value="api_key">API key</option>
                            <option value="service_account">Service account</option>
                            <option value="oauth_refresh_token">OAuth refresh</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expires</label>
                          <input
                            type="date"
                            value={credentialState.expiresAt}
                            onChange={(event) =>
                              setCredentialState((previous) => ({ ...previous, expiresAt: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secret</label>
                        <input
                          type="password"
                          value={credentialState.secret}
                          onChange={(event) =>
                            setCredentialState((previous) => ({ ...previous, secret: event.target.value }))
                          }
                          placeholder="Paste credential"
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={rotating}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <KeyIcon className="h-4 w-4" aria-hidden="true" />
                          {rotating ? 'Rotating…' : 'Rotate'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {activeSection === 'mapping' ? (
                    <div className="space-y-4">
                      <FieldMappingEditor
                        value={fieldMappings}
                        onChange={setFieldMappings}
                        templates={providerConfig.fieldMappingTemplate ?? []}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveMappings}
                          disabled={savingMappings}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingMappings ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === 'roles' ? (
                    <div className="space-y-4">
                      <RoleAssignmentEditor
                        value={roleAssignments}
                        onChange={setRoleAssignments}
                        templates={providerConfig.roleTemplates ?? []}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveRoles}
                          disabled={savingRoles}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingRoles ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeSection === 'incidents' ? (
                    <IncidentList
                      incidents={connector?.incidents ?? []}
                      severityOptions={incidentSeverities}
                      onCreate={(payload) =>
                        onCreateIncident?.(connector?.providerKey, payload, { integrationId: connector?.id })
                      }
                      onResolve={(incidentId) =>
                        onResolveIncident?.(connector?.providerKey, incidentId, { integrationId: connector?.id })
                      }
                    />
                  ) : null}

                  {activeSection === 'history' ? (
                    <SyncHistoryList runs={connector?.syncRuns ?? []} />
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
