import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  Cog6ToothIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import useFreelancerPortfolio from '../../../../hooks/useFreelancerPortfolio.js';
import PortfolioEditorDrawer from './portfolio/PortfolioEditorDrawer.jsx';
import PortfolioAssetDrawer from './portfolio/PortfolioAssetDrawer.jsx';
import PortfolioSettingsDialog from './portfolio/PortfolioSettingsDialog.jsx';

const VIEW_TABS = [
  { id: 'work', label: 'Work' },
  { id: 'assets', label: 'Assets' },
  { id: 'settings', label: 'Settings' },
];

function formatDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatLabel(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function PortfolioManagementSection({ freelancerId, canEdit }) {
  const [view, setView] = useState('work');
  const [editorState, setEditorState] = useState({ open: false, mode: 'create', item: null });
  const [assetManagerState, setAssetManagerState] = useState({ open: false, item: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refresh, actions } = useFreelancerPortfolio({
    freelancerId,
    enabled: Boolean(freelancerId),
  });

  const summary = data.summary ?? {};
  const items = useMemo(() => (Array.isArray(data.items) ? data.items : []), [data.items]);
  const settings = data.settings ?? {};
  const assets = useMemo(
    () =>
      items.flatMap((item) =>
        Array.isArray(item.assets)
          ? item.assets.map((asset) => ({
              ...asset,
              portfolioId: item.id,
              portfolioTitle: item.title,
            }))
          : [],
      ),
    [items],
  );

  const summaryCards = useMemo(
    () => [
      { id: 'total', label: 'Cases', value: summary.total ?? 0 },
      { id: 'live', label: 'Live', value: summary.published ?? 0 },
      { id: 'featured', label: 'Featured', value: summary.featured ?? 0 },
      { id: 'assets', label: 'Assets', value: summary.assetCount ?? assets.length ?? 0 },
    ],
    [summary, assets.length],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh({ force: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = () => {
    if (!canEdit) {
      return;
    }
    setEditorState({ open: true, mode: 'create', item: null });
  };

  const handleEdit = (item) => {
    setEditorState({ open: true, mode: 'edit', item });
  };

  const handleDelete = async (item) => {
    if (!canEdit) {
      return;
    }
    const confirmed = window.confirm('Remove this case? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    setPendingItemId(item.id);
    try {
      await actions.deleteItem(item.id);
    } catch (err) {
      window.alert(err?.message ?? 'Unable to delete case.');
    } finally {
      setPendingItemId(null);
    }
  };

  const actionBar = (
    <>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading || refreshing}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        Sync
      </button>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        disabled={!canEdit}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Cog6ToothIcon className="h-4 w-4" />
        Settings
      </button>
      <button
        type="button"
        onClick={handleCreate}
        disabled={!canEdit}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon className="h-4 w-4" />
        New
      </button>
    </>
  );

  return (
    <SectionShell id="portfolio" title="Portfolio" actions={actionBar}>
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error.message || 'Unable to load portfolio.'}
        </div>
      ) : null}

      {!freelancerId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Connect a freelancer profile to manage this workspace.
        </div>
      ) : null}

      {freelancerId && !canEdit ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          View only
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.id} label={card.label} value={card.value} />
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 rounded-full bg-slate-100 p-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {view === 'work' ? `${items.length} items` : view === 'assets' ? `${assets.length} assets` : 'Workspace'}
          </p>
        </div>
      </div>

      {view === 'work' ? (
        items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-10 py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">No work yet</p>
            {canEdit ? (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const busy = pendingItemId === item.id;
              const updated = formatDate(item.updatedAt);
              return (
                <article key={item.id} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      {item.tagline ? <p className="mt-1 text-sm text-slate-500">{item.tagline}</p> : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{formatLabel(item.status)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{formatLabel(item.visibility)}</span>
                    </div>
                  </header>

                  <div className="mt-6 space-y-2 text-sm text-slate-600">
                    {item.clientName ? (
                      <p className="font-medium text-slate-700">{item.clientName}</p>
                    ) : null}
                    {item.role ? <p>{item.role}</p> : null}
                    {item.impactMetrics?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {item.impactMetrics.map((metric) => (
                          <span
                            key={`${item.id}-${metric.label}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                          >
                            {metric.label}: {metric.value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {updated ? <p className="text-xs text-slate-400">Updated {updated}</p> : null}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetManagerState({ open: true, item })}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      <PhotoIcon className="h-4 w-4" />
                      Assets
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className={`h-4 w-4 ${busy ? 'animate-pulse' : ''}`} />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : null}

      {view === 'assets' ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {assets.length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">No assets</p>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Primary</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {assets.map((asset) => (
                    <tr key={`${asset.portfolioId}-${asset.id}`}>
                      <td className="px-4 py-3 font-semibold text-slate-700">{asset.portfolioTitle}</td>
                      <td className="px-4 py-3">{asset.label}</td>
                      <td className="px-4 py-3">{formatLabel(asset.assetType)}</td>
                      <td className="px-4 py-3">{asset.isPrimary ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setAssetManagerState({ open: true, item: items.find((it) => it.id === asset.portfolioId) })}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {view === 'settings' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <dl className="grid gap-4 text-sm text-slate-600">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Headline</dt>
                <dd className="mt-1 text-base font-semibold text-slate-900">{settings.heroHeadline || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Default visibility</dt>
                <dd className="mt-1 font-semibold text-slate-900">{formatLabel(settings.defaultVisibility) || 'Public'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview path</dt>
                <dd className="mt-1 font-mono text-sm text-slate-700">{settings.previewBasePath || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact email</dt>
                <dd className="mt-1 text-sm text-slate-700">{settings.contactEmail || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scheduling</dt>
                <dd className="mt-1 text-sm text-slate-700">{settings.schedulingLink || '—'}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                disabled={!canEdit}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Sharing</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Downloads {settings.allowPublicDownload ? 'enabled' : 'disabled'}</li>
              <li>Auto share {settings.autoShareToFeed ? 'enabled' : 'disabled'}</li>
              <li>Metrics {settings.showMetrics ? 'visible' : 'hidden'}</li>
              <li>Testimonials {settings.showTestimonials ? 'visible' : 'hidden'}</li>
              <li>Contact button {settings.showContactButton ? 'visible' : 'hidden'}</li>
            </ul>
          </div>
        </div>
      ) : null}

      <PortfolioEditorDrawer
        open={editorState.open}
        mode={editorState.mode}
        item={editorState.item}
        canEdit={canEdit}
        onClose={() => setEditorState({ open: false, mode: 'create', item: null })}
        onSubmit={async (payload) => {
          if (!canEdit) {
            return null;
          }
          if (editorState.mode === 'edit' && editorState.item) {
            return actions.updateItem(editorState.item.id, payload);
          }
          return actions.createItem(payload);
        }}
      />

      <PortfolioAssetDrawer
        open={assetManagerState.open}
        item={assetManagerState.item}
        canEdit={canEdit}
        onClose={() => setAssetManagerState({ open: false, item: null })}
        onCreate={(portfolioId, payload) => actions.createAsset(portfolioId, payload)}
        onUpdate={(portfolioId, assetId, payload) => actions.updateAsset(portfolioId, assetId, payload)}
        onDelete={(portfolioId, assetId) => actions.deleteAsset(portfolioId, assetId)}
      />

      <PortfolioSettingsDialog
        open={settingsOpen}
        settings={settings}
        canEdit={canEdit}
        saving={savingSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={async (payload) => {
          if (!canEdit) {
            return;
          }
          setSavingSettings(true);
          try {
            await actions.updateSettings(payload);
            setSettingsOpen(false);
          } finally {
            setSavingSettings(false);
          }
        }}
      />
    </SectionShell>
  );
}
