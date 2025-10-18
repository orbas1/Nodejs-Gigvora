import { useCallback, useEffect, useMemo, useState } from 'react';
import CompanyPageQuickCreateCard from './pages/CompanyPageQuickCreateCard.jsx';
import CompanyPageList from './pages/CompanyPageList.jsx';
import CompanyPageEditorDrawer from './pages/CompanyPageEditorDrawer.jsx';
import useCompanyPagesManagement from '../../hooks/useCompanyPagesManagement.js';

function formatNumber(value) {
  if (value == null) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }
  return numeric.toLocaleString();
}

function formatPercent(value) {
  if (value == null) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return '—';
  }
  return `${numeric.toFixed(1)}%`;
}

export default function CompanyPagesManagementSection({
  workspaceId,
  variant = 'full',
  onOpenFullStudio,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [editorPage, setEditorPage] = useState(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [creationPending, setCreationPending] = useState(false);

  const {
    data,
    pages,
    stats,
    governance,
    blueprints,
    sectionLibrary,
    collaboratorRoles,
    visibilityOptions,
    statusOptions,
    loading,
    error,
    refresh,
    createPage,
    updatePage,
    updateSections,
    updateCollaborators,
    publishPage,
    archivePage,
    deletePage,
    loadPage,
  } = useCompanyPagesManagement({ workspaceId, enabled: Boolean(workspaceId) });

  const summaryCards = useMemo(() => {
    const metrics = stats?.metrics ?? stats ?? {};
    return [
      {
        label: 'Live pages',
        value: formatNumber(metrics.live ?? stats?.statusCounts?.published ?? 0),
        description: 'Published destinations',
      },
      {
        label: 'In review',
        value: formatNumber(metrics.inReview ?? stats?.statusCounts?.in_review ?? 0),
        description: 'Awaiting approval',
      },
      {
        label: 'Avg conversion',
        value: formatPercent(metrics.averageConversionRate ?? stats?.averageConversionRate ?? null),
        description: 'Visitor → lead',
      },
      {
        label: 'Follower reach',
        value: formatNumber(metrics.totalFollowers ?? stats?.totalFollowers ?? 0),
        description: 'Across all pages',
      },
    ];
  }, [stats]);

  const handleCreatePage = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return;
      }
      setCreationPending(true);
      try {
        await createPage({ workspaceId, ...payload });
      } finally {
        setCreationPending(false);
      }
    },
    [createPage, workspaceId],
  );

  const openEditor = useCallback(
    async (page) => {
      if (!page?.id) return;
      setSelectedPageId(page.id);
      setEditorOpen(true);
      setLoadingEditor(true);
      try {
        const full = await loadPage(page.id);
        setEditorPage(full ?? page);
      } finally {
        setLoadingEditor(false);
      }
    },
    [loadPage],
  );

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditorPage(null);
    setSelectedPageId(null);
  }, []);

  const handlePublish = useCallback(
    async (page) => {
      await publishPage(page.id);
      await refresh({ force: true });
    },
    [publishPage, refresh],
  );

  const handleArchive = useCallback(
    async (page) => {
      await archivePage(page.id);
      await refresh({ force: true });
    },
    [archivePage, refresh],
  );

  const handleDelete = useCallback(
    async (page) => {
      if (!window.confirm(`Delete ${page.title}? This cannot be undone.`)) {
        return;
      }
      await deletePage(page.id);
    },
    [deletePage],
  );

  const handleSaveBasics = useCallback(
    async (payload) => {
      if (!selectedPageId) return;
      await updatePage(selectedPageId, payload);
      const updated = await loadPage(selectedPageId);
      setEditorPage(updated);
    },
    [selectedPageId, updatePage, loadPage],
  );

  const handleSaveSections = useCallback(
    async (sectionsPayload) => {
      if (!selectedPageId) return;
      await updateSections(selectedPageId, sectionsPayload);
      const updated = await loadPage(selectedPageId);
      setEditorPage(updated);
    },
    [selectedPageId, updateSections, loadPage],
  );

  const handleSaveCollaborators = useCallback(
    async (collaboratorPayload) => {
      if (!selectedPageId) return;
      await updateCollaborators(selectedPageId, collaboratorPayload);
      const updated = await loadPage(selectedPageId);
      setEditorPage(updated);
    },
    [selectedPageId, updateCollaborators, loadPage],
  );

  useEffect(() => {
    if (!editorOpen) {
      setEditorPage(null);
    }
  }, [editorOpen]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pages workspace</h3>
          <p className="mt-1 text-sm text-slate-600">
            Create, govern, and publish Gigvora pages with role-based controls.
          </p>
        </div>
        {variant === 'inline' && onOpenFullStudio ? (
          <button
            type="button"
            onClick={onOpenFullStudio}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            Open full studio
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Unable to load pages workspace. Please refresh.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
        <div className="space-y-6">
          <CompanyPageQuickCreateCard
            blueprints={blueprints}
            visibilityOptions={visibilityOptions}
            onCreate={handleCreatePage}
            isSubmitting={creationPending}
          />

          <CompanyPageList
            pages={pages}
            loading={loading}
            onSelect={openEditor}
            onPublish={handlePublish}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
            <h4 className="text-sm font-semibold text-slate-900">Governance highlights</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                <span>Approvals pending</span>
                <span className="font-semibold text-slate-900">{formatNumber(governance?.approvalsPending ?? stats?.governance?.approvalsPending ?? 0)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Hero image required</span>
                <span className="font-semibold text-slate-900">{formatNumber(governance?.heroImageRequired ?? stats?.governance?.heroImageRequired ?? 0)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Restricted visibility</span>
                <span className="font-semibold text-slate-900">{formatNumber(governance?.restrictedVisibility ?? stats?.governance?.restrictedVisibility ?? 0)}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-soft">
            <h4 className="text-sm font-semibold text-slate-900">Upcoming launches</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(stats?.upcomingLaunches ?? stats?.pages?.upcomingLaunches ?? []).slice(0, 4).map((launch) => (
                <li key={launch.id ?? launch.title} className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                  <p className="font-semibold text-slate-900">{launch.title}</p>
                  <p className="text-xs text-slate-500">
                    {launch.launchDate ? new Date(launch.launchDate).toLocaleString() : 'Awaiting schedule'}
                  </p>
                </li>
              ))}
              {!(stats?.upcomingLaunches ?? stats?.pages?.upcomingLaunches ?? []).length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                  No scheduled launches.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <CompanyPageEditorDrawer
        open={editorOpen}
        page={editorPage}
        loading={loadingEditor}
        onClose={closeEditor}
        onSaveBasics={handleSaveBasics}
        onSaveSections={handleSaveSections}
        onSaveCollaborators={handleSaveCollaborators}
        sectionLibrary={sectionLibrary}
        collaboratorRoles={collaboratorRoles}
        visibilityOptions={visibilityOptions}
        statusOptions={statusOptions}
      />
    </section>
  );
}
