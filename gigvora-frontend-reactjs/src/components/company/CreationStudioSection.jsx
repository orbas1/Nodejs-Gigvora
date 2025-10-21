import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CreationStudioSummary from './CreationStudioSummary.jsx';
import DataStatus from '../DataStatus.jsx';
import CreationStudioSidebar from './creation-studio/CreationStudioSidebar.jsx';
import CreationStudioBoard from './creation-studio/CreationStudioBoard.jsx';
import CreationStudioFormDrawer from './creation-studio/CreationStudioFormDrawer.jsx';
import CreationStudioPreviewDrawer from './creation-studio/CreationStudioPreviewDrawer.jsx';
import {
  CREATION_STUDIO_GROUPS,
  getCreationType,
} from '../../constants/creationStudio.js';
import {
  fetchCompanyCreationStudioItems,
  publishCompanyCreationStudioItem,
  deleteCompanyCreationStudioItem,
  shareCompanyCreationStudioItem,
} from '../../services/creationStudio.js';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function CreationStudioSection({
  overview,
  workspaceOptions,
  workspaceId,
  onWorkspaceChange,
  onRefresh,
  loading,
  fromCache,
  lastUpdated,
  error,
  permissions,
}) {
  const typeSummaries = useMemo(() => {
    const map = new Map();
    toArray(overview?.typeSummaries).forEach((entry) => {
      map.set(entry.type, entry);
    });
    return map;
  }, [overview?.typeSummaries]);

  const groups = useMemo(() => {
    return CREATION_STUDIO_GROUPS.map((group) => {
      const count = group.types.reduce((total, typeId) => {
        const summary = typeSummaries.get(typeId);
        return total + (summary?.total ?? 0);
      }, 0);
      return { ...group, count };
    });
  }, [typeSummaries]);

  const [activeGroupId, setActiveGroupId] = useState(() => groups[0]?.id ?? 'jobs');
  useEffect(() => {
    if (!groups.find((group) => group.id === activeGroupId) && groups[0]) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  const activeGroup = useMemo(() => groups.find((group) => group.id === activeGroupId) ?? groups[0], [groups, activeGroupId]);
  const defaultType = activeGroup?.defaultType ?? activeGroup?.types?.[0];
  const [activeType, setActiveType] = useState(defaultType ?? 'job');

  useEffect(() => {
    if (!activeGroup) {
      return;
    }
    const nextType = activeGroup.defaultType ?? activeGroup.types?.[0];
    if (nextType && nextType !== activeType) {
      setActiveType(nextType);
    }
  }, [activeGroup, activeType]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    setStatusFilter('all');
    setSearch('');
  }, [activeGroupId]);

  useEffect(() => {
    setStatusFilter('all');
  }, [activeType]);

  const [items, setItems] = useState(() => toArray(overview?.items).filter((item) => item.type === (defaultType ?? 'job')));
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const abortRef = useRef(null);

  const canManage = permissions?.canManage ?? true;

  useEffect(() => {
    if (overview?.items) {
      setItems(toArray(overview.items).filter((item) => item.type === activeType));
    }
  }, [overview?.items, activeType]);

  const loadItems = useCallback(async () => {
    if (!activeType) {
      setItems([]);
      return;
    }
    setItemsLoading(true);
    setItemsError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetchCompanyCreationStudioItems({
        workspaceId: workspaceId || undefined,
        type: activeType,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        limit: 60,
      }, { signal: controller.signal });
      const nextItems = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : [];
      setItems(nextItems);
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setItemsError(fetchError);
      }
    } finally {
      setItemsLoading(false);
    }
  }, [activeType, statusFilter, search, workspaceId]);

  useEffect(() => {
    loadItems();
    return () => abortRef.current?.abort();
  }, [loadItems]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCreate = () => {
    setDrawerMode('create');
    setEditingItem(null);
    setDrawerOpen(true);
  };

  const handleEdit = (item) => {
    setDrawerMode('edit');
    setEditingItem(item);
    setActiveType(item.type);
    setDrawerOpen(true);
  };

  const handleSaved = () => {
    setDrawerOpen(false);
    setEditingItem(null);
    loadItems();
    onRefresh?.({ force: true });
    setFeedback({ type: 'success', message: 'Changes saved.' });
  };

  const handlePublish = async (item) => {
    if (!canManage) {
      return;
    }
    try {
      await publishCompanyCreationStudioItem(item.id, { publishAt: item.publishAt ?? null });
      setFeedback({ type: 'success', message: 'Item published.' });
      loadItems();
      onRefresh?.({ force: true });
    } catch (publishError) {
      setFeedback({ type: 'error', message: publishError?.message ?? 'Unable to publish item.' });
    }
  };

  const handleDelete = async (item) => {
    if (!canManage) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete ${item.title}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteCompanyCreationStudioItem(item.id);
      setFeedback({ type: 'success', message: 'Item deleted.' });
      loadItems();
      onRefresh?.({ force: true });
    } catch (deleteError) {
      setFeedback({ type: 'error', message: deleteError?.message ?? 'Unable to delete item.' });
    }
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const copyShareLink = async (shareUrl) => {
    if (!shareUrl) {
      return false;
    }
    if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (clipboardError) {
      console.warn('Clipboard copy failed', clipboardError);
      return false;
    }
  };

  const handleShare = async (item, existingShareUrl = null) => {
    if (!canManage || !item?.id) {
      return;
    }

    if (existingShareUrl) {
      const copied = await copyShareLink(existingShareUrl);
      setFeedback(
        copied
          ? { type: 'success', message: 'Share link copied to clipboard.' }
          : { type: 'success', message: `Share link ready: ${existingShareUrl}` },
      );
      return;
    }

    try {
      const response = await shareCompanyCreationStudioItem(item.id, {
        workspaceId: workspaceId ? Number(workspaceId) : undefined,
      });
      const shareUrl =
        response?.shareUrl ??
        response?.publicUrl ??
        response?.url ??
        (response?.shareSlug
          ? typeof window !== 'undefined' && window.location?.origin
            ? `${window.location.origin}/launch/${response.shareSlug}`
            : `https://gigvora.com/launch/${response.shareSlug}`
          : null);

      if (shareUrl) {
        const copied = await copyShareLink(shareUrl);
        setFeedback(
          copied
            ? { type: 'success', message: 'Share link copied to clipboard.' }
            : { type: 'success', message: `Share link ready: ${shareUrl}` },
        );
      } else {
        setFeedback({ type: 'success', message: 'Share signal sent. Recipients will receive invites.' });
      }

      if (!shareUrl && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creation-studio:refresh'));
      }
      loadItems();
    } catch (shareError) {
      setFeedback({ type: 'error', message: shareError?.message ?? 'Unable to generate share link.' });
    }
  };

  const subTypes = useMemo(() => {
    if (!activeGroup?.types) {
      return [];
    }
    return activeGroup.types
      .map((typeId) => getCreationType(typeId))
      .filter(Boolean)
      .map((type) => ({ id: type.id, label: type.shortLabel ?? type.label }));
  }, [activeGroup]);

  const summaryActions = (
    <div className="flex flex-wrap items-center gap-3">
      {workspaceOptions?.length ? (
        <div className="flex items-center gap-2 text-sm">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="creation-workspace-select">
            Workspace
          </label>
          <select
            id="creation-workspace-select"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            value={workspaceId ?? ''}
            onChange={(event) => onWorkspaceChange?.(event.target.value || null)}
          >
            <option value="">Choose</option>
            {workspaceOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => onRefresh?.({ force: true })} error={error} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
        <CreationStudioSidebar
          groups={groups}
          activeGroupId={activeGroupId}
          onSelectGroup={(group) => {
            setActiveGroupId(group.id);
            setActiveType(group.defaultType ?? group.types?.[0] ?? activeType);
          }}
          upcoming={toArray(overview?.upcoming)}
        />
        <div className="space-y-6">
          <CreationStudioSummary overview={overview} actions={summaryActions} compact onOpenStudio={canManage ? handleCreate : undefined} />

          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {itemsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {itemsError.message ?? 'Unable to load items.'}
            </div>
          ) : null}

          <CreationStudioBoard
            items={items}
            loading={itemsLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            search={search}
            onSearchChange={setSearch}
            onResetSearch={() => setSearch('')}
            onCreate={handleCreate}
            onPreview={handlePreview}
            onEdit={handleEdit}
            onPublish={handlePublish}
            onDelete={handleDelete}
            onShare={handleShare}
            canManage={canManage}
            activeType={activeType}
            subTypes={subTypes}
            onTypeChange={(typeId) => setActiveType(typeId)}
          />
        </div>
      </div>

      <CreationStudioFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        item={editingItem}
        initialType={drawerMode === 'edit' ? editingItem?.type ?? activeType : activeType}
        workspaceId={workspaceId}
        onClose={() => {
          setDrawerOpen(false);
          setEditingItem(null);
        }}
        onSaved={handleSaved}
        canManage={canManage}
      />

      <CreationStudioPreviewDrawer
        open={previewOpen}
        item={previewItem}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
      />
    </div>
  );
}

CreationStudioSection.propTypes = {
  overview: PropTypes.object,
  workspaceOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onWorkspaceChange: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  error: PropTypes.object,
  permissions: PropTypes.shape({ canManage: PropTypes.bool }),
};

CreationStudioSection.defaultProps = {
  overview: null,
  workspaceOptions: [],
  workspaceId: '',
  onWorkspaceChange: null,
  onRefresh: null,
  loading: false,
  fromCache: false,
  lastUpdated: null,
  error: null,
  permissions: { canManage: true },
};
