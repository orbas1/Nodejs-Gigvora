import { useCallback, useEffect, useMemo, useState } from 'react';
import IdVerificationOverview from './IdVerificationOverview.jsx';
import IdVerificationQueue from './IdVerificationQueue.jsx';
import IdVerificationDetailDrawer from './IdVerificationDetailDrawer.jsx';
import IdVerificationManualIntakeForm from './IdVerificationManualIntakeForm.jsx';
import IdVerificationSettingsPanel from './IdVerificationSettingsPanel.jsx';
import {
  fetchIdentityVerificationOverview,
  fetchIdentityVerifications,
  fetchIdentityVerification,
  updateIdentityVerification,
  createIdentityVerification,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
} from '../../../services/adminIdentityVerification.js';

function normalizeFilters(filters) {
  const next = { ...(filters ?? {}) };
  if (!next.page || next.page < 1) {
    next.page = 1;
  }
  if (!next.pageSize) {
    next.pageSize = 25;
  }
  return next;
}

function updateNestedValue(source, path, value) {
  if (!Array.isArray(path) || path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  if (Array.isArray(source)) {
    const index = Number(head);
    const nextArray = source.slice();
    nextArray[index] = updateNestedValue(source[index], rest, value);
    return nextArray;
  }
  const nextObject = { ...(source ?? {}) };
  nextObject[head] = updateNestedValue(nextObject[head], rest, value);
  return nextObject;
}

const DEFAULT_SETTINGS = {
  providers: [],
  automation: {},
  documents: {},
  storage: {},
};

const SECTION_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'queue', label: 'Queue' },
];

export default function IdVerificationManagement() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [queueData, setQueueData] = useState([]);
  const [queuePagination, setQueuePagination] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [filters, setFilters] = useState(() => normalizeFilters({ page: 1, pageSize: 25 }));

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [manualBusy, setManualBusy] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [statusBanner, setStatusBanner] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);

  const [activeSection, setActiveSection] = useState('overview');
  const [manualOpen, setManualOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const refreshOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const snapshot = await fetchIdentityVerificationOverview();
      setOverview(snapshot ?? null);
    } catch (error) {
      console.error(error);
      setErrorBanner(error?.message ?? 'Unable to load identity overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const refreshQueue = useCallback(
    async (inputFilters = filters) => {
      const params = normalizeFilters(inputFilters);
      setQueueLoading(true);
      try {
        const response = await fetchIdentityVerifications(params);
        setQueueData(Array.isArray(response?.data) ? response.data : []);
        setQueuePagination(response?.pagination ?? null);
      } catch (error) {
        console.error(error);
        setErrorBanner(error?.message ?? 'Unable to load verification queue.');
      } finally {
        setQueueLoading(false);
      }
    },
    [filters],
  );

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const response = await fetchIdentityVerificationSettings();
      const resolved = response ?? DEFAULT_SETTINGS;
      setSettings(resolved);
      setSettingsDraft(resolved);
      setSettingsDirty(false);
    } catch (error) {
      console.error(error);
      setErrorBanner(error?.message ?? 'Unable to load identity verification settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOverview();
    loadSettings();
  }, [refreshOverview, loadSettings]);

  useEffect(() => {
    refreshQueue(filters);
  }, [filters, refreshQueue]);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters((previous) => ({ ...normalizeFilters(previous), ...normalizeFilters(nextFilters) }));
  }, []);

  const handleSelectVerification = useCallback(
    async (verificationId) => {
      if (!verificationId) {
        return;
      }
      try {
        const record = await fetchIdentityVerification(verificationId);
        setSelectedRecord(record);
        setSelectedId(verificationId);
        setDetailOpen(true);
      } catch (error) {
        console.error(error);
        setErrorBanner(error?.message ?? 'Unable to load verification details.');
      }
    },
    [],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedRecord(null);
    setSelectedId(null);
  }, []);

  const handleUpdateVerification = useCallback(
    async (verificationId, payload) => {
      if (!verificationId) {
        return;
      }
      await updateIdentityVerification(verificationId, payload ?? {});
      await refreshQueue();
      await refreshOverview();
      if (selectedId === verificationId) {
        const updated = await fetchIdentityVerification(verificationId);
        setSelectedRecord(updated);
      }
    },
    [refreshQueue, refreshOverview, selectedId],
  );

  const handleQueueStatusChange = useCallback(
    async (verificationId, status) => {
      try {
        await handleUpdateVerification(verificationId, { status });
        setStatusBanner('Verification status updated');
      } catch (error) {
        console.error(error);
        setErrorBanner(error?.message ?? 'Unable to update verification status.');
      }
    },
    [handleUpdateVerification],
  );

  const handleManualCreate = useCallback(
    async (payload) => {
      setManualBusy(true);
      setStatusBanner(null);
      setErrorBanner(null);
      try {
        await createIdentityVerification(payload);
        setStatusBanner('Manual verification created');
        await refreshQueue();
        await refreshOverview();
        setManualOpen(false);
      } catch (error) {
        console.error(error);
        setErrorBanner(error?.message ?? 'Unable to create verification.');
        throw error;
      } finally {
        setManualBusy(false);
      }
    },
    [refreshQueue, refreshOverview],
  );

  const handleDraftChange = useCallback((path, value) => {
    setSettingsDraft((previous) => {
      const base = previous ?? settings ?? DEFAULT_SETTINGS;
      const next = updateNestedValue(base, path, value);
      return next;
    });
    setSettingsDirty(true);
  }, [settings]);

  const handleAddProvider = useCallback(() => {
    setSettingsDraft((previous) => {
      const base = previous ?? settings ?? DEFAULT_SETTINGS;
      const list = Array.isArray(base.providers) ? base.providers.slice() : [];
      list.push({
        id: '',
        name: '',
        enabled: true,
        sandbox: true,
        webhookUrl: '',
        apiKey: '',
        apiSecret: '',
        riskPolicy: 'standard',
        allowedDocuments: [],
      });
      const next = { ...base, providers: list };
      return next;
    });
    setSettingsDirty(true);
  }, [settings]);

  const handleRemoveProvider = useCallback((index) => {
    setSettingsDraft((previous) => {
      const base = previous ?? settings ?? DEFAULT_SETTINGS;
      const list = Array.isArray(base.providers) ? base.providers.slice() : [];
      list.splice(index, 1);
      return { ...base, providers: list };
    });
    setSettingsDirty(true);
  }, [settings]);

  const handleResetSettings = useCallback(() => {
    setSettingsDraft(settings ?? DEFAULT_SETTINGS);
    setSettingsDirty(false);
  }, [settings]);

  const handleSaveSettings = useCallback(async () => {
    setSettingsSaving(true);
    setStatusBanner(null);
    setErrorBanner(null);
    try {
      const saved = await updateIdentityVerificationSettings(settingsDraft ?? DEFAULT_SETTINGS);
      setSettings(saved);
      setSettingsDraft(saved);
      setSettingsDirty(false);
      setStatusBanner('Identity verification settings saved');
      return true;
    } catch (error) {
      console.error(error);
      setErrorBanner(error?.message ?? 'Unable to update identity verification settings.');
      return false;
    } finally {
      setSettingsSaving(false);
    }
  }, [settingsDraft]);

  const storageConfig = useMemo(() => settingsDraft?.storage ?? {}, [settingsDraft?.storage]);

  return (
    <div className="space-y-6">
      {statusBanner ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">{statusBanner}</div>
      ) : null}
      {errorBanner ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{errorBanner}</div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {SECTION_TABS.map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            New case
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Settings
          </button>
        </div>
      </div>

      {activeSection === 'overview' ? (
        <IdVerificationOverview
          overview={overview}
          loading={overviewLoading}
          onRefresh={refreshOverview}
          onSelectVerification={handleSelectVerification}
        />
      ) : null}

      {activeSection === 'queue' ? (
        <IdVerificationQueue
          data={queueData}
          pagination={queuePagination}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={() => refreshQueue(filters)}
          onSelect={handleSelectVerification}
          onStatusChange={handleQueueStatusChange}
          loading={queueLoading}
          onExpand={() => setQueueExpanded(true)}
        />
      ) : null}

      <IdVerificationDetailDrawer
        open={detailOpen}
        verification={selectedRecord}
        onClose={handleCloseDetail}
        onUpdate={async (verificationId, payload) => {
          try {
            await handleUpdateVerification(verificationId, payload);
            setStatusBanner('Verification updated');
          } catch (error) {
            console.error(error);
            setErrorBanner(error?.message ?? 'Unable to update verification.');
            throw error;
          }
        }}
        storage={storageConfig}
      />

      {manualOpen ? (
        <Overlay onClose={() => setManualOpen(false)} title="New verification">
          <IdVerificationManualIntakeForm onCreate={handleManualCreate} busy={manualBusy} variant="modal" />
        </Overlay>
      ) : null}

      {settingsOpen ? (
        <Overlay onClose={() => setSettingsOpen(false)} title="Identity settings">
          <IdVerificationSettingsPanel
            draft={settingsDraft}
            dirty={settingsDirty}
            saving={settingsSaving || settingsLoading}
            onDraftChange={handleDraftChange}
            onAddProvider={handleAddProvider}
            onRemoveProvider={handleRemoveProvider}
            onReset={handleResetSettings}
            onSave={async () => {
              const saved = await handleSaveSettings();
              if (saved) {
                setSettingsOpen(false);
              }
            }}
            variant="modal"
          />
        </Overlay>
      ) : null}

      {queueExpanded ? (
        <Overlay onClose={() => setQueueExpanded(false)} title="Queue">
          <IdVerificationQueue
            data={queueData}
            pagination={queuePagination}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={() => refreshQueue(filters)}
            onSelect={(id) => {
              setQueueExpanded(false);
              handleSelectVerification(id);
            }}
            onStatusChange={handleQueueStatusChange}
            loading={queueLoading}
          />
        </Overlay>
      ) : null}
    </div>
  );
}

function Overlay({ children, title, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4 py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </header>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
