import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PencilSquareIcon,
  PlusIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  fetchAdminLegalPolicies,
  fetchAdminLegalPolicy,
  createAdminLegalPolicy,
  updateAdminLegalPolicy,
  createAdminLegalPolicyVersion,
  updateAdminLegalPolicyVersion,
  publishAdminLegalPolicyVersion,
  activateAdminLegalPolicyVersion,
  archiveAdminLegalPolicyVersion,
} from '../../../services/legalPolicies.js';
import DataStatus from '../../DataStatus.jsx';

const CATEGORY_ORDER = [
  { id: 'terms', label: 'Terms', icon: DocumentTextIcon },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
  { id: 'data_processing', label: 'Data', icon: LockClosedIcon },
  { id: 'cookie', label: 'Cookie', icon: GlobeAltIcon },
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'Members' },
  { value: 'freelancer', label: 'Freelancers' },
  { value: 'company', label: 'Companies' },
  { value: 'agency', label: 'Agencies' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'headhunter', label: 'Headhunters' },
  { value: 'admin', label: 'Admins' },
];

const DOCUMENT_STATUS_TONE = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-600',
};

const VERSION_STATUS_TONE = {
  draft: 'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-600',
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function normalizeRoles(raw, fallback = []) {
  if (!raw) return fallback;
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((item) => String(item).trim()).filter(Boolean)));
  }
  return fallback;
}

export default function PolicyManager() {
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [policiesError, setPoliciesError] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [document, setDocument] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [dialog, setDialog] = useState({ type: null, payload: null });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const groupedPolicies = useMemo(() => {
    const groups = CATEGORY_ORDER.reduce((accumulator, category) => {
      accumulator[category.id] = [];
      return accumulator;
    }, {});

    policies.forEach((policy) => {
      const key = CATEGORY_ORDER.find((category) => category.id === policy.category)?.id ?? 'terms';
      groups[key] = groups[key] || [];
      groups[key].push(policy);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.title.localeCompare(b.title));
    });

    return groups;
  }, [policies]);

  const sortedVersions = useMemo(() => {
    if (!document?.versions?.length) {
      return [];
    }
    return [...document.versions].sort((a, b) => {
      if (a.locale === b.locale) {
        return b.version - a.version;
      }
      return a.locale.localeCompare(b.locale);
    });
  }, [document]);

  const loadPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    setPoliciesError(null);
    try {
      const response = await fetchAdminLegalPolicies({ includeVersions: true });
      setPolicies(response.data?.documents ?? []);
    } catch (error) {
      setPoliciesError(error);
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  const loadDocument = useCallback(
    async (slug) => {
      if (!slug) {
        setDocument(null);
        return;
      }
      setLoadingDocument(true);
      setDocumentError(null);
      try {
        const response = await fetchAdminLegalPolicy(slug, { includeAudit: true });
        setDocument(response.data ?? response);
        setFeedback(null);
      } catch (error) {
        setDocumentError(error);
      } finally {
        setLoadingDocument(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  useEffect(() => {
    if (!policies.length) {
      setSelectedSlug(null);
      return;
    }
    const exists = policies.some((policy) => policy.slug === selectedSlug);
    if (!exists) {
      setSelectedSlug(policies[0].slug);
    }
  }, [policies, selectedSlug]);

  useEffect(() => {
    if (selectedSlug) {
      loadDocument(selectedSlug);
    } else {
      setDocument(null);
    }
  }, [selectedSlug, loadDocument]);

  useEffect(() => {
    if (document) {
      setActiveTab('info');
    }
  }, [document?.id]);

  const handleCreatePolicy = useCallback(
    async (payload) => {
      setSaving(true);
      setFeedback(null);
      try {
        const response = await createAdminLegalPolicy(payload);
        const created = response.data ?? response;
        await loadPolicies();
        setSelectedSlug(created.slug);
        setDialog({ type: null, payload: null });
        setFeedback({ type: 'success', message: 'Policy created.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to create policy.' });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [loadPolicies],
  );

  const handleUpdateInfo = useCallback(
    async (payload) => {
      if (!document?.id) return;
      setSaving(true);
      setFeedback(null);
      try {
        await updateAdminLegalPolicy(document.id, payload);
        await Promise.all([loadPolicies(), loadDocument(document.slug)]);
        setDialog({ type: null, payload: null });
        setFeedback({ type: 'success', message: 'Policy updated.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update policy.' });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument, loadPolicies],
  );

  const handleCreateVersion = useCallback(
    async (payload) => {
      if (!document?.id) return;
      setSaving(true);
      setFeedback(null);
      try {
        await createAdminLegalPolicyVersion(document.id, payload);
        await loadDocument(document.slug);
        setDialog({ type: null, payload: null });
        setFeedback({ type: 'success', message: 'Version created.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to create version.' });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument],
  );

  const handleUpdateVersion = useCallback(
    async (versionId, payload) => {
      if (!document?.id || !versionId) return;
      setSaving(true);
      setFeedback(null);
      try {
        await updateAdminLegalPolicyVersion(document.id, versionId, payload);
        await loadDocument(document.slug);
        setDialog({ type: null, payload: null });
        setFeedback({ type: 'success', message: 'Version updated.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to update version.' });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument],
  );

  const handlePublishVersion = useCallback(
    async (versionId) => {
      if (!document?.id || !versionId) return;
      setSaving(true);
      setFeedback(null);
      try {
        await publishAdminLegalPolicyVersion(document.id, versionId);
        await loadDocument(document.slug);
        setFeedback({ type: 'success', message: 'Version published.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to publish version.' });
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument],
  );

  const handleActivateVersion = useCallback(
    async (versionId) => {
      if (!document?.id || !versionId) return;
      setSaving(true);
      setFeedback(null);
      try {
        await activateAdminLegalPolicyVersion(document.id, versionId);
        await Promise.all([loadPolicies(), loadDocument(document.slug)]);
        setFeedback({ type: 'success', message: 'Version activated.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to activate version.' });
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument, loadPolicies],
  );

  const handleArchiveVersion = useCallback(
    async (versionId) => {
      if (!document?.id || !versionId) return;
      setSaving(true);
      setFeedback(null);
      try {
        await archiveAdminLegalPolicyVersion(document.id, versionId);
        await loadDocument(document.slug);
        setFeedback({ type: 'success', message: 'Version archived.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message ?? 'Unable to archive version.' });
      } finally {
        setSaving(false);
      }
    },
    [document?.id, document?.slug, loadDocument],
  );

  const closeDialog = () => setDialog({ type: null, payload: null });

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6">
      <div className="flex min-h-[720px] flex-1 gap-6">
        <PolicySidebar
          categories={CATEGORY_ORDER}
          groupedPolicies={groupedPolicies}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          onCreate={() => setDialog({ type: 'create-policy' })}
          loading={loadingPolicies}
          error={policiesError}
        />

        <section className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="border-b border-slate-200 px-8 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {document?.title ?? 'Select a policy'}
                  </h2>
                  {document ? (
                    <span
                      className={classNames(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        DOCUMENT_STATUS_TONE[document.status] ?? 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {document.status === 'active' ? 'Active' : document.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  ) : null}
                </div>
                {document ? (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Locale {document.defaultLocale}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline" />
                    <span>Region {document.region}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline" />
                    <span>{document.slug}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Choose a policy from the left to begin.</p>
                )}
                <div className="pt-2">
                  <DataStatus
                    loading={loadingDocument}
                    lastUpdated={document?.updatedAt}
                    onRefresh={() => document?.slug && loadDocument(document.slug)}
                    error={documentError}
                  />
                </div>
              </div>
              {document ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'edit-info' })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                    Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'new-version' })}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Version
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'history' })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <ClockIcon className="h-5 w-5" />
                    History
                  </button>
                </div>
              ) : null}
            </div>
            {feedback ? (
              <div
                className={classNames(
                  'mt-4 inline-flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm shadow-sm',
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                <CheckIcon className={feedback.type === 'success' ? 'h-5 w-5 text-emerald-500' : 'h-5 w-5 text-rose-500'} />
                <span>{feedback.message}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {document ? (
              <>
                <div className="flex justify-center border-b border-slate-200 px-8">
                  <nav className="flex w-full max-w-xl justify-between py-4">
                    {['info', 'versions', 'summary'].map((tabKey) => (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setActiveTab(tabKey)}
                        className={classNames(
                          'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition',
                          activeTab === tabKey
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        )}
                      >
                        {tabKey === 'info' ? 'Info' : tabKey === 'versions' ? 'Versions' : 'Summary'}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {activeTab === 'info' ? (
                    <InfoPanel document={document} onEdit={() => setDialog({ type: 'edit-info' })} />
                  ) : null}
                  {activeTab === 'versions' ? (
                    <VersionPanel
                      versions={sortedVersions}
                      activeVersionId={document.activeVersionId}
                      onPreview={(version) => setDialog({ type: 'preview-version', payload: version })}
                      onEdit={(version) => setDialog({ type: 'edit-version', payload: version })}
                      onPublish={(version) => handlePublishVersion(version.id)}
                      onActivate={(version) => handleActivateVersion(version.id)}
                      onArchive={(version) => handleArchiveVersion(version.id)}
                      saving={saving}
                    />
                  ) : null}
                  {activeTab === 'summary' ? <SummaryPanel document={document} /> : null}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-8 py-12 text-center">
                <div className="space-y-4 text-slate-500">
                  <SparklesIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="text-lg font-semibold text-slate-600">No policy selected</p>
                  <p className="text-sm">Pick a policy from the library or create a new one to start managing legal content.</p>
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'create-policy' })}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5" />
                    New policy
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {dialog.type === 'create-policy' ? (
        <PolicyInfoDialog
          title="New policy"
          confirmLabel="Create"
          saving={saving}
          onClose={closeDialog}
          onSubmit={handleCreatePolicy}
        />
      ) : null}

      {dialog.type === 'edit-info' && document ? (
        <PolicyInfoDialog
          title="Edit policy"
          confirmLabel="Save"
          saving={saving}
          onClose={closeDialog}
          onSubmit={handleUpdateInfo}
          document={document}
        />
      ) : null}

      {dialog.type === 'new-version' && document ? (
        <VersionDialog
          title="New version"
          confirmLabel="Create"
          saving={saving}
          onClose={closeDialog}
          onSubmit={handleCreateVersion}
          defaultLocale={document.defaultLocale}
        />
      ) : null}

      {dialog.type === 'edit-version' && document ? (
        <VersionDialog
          title="Edit version"
          confirmLabel="Save"
          saving={saving}
          onClose={closeDialog}
          onSubmit={(values) => handleUpdateVersion(dialog.payload.id, values)}
          version={dialog.payload}
          defaultLocale={document.defaultLocale}
        />
      ) : null}

      {dialog.type === 'preview-version' ? (
        <VersionPreview version={dialog.payload} onClose={closeDialog} />
      ) : null}

      {dialog.type === 'history' && document ? (
        <HistoryDrawer document={document} onClose={closeDialog} />
      ) : null}
    </div>
  );
}

function PolicySidebar({ categories, groupedPolicies, selectedSlug, onSelect, onCreate, loading, error }) {
  const [openSections, setOpenSections] = useState(() => new Set(categories.map((category) => category.id)));

  useEffect(() => {
    setOpenSections((current) => {
      const next = new Set(current);
      categories.forEach((category) => {
        if ((groupedPolicies[category.id] ?? []).length === 0) {
          next.delete(category.id);
        }
      });
      return next;
    });
  }, [categories, groupedPolicies]);

  const toggleSection = (sectionId) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <aside className="w-80 shrink-0 rounded-3xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">Library</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          New
        </button>
      </div>
      <div className="h-full max-h-[calc(100vh-220px)] overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <ArrowPathIcon className="h-6 w-6 animate-spin" />
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message ?? 'Unable to load policies.'}
          </div>
        ) : null}
        {!loading && !error
          ? categories.map((category) => {
              const policies = groupedPolicies[category.id] ?? [];
              const Icon = category.icon;
              const open = openSections.has(category.id);
              return (
                <div key={category.id} className="mb-4 rounded-2xl border border-slate-200 bg-white/60 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection(category.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      {category.label}
                    </span>
                    {open ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                  </button>
                  {open ? (
                    <ul className="divide-y divide-slate-200">
                      {policies.length ? (
                        policies.map((policy) => (
                          <li key={policy.slug}>
                            <button
                              type="button"
                              onClick={() => onSelect(policy.slug)}
                              className={classNames(
                                'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition',
                                selectedSlug === policy.slug
                                  ? 'bg-blue-50 font-semibold text-blue-700'
                                  : 'text-slate-600 hover:bg-slate-100',
                              )}
                            >
                              <span className="truncate">{policy.title}</span>
                              <span
                                className={classNames(
                                  'inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold',
                                  DOCUMENT_STATUS_TONE[policy.status] ?? 'bg-slate-100 text-slate-600',
                                )}
                              >
                                {policy.status === 'active'
                                  ? 'Active'
                                  : policy.status === 'draft'
                                  ? 'Draft'
                                  : 'Archived'}
                              </span>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-slate-400">No entries</li>
                      )}
                    </ul>
                  ) : null}
                </div>
              );
            })
          : null}
      </div>
    </aside>
  );
}

function InfoPanel({ document, onEdit }) {
  const metadata = document?.metadata ?? {};
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">Audience</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {normalizeRoles(document.audienceRoles).length ? (
              normalizeRoles(document.audienceRoles).map((role) => (
                <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">None set</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">Editors</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {normalizeRoles(document.editorRoles).length ? (
              normalizeRoles(document.editorRoles).map((role) => (
                <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">None set</span>
            )}
          </div>
        </div>
        <div className="min-w-[200px]">
          <p className="text-sm font-semibold text-slate-600">Contact</p>
          <p className="mt-2 text-sm text-slate-500">{metadata.contactEmail ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl bg-slate-50 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
          <p className="mt-2 text-sm text-slate-600">{document.summary ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Review cadence</p>
          <p className="mt-2 text-sm text-slate-600">
            {metadata.reviewCadenceDays ? `${metadata.reviewCadenceDays} days` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hero image</p>
          <p className="mt-2 truncate text-sm text-blue-600">
            {metadata.heroImageUrl ? (
              <a href={metadata.heroImageUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {metadata.heroImageUrl}
              </a>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {normalizeRoles(document.tags).length ? (
              normalizeRoles(document.tags).map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">No tags</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Created</p>
          <p className="mt-2 text-sm text-slate-600">{formatDateTime(document.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Updated</p>
          <p className="mt-2 text-sm text-slate-600">{formatDateTime(document.updatedAt)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <PencilSquareIcon className="h-5 w-5" />
          Edit
        </button>
      </div>
    </div>
  );
}

function VersionPanel({ versions, activeVersionId, onPreview, onEdit, onPublish, onActivate, onArchive, saving }) {
  if (!versions.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
        <RocketLaunchIcon className="h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-slate-600">No versions yet</p>
        <p className="text-sm">Create a version to draft, review, and publish this policy.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {versions.map((version) => {
        const isActive = activeVersionId && activeVersionId === version.id;
        return (
          <article key={`${version.locale}-${version.id}`} className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  v{version.version} · {version.locale}
                </p>
                <p className="text-xs text-slate-500">Updated {formatDateTime(version.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={classNames(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                    VERSION_STATUS_TONE[version.status] ?? 'bg-slate-100 text-slate-600',
                  )}
                >
                  {version.status.replace('_', ' ')}
                </span>
                {isActive ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                ) : null}
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 px-5 py-4 text-sm text-slate-600">
              <p className="line-clamp-3 text-slate-500">{version.summary ?? 'No summary added.'}</p>
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-500">Effective</p>
                  <p className="mt-1 text-slate-600">{formatDate(version.effectiveAt)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">Published</p>
                  <p className="mt-1 text-slate-600">{formatDate(version.publishedAt)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500">External link</p>
                  <p className="mt-1 truncate text-blue-600">
                    {version.externalUrl ? (
                      <a href={version.externalUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {version.externalUrl}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(version)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(version)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPublish(version)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => onActivate(version)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RocketLaunchIcon className="h-4 w-4" />
                  Activate
                </button>
                <button
                  type="button"
                  onClick={() => onArchive(version)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArchiveBoxIcon className="h-4 w-4" />
                  Archive
                </button>
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function SummaryPanel({ document }) {
  const audit = document?.auditEvents ?? [];
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5">
        <h3 className="text-sm font-semibold text-slate-600">Snapshot</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current version</p>
            <p className="mt-2 text-sm text-slate-600">
              {document.activeVersionId
                ? `v${document.versions?.find((version) => version.id === document.activeVersionId)?.version ?? '—'}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Published versions</p>
            <p className="mt-2 text-sm text-slate-600">
              {document.versions?.filter((version) => version.status === 'published').length ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending drafts</p>
            <p className="mt-2 text-sm text-slate-600">
              {document.versions?.filter((version) => version.status === 'draft').length ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-600">Latest activity</h3>
        <ul className="space-y-3">
          {audit.slice(0, 6).map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{entry.action.replace('document.', '').replace(/\./g, ' ')}</span>
                <span className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</span>
              </div>
              {entry.metadata ? (
                <pre className="mt-2 max-h-32 overflow-y-auto rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
          {!audit.length ? <li className="text-sm text-slate-400">No activity recorded.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function PolicyInfoDialog({ title, confirmLabel, saving, onClose, onSubmit, document }) {
  const [values, setValues] = useState(() => ({
    title: document?.title ?? '',
    slug: document?.slug ?? '',
    category: document?.category ?? 'terms',
    region: document?.region ?? 'global',
    defaultLocale: document?.defaultLocale ?? 'en',
    summary: document?.summary ?? '',
    audienceRoles: normalizeRoles(document?.audienceRoles, ['user', 'freelancer', 'company', 'agency']),
    editorRoles: normalizeRoles(document?.editorRoles, ['admin']),
    contactEmail: document?.metadata?.contactEmail ?? '',
    heroImageUrl: document?.metadata?.heroImageUrl ?? '',
    reviewCadenceDays: document?.metadata?.reviewCadenceDays ?? '',
    tags: normalizeRoles(document?.tags, []),
  }));
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setValues({
      title: document?.title ?? '',
      slug: document?.slug ?? '',
      category: document?.category ?? 'terms',
      region: document?.region ?? 'global',
      defaultLocale: document?.defaultLocale ?? 'en',
      summary: document?.summary ?? '',
      audienceRoles: normalizeRoles(document?.audienceRoles, ['user', 'freelancer', 'company', 'agency']),
      editorRoles: normalizeRoles(document?.editorRoles, ['admin']),
      contactEmail: document?.metadata?.contactEmail ?? '',
      heroImageUrl: document?.metadata?.heroImageUrl ?? '',
      reviewCadenceDays: document?.metadata?.reviewCadenceDays ?? '',
      tags: normalizeRoles(document?.tags, []),
    });
    setTagInput('');
    setError(null);
  }, [document?.id]);

  const handleChange = (field) => (event) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const toggleRole = (field, role) => {
    setValues((previous) => {
      const set = new Set(previous[field]);
      if (set.has(role)) {
        set.delete(role);
      } else {
        set.add(role);
      }
      return { ...previous, [field]: Array.from(set) };
    });
  };

  const addTag = () => {
    const next = tagInput.trim();
    if (!next) return;
    setValues((previous) => ({ ...previous, tags: Array.from(new Set([...previous.tags, next])) }));
    setTagInput('');
  };

  const removeTag = (tag) => {
    setValues((previous) => ({ ...previous, tags: previous.tags.filter((item) => item !== tag) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title: values.title,
        slug: values.slug,
        category: values.category,
        region: values.region,
        defaultLocale: values.defaultLocale,
        summary: values.summary,
        audienceRoles: values.audienceRoles,
        editorRoles: values.editorRoles,
        tags: values.tags,
        metadata: {
          contactEmail: values.contactEmail || undefined,
          heroImageUrl: values.heroImageUrl || undefined,
          reviewCadenceDays: values.reviewCadenceDays ? Number(values.reviewCadenceDays) : undefined,
        },
      });
    } catch (submitError) {
      setError(submitError);
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">Define how this policy is presented and who can edit it.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Title</span>
              <input
                required
                value={values.title}
                onChange={handleChange('title')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Slug</span>
              <input
                required
                value={values.slug}
                onChange={handleChange('slug')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Category</span>
              <select
                value={values.category}
                onChange={handleChange('category')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {CATEGORY_ORDER.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Region</span>
              <input
                value={values.region}
                onChange={handleChange('region')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Default locale</span>
              <input
                value={values.defaultLocale}
                onChange={handleChange('defaultLocale')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Contact email</span>
              <input
                value={values.contactEmail}
                onChange={handleChange('contactEmail')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Hero image URL</span>
              <input
                value={values.heroImageUrl}
                onChange={handleChange('heroImageUrl')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span className="font-semibold">Review cadence (days)</span>
              <input
                type="number"
                min="0"
                value={values.reviewCadenceDays}
                onChange={handleChange('reviewCadenceDays')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-600">
            <span className="font-semibold">Summary</span>
            <textarea
              rows={4}
              value={values.summary}
              onChange={handleChange('summary')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-600">Audience roles</legend>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <span>{role.label}</span>
                    <input
                      type="checkbox"
                      checked={values.audienceRoles.includes(role.value)}
                      onChange={() => toggleRole('audienceRoles', role.value)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-slate-600">Editor roles</legend>
              <div className="grid gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <span>{role.label}</span>
                    <input
                      type="checkbox"
                      checked={values.editorRoles.includes(role.value)}
                      onChange={() => toggleRole('editorRoles', role.value)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {values.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Add tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Add
              </button>
            </div>
          </div>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message ?? 'Unable to save changes.'}
            </div>
          ) : null}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function VersionDialog({ title, confirmLabel, saving, onClose, onSubmit, version, defaultLocale }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => ({
    locale: version?.locale ?? defaultLocale ?? 'en',
    version: version?.version ?? '',
    status: version?.status ?? 'draft',
    effectiveAt: version?.effectiveAt ? version.effectiveAt.slice(0, 16) : '',
    summary: version?.summary ?? '',
    changeSummary: version?.changeSummary ?? '',
    content: version?.content ?? '',
    externalUrl: version?.externalUrl ?? '',
  }));
  const [error, setError] = useState(null);

  useEffect(() => {
    setValues({
      locale: version?.locale ?? defaultLocale ?? 'en',
      version: version?.version ?? '',
      status: version?.status ?? 'draft',
      effectiveAt: version?.effectiveAt ? version.effectiveAt.slice(0, 16) : '',
      summary: version?.summary ?? '',
      changeSummary: version?.changeSummary ?? '',
      content: version?.content ?? '',
      externalUrl: version?.externalUrl ?? '',
    });
    setStep(0);
    setError(null);
  }, [version?.id, defaultLocale]);

  const handleChange = (field) => (event) => {
    setValues((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        locale: values.locale,
        version: values.version || undefined,
        status: values.status,
        effectiveAt: values.effectiveAt ? new Date(values.effectiveAt).toISOString() : undefined,
        summary: values.summary,
        changeSummary: values.changeSummary,
        content: values.content,
        externalUrl: values.externalUrl || undefined,
      });
    } catch (submitError) {
      setError(submitError);
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">Draft, review, and publish the selected policy version.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex items-center justify-center gap-3 border-b border-slate-200 px-6 py-3 text-xs font-semibold text-slate-500">
          <span className={classNames('rounded-full px-3 py-1', step === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100')}>Basics</span>
          <span className="h-0.5 flex-1 bg-slate-200" />
          <span className={classNames('rounded-full px-3 py-1', step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100')}>Content</span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Locale</span>
                <input
                  value={values.locale}
                  onChange={handleChange('locale')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Version number</span>
                <input
                  value={values.version}
                  onChange={handleChange('version')}
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Status</span>
                <select
                  value={values.status}
                  onChange={handleChange('status')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Effective date</span>
                <input
                  type="datetime-local"
                  value={values.effectiveAt}
                  onChange={handleChange('effectiveAt')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          ) : null}
          {step === 1 ? (
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Summary</span>
                <textarea
                  rows={3}
                  value={values.summary}
                  onChange={handleChange('summary')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Change log</span>
                <textarea
                  rows={3}
                  value={values.changeSummary}
                  onChange={handleChange('changeSummary')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">Content</span>
                <textarea
                  rows={10}
                  value={values.content}
                  onChange={handleChange('content')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span className="font-semibold">External URL</span>
                <input
                  value={values.externalUrl}
                  onChange={handleChange('externalUrl')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error.message ?? 'Unable to save version.'}
            </div>
          ) : null}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              Close
            </button>
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(0)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {step === 0 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
                {confirmLabel}
              </button>
            )}
          </div>
        </footer>
      </form>
    </Modal>
  );
}

function HistoryDrawer({ document, onClose }) {
  const audit = document?.auditEvents ?? [];
  return (
    <Modal onClose={onClose}>
      <div className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">History</h3>
            <p className="text-sm text-slate-500">Complete audit log for {document.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {audit.length ? (
            <ul className="space-y-4">
              {audit.map((entry) => (
                <li key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {entry.action.replace('document.', '').replace(/\./g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  {entry.metadata ? (
                    <pre className="mt-3 max-h-48 overflow-y-auto rounded-2xl bg-white px-4 py-3 text-xs text-slate-500">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No audit events recorded yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function VersionPreview({ version, onClose }) {
  if (!version) {
    return null;
  }
  return (
    <Modal onClose={onClose}>
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              v{version.version} · {version.locale}
            </h3>
            <p className="text-sm text-slate-500">Status {version.status.replace('_', ' ')} · Updated {formatDateTime(version.updatedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Effective</p>
                <p className="mt-1 text-sm text-slate-600">{formatDate(version.effectiveAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Published</p>
                <p className="mt-1 text-sm text-slate-600">{formatDate(version.publishedAt)}</p>
              </div>
            </div>
            {version.changeSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm font-semibold text-slate-600">Change log</p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{version.changeSummary}</p>
              </div>
            ) : null}
            <article className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap break-words rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700">
                {version.content ?? 'No content provided.'}
              </pre>
            </article>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
