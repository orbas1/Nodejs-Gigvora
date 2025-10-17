import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  listIdentityVerifications,
  fetchIdentityVerificationSummary,
  createIdentityVerification,
  updateIdentityVerification,
  createIdentityVerificationEvent,
  fetchIdentityVerificationSettings,
  updateIdentityVerificationSettings,
} from '../../../services/identityVerification.js';
import {
  DEFAULT_CREATE_FORM,
  DEFAULT_FILTERS,
  DEFAULT_NOTE_FORM,
  DEFAULT_SETTINGS_FORM,
  RISK_LABELS,
  STATUS_LABELS,
} from './constants.js';
import {
  classNames,
  formatNumber,
  normalizeDateTimeLocal,
  parseWorkspaceId,
  sanitizeCommaSeparated,
} from './utils.js';
import IdVerificationQueuePanel from './IdVerificationQueuePanel.jsx';
import IdVerificationFilterDrawer from './IdVerificationFilterDrawer.jsx';
import IdVerificationDetailDrawer from './IdVerificationDetailDrawer.jsx';
import IdVerificationCreateWizard from './IdVerificationCreateWizard.jsx';
import IdVerificationSettingsPanel from './IdVerificationSettingsPanel.jsx';
import IdVerificationActivityPanel from './IdVerificationActivityPanel.jsx';

export default function IdVerificationHub({ workspaceId, workspaceSlug, canManage }) {
  const resolvedWorkspaceId = useMemo(() => parseWorkspaceId(workspaceId), [workspaceId]);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [verifications, setVerifications] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [filtersMeta, setFiltersMeta] = useState({ statuses: [], riskLevels: [] });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS_FORM);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settings, setSettings] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeVerification, setActiveVerification] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [noteForm, setNoteForm] = useState(DEFAULT_NOTE_FORM);
  const [noteBusy, setNoteBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createBusy, setCreateBusy] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [activityEvents, setActivityEvents] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (resolvedWorkspaceId && !createOpen) {
      setCreateForm((previous) => ({ ...previous, workspaceId: resolvedWorkspaceId }));
    }
  }, [resolvedWorkspaceId, createOpen]);

  useEffect(() => {
    if (!createOpen) {
      setCreateBusy(false);
      setCreateForm((previous) => ({ ...DEFAULT_CREATE_FORM, workspaceId: previous.workspaceId }));
    }
  }, [createOpen]);

  useEffect(() => {
    if (!detailOpen) {
      setDetailBusy(false);
      setDetailForm(null);
      setNoteForm(DEFAULT_NOTE_FORM);
    }
  }, [detailOpen]);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      includeEvents: false,
      search: filters.search || undefined,
      workspaceId: resolvedWorkspaceId || undefined,
      status: filters.status.length ? filters.status.join(',') : undefined,
      riskLevel: filters.riskLevel.length ? filters.riskLevel.join(',') : undefined,
      requiresManualReview: filters.requiresManualReview == null ? undefined : filters.requiresManualReview,
      requiresReverification:
        filters.requiresReverification == null ? undefined : filters.requiresReverification,
    };

    listIdentityVerifications(params, { signal: abortController.signal })
      .then((response) => {
        setVerifications(response.data ?? []);
        setReviewers(response.reviewers ?? []);
        setFiltersMeta({
          statuses: response.filters?.statuses ?? [],
          riskLevels: response.filters?.riskLevels ?? [],
        });
        setPagination((previous) => ({
          ...previous,
          total: response.pagination?.total ?? 0,
          totalPages: response.pagination?.totalPages ?? 1,
        }));
      })
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') {
          setError(loadError);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [filters, pagination.page, pagination.pageSize, resolvedWorkspaceId, refreshToken]);

  useEffect(() => {
    const abortController = new AbortController();
    setSummaryLoading(true);
    fetchIdentityVerificationSummary(
      { workspaceId: resolvedWorkspaceId || undefined },
      { signal: abortController.signal },
    )
      .then((response) => {
        setSummary(response);
      })
      .catch(() => {})
      .finally(() => {
        if (!abortController.signal.aborted) {
          setSummaryLoading(false);
        }
      });

    return () => abortController.abort();
  }, [resolvedWorkspaceId, refreshToken]);

  useEffect(() => {
    if (!canManage) {
      return undefined;
    }
    const abortController = new AbortController();
    fetchIdentityVerificationSettings(
      { workspaceId: resolvedWorkspaceId || undefined },
      { signal: abortController.signal },
    )
      .then((response) => {
        setSettings(response);
        const payload = response?.settings ?? {};
        setSettingsForm({
          automationEnabled: Boolean(payload.automationEnabled),
          requireSelfie: Boolean(payload.requireSelfie),
          autoAssignReviewerId: payload.autoAssignReviewerId ?? '',
          manualReviewThreshold: payload.manualReviewThreshold ?? DEFAULT_SETTINGS_FORM.manualReviewThreshold,
          reminderCadenceHours: payload.reminderCadenceHours ?? DEFAULT_SETTINGS_FORM.reminderCadenceHours,
          reminderChannels: Array.isArray(payload.reminderChannels)
            ? payload.reminderChannels.join(',')
            : payload.reminderChannels ?? DEFAULT_SETTINGS_FORM.reminderChannels,
          escalateAfterHours: payload.escalateAfterHours ?? DEFAULT_SETTINGS_FORM.escalateAfterHours,
          allowedDocumentTypes: Array.isArray(payload.allowedDocumentTypes)
            ? payload.allowedDocumentTypes.join(',')
            : payload.allowedDocumentTypes ?? DEFAULT_SETTINGS_FORM.allowedDocumentTypes,
          autoArchiveAfterDays: payload.autoArchiveAfterDays ?? DEFAULT_SETTINGS_FORM.autoArchiveAfterDays,
          autoReminderTemplateKey: payload.autoReminderTemplateKey ?? '',
          allowProvisionalPass: Boolean(payload.allowProvisionalPass),
        });
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [canManage, resolvedWorkspaceId, refreshToken]);

  useEffect(() => {
    if (activeVerification) {
      setDetailForm({
        id: activeVerification.id,
        status: activeVerification.status,
        riskLevel: activeVerification.riskLevel ?? 'low',
        riskScore: activeVerification.riskScore ?? '',
        assignedReviewerId: activeVerification.assignedReviewerId ?? '',
        reviewerId: activeVerification.reviewerId ?? '',
        reviewNotes: activeVerification.reviewNotes ?? '',
        requiresManualReview: Boolean(activeVerification.requiresManualReview),
        requiresReverification: Boolean(activeVerification.requiresReverification),
        nextReviewAt: activeVerification.nextReviewAt ?? '',
        reverificationIntervalDays: activeVerification.reverificationIntervalDays ?? '',
        assignmentNotes: activeVerification.assignmentNotes ?? '',
        tags: Array.isArray(activeVerification.tags) ? activeVerification.tags.join(',') : activeVerification.tags ?? '',
        autoReverificationChannel: activeVerification.autoReverificationChannel ?? '',
        declinedReason: activeVerification.declinedReason ?? '',
        lastReminderSentAt: activeVerification.lastReminderSentAt ?? '',
        escalatedAt: activeVerification.escalatedAt ?? '',
        escalationState: activeVerification.escalationState ?? '',
      });
    }
  }, [activeVerification]);

  const statusOptions = useMemo(() => {
    if (filtersMeta.statuses?.length) {
      return filtersMeta.statuses;
    }
    return Object.keys(STATUS_LABELS);
  }, [filtersMeta.statuses]);

  const riskOptions = useMemo(() => {
    if (filtersMeta.riskLevels?.length) {
      return filtersMeta.riskLevels;
    }
    return Object.keys(RISK_LABELS);
  }, [filtersMeta.riskLevels]);

  const summaryCards = useMemo(() => {
    return [
      {
        id: 'waiting',
        label: 'Waiting',
        value: summary ? formatNumber(summary.manualBacklog) : '—',
        caption: 'Manual queue',
        tone: summary?.manualBacklog > 10 ? 'alert' : undefined,
      },
      {
        id: 'speed',
        label: 'Avg review',
        value: summary?.averageReviewHours != null ? `${formatNumber(summary.averageReviewHours)} hrs` : '—',
        caption: 'Last 1k checks',
        tone: summary?.averageReviewHours && summary.averageReviewHours > 72 ? 'alert' : undefined,
      },
      {
        id: 'reverify',
        label: 'Reverify',
        value: summary ? formatNumber(summary.reverificationQueue) : '—',
        caption: 'Follow up needed',
        tone: summary?.reverificationQueue > 5 ? 'alert' : undefined,
      },
    ];
  }, [summary]);

  const tabs = useMemo(() => {
    const base = [{ id: 'queue', label: 'Queue' }];
    if (canManage) {
      base.push({ id: 'settings', label: 'Settings' });
    }
    base.push({ id: 'activity', label: 'Activity' });
    return base;
  }, [canManage]);

  const handleRefresh = useCallback(() => {
    setRefreshToken((previous) => previous + 1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    setPagination((previous) => ({ ...previous, page: nextPage }));
  }, []);

  const handlePageSizeChange = useCallback((nextSize) => {
    setPagination((previous) => ({ ...previous, pageSize: nextSize, page: 1 }));
  }, []);

  const handleFiltersOpen = useCallback(() => {
    setPendingFilters(filters);
    setFilterDrawerOpen(true);
  }, [filters]);

  const handleFiltersApply = useCallback(() => {
    setFilterDrawerOpen(false);
    setFilters(pendingFilters);
    setPagination((previous) => ({ ...previous, page: 1 }));
  }, [pendingFilters]);

  const handleFiltersClear = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
  }, []);

  const handleFiltersChange = useCallback((nextFilters) => {
    setPendingFilters(nextFilters);
  }, []);

  const handleOpenDetail = useCallback((verification) => {
    setActiveVerification(verification);
    setDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setActiveVerification(null);
  }, []);

  const handlePreviewDocument = useCallback((key) => {
    if (!key) {
      return;
    }
    const url = `/compliance/documents/${encodeURIComponent(key)}`;
    window.open(url, '_blank', 'noopener');
  }, []);

  const handleCreateVerification = useCallback(async () => {
    setCreateBusy(true);
    try {
      const providedWorkspaceId = parseWorkspaceId(createForm.workspaceId);
      const targetWorkspaceId = resolvedWorkspaceId ?? providedWorkspaceId;
      if (!targetWorkspaceId) {
        throw new Error('Workspace ID is required');
      }

      let metadataPayload;
      if (createForm.metadata) {
        metadataPayload = JSON.parse(createForm.metadata);
      }

      const payload = {
        ...createForm,
        userId: Number(createForm.userId),
        profileId: createForm.profileId ? Number(createForm.profileId) : undefined,
        workspaceId: targetWorkspaceId,
        riskScore: createForm.riskScore ? Number(createForm.riskScore) : undefined,
        reviewerId: createForm.reviewerId ? Number(createForm.reviewerId) : undefined,
        assignedReviewerId: createForm.assignedReviewerId ? Number(createForm.assignedReviewerId) : undefined,
        requiresManualReview: Boolean(createForm.requiresManualReview),
        requiresReverification: Boolean(createForm.requiresReverification),
        reverificationIntervalDays: createForm.reverificationIntervalDays
          ? Number(createForm.reverificationIntervalDays)
          : undefined,
        tags: sanitizeCommaSeparated(createForm.tags),
        metadata: metadataPayload,
        lastReminderSentAt: normalizeDateTimeLocal(createForm.lastReminderSentAt),
        escalatedAt: normalizeDateTimeLocal(createForm.escalatedAt),
      };

      await createIdentityVerification(payload);
      setCreateOpen(false);
      setCreateForm((previous) => ({ ...DEFAULT_CREATE_FORM, workspaceId: previous.workspaceId }));
      handleRefresh();
    } catch (error) {
      console.error('Failed to create verification', error);
      alert(error?.body?.message ?? error.message ?? 'Failed to create verification');
    } finally {
      setCreateBusy(false);
    }
  }, [createForm, handleRefresh, resolvedWorkspaceId]);

  const handleDetailSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!detailForm?.id) {
        return;
      }
      setDetailBusy(true);
      try {
        const payload = {
          status: detailForm.status,
          riskLevel: detailForm.riskLevel,
          riskScore: detailForm.riskScore === '' ? undefined : Number(detailForm.riskScore),
          assignedReviewerId:
            detailForm.assignedReviewerId === '' ? null : Number(detailForm.assignedReviewerId),
          reviewerId: detailForm.reviewerId === '' ? undefined : Number(detailForm.reviewerId),
          reviewNotes: detailForm.reviewNotes || undefined,
          requiresManualReview: detailForm.requiresManualReview,
          requiresReverification: detailForm.requiresReverification,
          nextReviewAt: detailForm.nextReviewAt || undefined,
          reverificationIntervalDays:
            detailForm.reverificationIntervalDays === ''
              ? undefined
              : Number(detailForm.reverificationIntervalDays),
          assignmentNotes: detailForm.assignmentNotes || undefined,
          tags: sanitizeCommaSeparated(detailForm.tags),
          autoReverificationChannel: detailForm.autoReverificationChannel || undefined,
          declinedReason: detailForm.declinedReason || undefined,
          lastReminderSentAt: normalizeDateTimeLocal(detailForm.lastReminderSentAt),
          escalatedAt: normalizeDateTimeLocal(detailForm.escalatedAt),
          escalationState: detailForm.escalationState || undefined,
          workspaceId: resolvedWorkspaceId || undefined,
        };
        const result = await updateIdentityVerification(detailForm.id, payload);
        setActiveVerification(result);
        setVerifications((previous) =>
          previous.map((item) => (item.id === result.id ? { ...item, ...result } : item)),
        );
        handleRefresh();
      } catch (error) {
        console.error('Failed to update verification', error);
        alert(error?.body?.message ?? error.message ?? 'Failed to update verification');
      } finally {
        setDetailBusy(false);
      }
    },
    [detailForm, handleRefresh, resolvedWorkspaceId],
  );

  const handleNoteSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!activeVerification) {
        return;
      }
      setNoteBusy(true);
      try {
        const payload = {
          eventType: noteForm.eventType || 'note',
          notes: noteForm.notes || undefined,
          riskLevel: noteForm.riskLevel || undefined,
          toStatus: noteForm.toStatus || undefined,
          attachments: sanitizeCommaSeparated(noteForm.attachments),
        };
        if (payload.attachments) {
          payload.attachments = payload.attachments.split(',').map((entry) => ({ label: entry, key: entry }));
        }
        const response = await createIdentityVerificationEvent(activeVerification.id, payload);
        setActiveVerification(response.verification);
        setNoteForm(DEFAULT_NOTE_FORM);
        handleRefresh();
      } catch (error) {
        console.error('Failed to add timeline event', error);
        alert(error?.body?.message ?? error.message ?? 'Failed to add timeline event');
      } finally {
        setNoteBusy(false);
      }
    },
    [activeVerification, handleRefresh, noteForm],
  );

  const handleSettingsSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManage) {
        return;
      }
      setSettingsBusy(true);
      try {
        const payload = {
          workspaceId: resolvedWorkspaceId || settings?.workspace?.id || undefined,
          automationEnabled: settingsForm.automationEnabled,
          requireSelfie: settingsForm.requireSelfie,
          autoAssignReviewerId: settingsForm.autoAssignReviewerId || undefined,
          manualReviewThreshold: settingsForm.manualReviewThreshold,
          reminderCadenceHours: settingsForm.reminderCadenceHours,
          reminderChannels: settingsForm.reminderChannels,
          escalateAfterHours: settingsForm.escalateAfterHours,
          allowedDocumentTypes: settingsForm.allowedDocumentTypes,
          autoArchiveAfterDays: settingsForm.autoArchiveAfterDays,
          autoReminderTemplateKey: settingsForm.autoReminderTemplateKey || undefined,
          allowProvisionalPass: settingsForm.allowProvisionalPass,
        };
        await updateIdentityVerificationSettings(payload);
        handleRefresh();
      } catch (error) {
        console.error('Failed to update settings', error);
        alert(error?.body?.message ?? error.message ?? 'Failed to update settings');
      } finally {
        setSettingsBusy(false);
      }
    },
    [canManage, handleRefresh, resolvedWorkspaceId, settings?.workspace?.id, settingsForm],
  );

  const fetchActivity = useCallback(() => {
    const abortController = new AbortController();
    setActivityLoading(true);
    listIdentityVerifications(
      {
        page: 1,
        pageSize: 25,
        includeEvents: true,
        workspaceId: resolvedWorkspaceId || undefined,
        order: 'recent',
      },
      { signal: abortController.signal },
    )
      .then((response) => {
        const events = [];
        (response.data ?? []).forEach((verification) => {
          (verification.events ?? []).forEach((event) => {
            events.push({
              ...event,
              verificationId: verification.id,
              verificationName: verification.fullName ?? `Member #${verification.userId}`,
              actor: event.actor || verification.reviewer || verification.assignedReviewer,
            });
          });
        });
        events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivityEvents(events.slice(0, 40));
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to load activity', error);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setActivityLoading(false);
        }
      });
    return () => abortController.abort();
  }, [resolvedWorkspaceId]);

  useEffect(() => {
    const activeTab = tabs[tabIndex]?.id;
    if (activeTab === 'activity') {
      const abort = fetchActivity();
      return () => abort();
    }
    return undefined;
  }, [fetchActivity, tabIndex, tabs]);

  return (
    <div className="flex flex-col gap-10">
      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <Tab.List className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              className={({ selected }) =>
                classNames(
                  'rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30',
                  selected ? 'bg-accent text-white shadow-soft' : 'bg-white text-slate-600 hover:text-accent',
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <IdVerificationQueuePanel
              summaryCards={summaryCards}
              summaryLoading={summaryLoading}
              onRefresh={handleRefresh}
              filters={filters}
              onOpenFilters={handleFiltersOpen}
              onOpenCreate={() => setCreateOpen(true)}
              canManage={canManage}
              loading={loading}
              error={error}
              verifications={verifications}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onOpenDetail={handleOpenDetail}
              workspaceSlug={workspaceSlug}
            />
          </Tab.Panel>

          {canManage ? (
            <Tab.Panel>
              <IdVerificationSettingsPanel
                form={settingsForm}
                onChange={setSettingsForm}
                onSubmit={handleSettingsSubmit}
                busy={settingsBusy}
              />
            </Tab.Panel>
          ) : null}

          <Tab.Panel>
            <IdVerificationActivityPanel events={activityEvents} loading={activityLoading} onRefresh={fetchActivity} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <IdVerificationFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={pendingFilters}
        onFiltersChange={handleFiltersChange}
        onClear={handleFiltersClear}
        onApply={handleFiltersApply}
        statusOptions={statusOptions}
        riskOptions={riskOptions}
      />

      <IdVerificationDetailDrawer
        open={detailOpen}
        onClose={handleCloseDetail}
        verification={activeVerification}
        statusOptions={statusOptions}
        riskOptions={riskOptions}
        reviewers={reviewers}
        detailForm={detailForm}
        onDetailChange={setDetailForm}
        onSubmit={handleDetailSubmit}
        busy={detailBusy}
        canManage={canManage}
        noteForm={noteForm}
        onNoteChange={setNoteForm}
        onNoteSubmit={handleNoteSubmit}
        noteBusy={noteBusy}
        onPreviewDocument={handlePreviewDocument}
      />

      <IdVerificationCreateWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        form={createForm}
        onChange={setCreateForm}
        onSubmit={handleCreateVerification}
        busy={createBusy}
        reviewers={reviewers}
        workspaceLocked={Boolean(resolvedWorkspaceId)}
      />
    </div>
  );
}
