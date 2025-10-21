import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useCachedResource from '../../hooks/useCachedResource.js';
import DataStatus from '../DataStatus.jsx';
import {
  archiveCreationItem,
  createCreationItem,
  fetchCreationWorkspace,
  saveCreationStep,
  shareCreationItem,
  updateCreationItem,
} from '../../services/creationStudio.js';
import CreationStudioWizard from './CreationStudioWizard.jsx';
import CreationStudioItemList from './CreationStudioItemList.jsx';

export default function CreationStudioWorkspace({ ownerId, hasAccess, startFresh, initialItemId }) {
  const [selectedItemId, setSelectedItemId] = useState(initialItemId ?? null);
  const [wizardResetKey, setWizardResetKey] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const canManage = Boolean(ownerId) && hasAccess;

  useEffect(() => {
    if (typeof window === 'undefined' || !canManage) {
      return undefined;
    }
    const handleOpenArchive = () => setListOpen(true);
    window.addEventListener('creation-studio:open-archive', handleOpenArchive);
    return () => {
      window.removeEventListener('creation-studio:open-archive', handleOpenArchive);
    };
  }, [canManage]);

  const {
    data,
    loading,
    error,
    refresh,
  } = useCachedResource(
    `creation-studio:${ownerId ?? 'guest'}`,
    ({ signal }) => fetchCreationWorkspace(ownerId, { signal }),
    {
      enabled: canManage,
      dependencies: [ownerId],
      ttl: 1000 * 30,
    },
  );

  const items = data?.items ?? [];
  const catalog = data?.catalog ?? [];
  const shareDestinations = data?.shareDestinations ?? [];
  const summary = data?.summary ?? {};

  const activeItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  useEffect(() => {
    if (startFresh && canManage) {
      setSelectedItemId(null);
      setWizardResetKey((key) => key + 1);
    }
  }, [startFresh, canManage]);

  const handleDraftCreated = useCallback(
    async (payload) => {
      if (!canManage) {
        throw new Error('Creation studio access required to create drafts.');
      }
      const created = await createCreationItem(ownerId, payload);
      setSelectedItemId(created.id);
      await refresh({ force: true });
      return created;
    },
    [ownerId, refresh, canManage],
  );

  const handleDraftUpdated = useCallback(
    async (itemId, payload) => {
      if (!canManage) {
        throw new Error('Creation studio access required to update drafts.');
      }
      const updated = await updateCreationItem(ownerId, itemId, payload);
      await refresh();
      return updated;
    },
    [ownerId, refresh, canManage],
  );

  const handleStepSaved = useCallback(
    async (itemId, stepKey, payload) => {
      if (!canManage) {
        throw new Error('Creation studio access required to save progress.');
      }
      const result = await saveCreationStep(ownerId, itemId, stepKey, payload);
      return result;
    },
    [ownerId, canManage],
  );

  const handleShare = useCallback(
    async (itemId, payload) => {
      if (!canManage) {
        throw new Error('Creation studio access required to share creations.');
      }
      const result = await shareCreationItem(ownerId, itemId, payload);
      await refresh({ force: true });
      return result;
    },
    [ownerId, refresh, canManage],
  );

  const handleArchive = useCallback(
    async (itemId) => {
      if (!canManage) {
        throw new Error('Creation studio access required to archive creations.');
      }
      await archiveCreationItem(ownerId, itemId);
      if (itemId === selectedItemId) {
        setSelectedItemId(null);
      }
      await refresh({ force: true });
    },
    [ownerId, selectedItemId, refresh, canManage],
  );

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setWizardResetKey((key) => key + 1);
    setListOpen(false);
  }, []);

  const openList = useCallback(() => setListOpen(true), []);
  const closeList = useCallback(() => setListOpen(false), []);

  if (!ownerId) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
        Sign in to manage your creation studio.
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-600 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Creation studio unavailable</h2>
        <p className="mt-2 text-slate-600">
          Your account doesn&apos;t have creation studio access yet. Ask an administrator to enable creator roles or join a
          creator program.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return <DataStatus status="loading" message="Loading creation studio workspace" />;
  }

  if (error && !data) {
    return <DataStatus status="error" message="Unable to load the creation studio" onRetry={() => refresh({ force: true })} />;
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section id="creation-studio-launch" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Launch</h2>
            <button
              type="button"
              onClick={openList}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent lg:hidden"
            >
              Archive
            </button>
          </div>
          <div key={wizardResetKey} className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <CreationStudioWizard
              catalog={catalog}
              shareDestinations={shareDestinations}
              summary={summary}
              activeItem={activeItem}
              onCreateDraft={handleDraftCreated}
              onUpdateDraft={handleDraftUpdated}
              onSaveStep={handleStepSaved}
              onShare={handleShare}
              onSelectItem={handleSelectItem}
              onArchiveItem={handleArchive}
              onRefresh={() => refresh({ force: true })}
            />
          </div>
        </section>
        <aside
          id="creation-studio-archive"
          className="hidden lg:block"
        >
          <CreationStudioItemList
            items={items}
            summary={summary}
            catalog={catalog}
            onSelectItem={handleSelectItem}
            onArchiveItem={handleArchive}
            onCreateNew={() => {
              setSelectedItemId(null);
              setWizardResetKey((key) => key + 1);
            }}
            variant="panel"
          />
        </aside>
      </div>

      {listOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/50 backdrop-blur-sm lg:hidden">
          <div className="w-full rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Archive</h2>
              <button
                type="button"
                onClick={closeList}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
              >
                Close
              </button>
            </div>
            <CreationStudioItemList
              items={items}
              summary={summary}
              catalog={catalog}
              onSelectItem={handleSelectItem}
              onArchiveItem={handleArchive}
              onCreateNew={() => {
                setSelectedItemId(null);
                setWizardResetKey((key) => key + 1);
              }}
              variant="drawer"
              onClose={closeList}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

CreationStudioWorkspace.propTypes = {
  ownerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hasAccess: PropTypes.bool,
  startFresh: PropTypes.bool,
  initialItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CreationStudioWorkspace.defaultProps = {
  ownerId: null,
  hasAccess: false,
  startFresh: false,
  initialItemId: null,
};
