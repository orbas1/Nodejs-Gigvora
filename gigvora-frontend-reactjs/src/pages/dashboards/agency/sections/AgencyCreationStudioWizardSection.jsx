import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import CreationStudioWizard from '../../../../components/creationStudio/CreationStudioWizard.jsx';
import CreationStudioItemList from '../../../../components/creationStudio/CreationStudioItemList.jsx';
import useAgencyCreationStudio from '../../../../hooks/useAgencyCreationStudio.js';
import { deleteCreationStudioItem } from '../../../../services/agencyCreationStudio.js';

function normaliseCatalog(config) {
  if (!Array.isArray(config)) {
    return [];
  }
  return config.map((entry) => ({
    type: entry.value ?? entry.type ?? entry.id,
    label: entry.label ?? entry.name ?? entry.value ?? entry.type ?? 'Experience',
    summary: entry.summary ?? entry.description ?? null,
  }));
}

function normaliseShareTargets(channels) {
  if (!Array.isArray(channels)) {
    return [];
  }
  return channels.map((channel) => ({
    id: channel.value ?? channel.id ?? channel,
    label: channel.label ?? channel.name ?? channel,
  }));
}

export default function AgencyCreationStudioWizardSection({ agencyProfileId }) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [wizardResetKey, setWizardResetKey] = useState(0);

  const { data, items, loading, error, reload, actions } = useAgencyCreationStudio({
    agencyProfileId,
    enabled: Boolean(agencyProfileId),
  });

  const summary = data?.summary ?? {};
  const catalog = useMemo(() => normaliseCatalog(data?.config?.targetTypes ?? data?.config?.catalog), [data]);
  const shareDestinations = useMemo(
    () => normaliseShareTargets(data?.config?.autoShareChannels ?? data?.config?.shareDestinations),
    [data],
  );

  const activeItem = useMemo(() => items?.find((item) => item.id === selectedItemId) ?? null, [items, selectedItemId]);

  const handleSelectItem = (item) => {
    setSelectedItemId(item?.id ?? null);
    setWizardResetKey((key) => key + 1);
  };

  const handleArchiveItem = async (itemId) => {
    if (!itemId) {
      return;
    }
    await deleteCreationStudioItem(itemId);
    await reload();
    setSelectedItemId((current) => (current === itemId ? null : current));
  };

  const handleCreateDraft = async (payload) => {
    const created = await actions.create(payload);
    setSelectedItemId(created?.id ?? null);
    await reload();
    return created;
  };

  const handleUpdateDraft = async (itemId, payload) => {
    const updated = await actions.update(itemId, payload);
    await reload();
    return updated;
  };

  const handleSaveStep = async (itemId, stepKey, payload) => {
    const nextPayload = { ...payload, stepKey };
    if (!itemId) {
      const created = await actions.create(nextPayload);
      setSelectedItemId(created?.id ?? null);
      await reload();
      return created;
    }
    const updated = await actions.update(itemId, nextPayload);
    await reload();
    return updated;
  };

  const handleShare = async (itemId, payload) => {
    if (!itemId) {
      const created = await actions.create({ ...payload, status: 'scheduled' });
      await reload();
      return created;
    }
    try {
      const shared = await actions.share(itemId, payload);
      await reload();
      return shared;
    } catch (shareError) {
      const fallback = await actions.update(itemId, { ...payload, status: 'published' });
      await reload();
      return fallback;
    }
  };

  return (
    <section
      id="agency-creation-studio"
      className="space-y-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm"
    >
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Creation Studio wizard</p>
          <h2 className="text-3xl font-semibold text-slate-900">Launch every asset with guided quality gates</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Produce CVs, cover letters, gigs, projects, volunteering drives, launchpad roles, and mentorship offerings with autosave, compliance, and share-ready artefacts.
          </p>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          lastUpdated={data?.metadata?.refreshedAt ?? null}
          fromCache={false}
          onRefresh={() => reload()}
          statusLabel="Studio telemetry"
        />
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Create and publish</h3>
            <button
              type="button"
              onClick={() => setListOpen(true)}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 lg:hidden"
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
              onCreateDraft={handleCreateDraft}
              onUpdateDraft={handleUpdateDraft}
              onSaveStep={handleSaveStep}
              onShare={handleShare}
              onSelectItem={handleSelectItem}
              onArchiveItem={handleArchiveItem}
              onRefresh={() => reload()}
            />
          </div>
        </div>

        <aside className="hidden lg:block">
          <CreationStudioItemList
            items={items}
            summary={summary}
            catalog={catalog}
            onSelectItem={handleSelectItem}
            onArchiveItem={handleArchiveItem}
            onCreateNew={() => {
              setSelectedItemId(null);
              setWizardResetKey((key) => key + 1);
            }}
            variant="panel"
          />
        </aside>
      </div>

      {listOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-900/40 backdrop-blur-sm lg:hidden">
          <div className="w-full rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Archive</h3>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Close
              </button>
            </div>
            <CreationStudioItemList
              items={items}
              summary={summary}
              catalog={catalog}
              onSelectItem={(item) => {
                handleSelectItem(item);
                setListOpen(false);
              }}
              onArchiveItem={handleArchiveItem}
              onCreateNew={() => {
                setSelectedItemId(null);
                setWizardResetKey((key) => key + 1);
              }}
              variant="drawer"
              onClose={() => setListOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

AgencyCreationStudioWizardSection.propTypes = {
  agencyProfileId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

AgencyCreationStudioWizardSection.defaultProps = {
  agencyProfileId: undefined,
};

