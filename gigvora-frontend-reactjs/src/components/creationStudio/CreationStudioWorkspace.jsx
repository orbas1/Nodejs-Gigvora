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

export default function CreationStudioWorkspace({ userId, startFresh, initialItemId }) {
  const [selectedItemId, setSelectedItemId] = useState(initialItemId ?? null);
  const [wizardResetKey, setWizardResetKey] = useState(0);
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleOpenArchive = () => setListOpen(true);
    window.addEventListener('creation-studio:open-archive', handleOpenArchive);
    return () => {
      window.removeEventListener('creation-studio:open-archive', handleOpenArchive);
    };
  }, []);

  const {
    data,
    loading,
    error,
    refresh,
  } = useCachedResource(
    `creation-studio:${userId}`,
    ({ signal }) => fetchCreationWorkspace(userId, { signal }),
    {
      enabled: Boolean(userId),
      ttl: 1000 * 30,
    },
  );

  const items = data?.items ?? [];
  const catalog = data?.catalog ?? [];
  const shareDestinations = data?.shareDestinations ?? [];
  const summary = data?.summary ?? {};

  const activeItem = useMemo(() => items.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  useEffect(() => {
    if (startFresh) {
      setSelectedItemId(null);
      setWizardResetKey((key) => key + 1);
    }
  }, [startFresh]);

  const handleDraftCreated = useCallback(
    async (payload) => {
      const created = await createCreationItem(userId, payload);
      setSelectedItemId(created.id);
      await refresh({ force: true });
      return created;
    },
    [userId, refresh],
  );

  const handleDraftUpdated = useCallback(
    async (itemId, payload) => {
      const updated = await updateCreationItem(userId, itemId, payload);
      await refresh();
      return updated;
    },
    [userId, refresh],
  );

  const handleStepSaved = useCallback(
    async (itemId, stepKey, payload) => {
      const result = await saveCreationStep(userId, itemId, stepKey, payload);
      return result;
    },
    [userId],
  );

  const handleShare = useCallback(
    async (itemId, payload) => {
      const result = await shareCreationItem(userId, itemId, payload);
      await refresh({ force: true });
      return result;
    },
    [userId, refresh],
  );

  const handleArchive = useCallback(
    async (itemId) => {
      await archiveCreationItem(userId, itemId);
      if (itemId === selectedItemId) {
        setSelectedItemId(null);
      }
      await refresh({ force: true });
    },
    [userId, selectedItemId, refresh],
  );

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setWizardResetKey((key) => key + 1);
    setListOpen(false);
  }, []);

  const openList = useCallback(() => setListOpen(true), []);
  const closeList = useCallback(() => setListOpen(false), []);

  if (!userId) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
        Sign in to manage your creation studio.
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
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  startFresh: PropTypes.bool,
  initialItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CreationStudioWorkspace.defaultProps = {
  startFresh: false,
  initialItemId: null,
};
