import { useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useDisputeManagement from '../../../hooks/useDisputeManagement.js';
import DisputeSummaryCards from '../../../components/disputes/DisputeSummaryCards.jsx';
import DisputeQueueTable from '../../../components/disputes/DisputeQueueTable.jsx';
import DisputeDetailDrawer from '../../../components/disputes/DisputeDetailDrawer.jsx';
import DisputeSettingsPanel from '../../../components/disputes/DisputeSettingsPanel.jsx';
import DisputeTemplateManager from '../../../components/disputes/DisputeTemplateManager.jsx';
import DisputeCreateModal from '../../../components/disputes/DisputeCreateModal.jsx';

const MENU_SECTIONS = [
  {
    label: 'Main',
    items: [
      { name: 'Overview', sectionId: 'overview' },
      { name: 'Cases', sectionId: 'cases' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { name: 'Rules', sectionId: 'rules' },
      { name: 'Playbooks', sectionId: 'playbooks' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['company', 'headhunter', 'user', 'agency'];

const VIEW_OPTIONS = [
  { key: 'cases', label: 'Cases' },
  { key: 'rules', label: 'Rules' },
  { key: 'playbooks', label: 'Playbooks' },
];

export default function CompanyDisputeManagementPage() {
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(undefined);
  const [activeView, setActiveView] = useState('cases');

  const {
    filters,
    setFilters,
    disputes,
    summary,
    pagination,
    loading,
    refresh,
    selectedCaseId,
    selectCase,
    selectedCase,
    selectedCaseLoading,
    createDispute,
    updateDispute,
    addDisputeEvent,
    settings,
    settingsLoading,
    saveSettings,
    templates,
    templatesLoading,
    createTemplate,
    updateTemplate,
    removeTemplate,
  } = useDisputeManagement({ workspaceId: activeWorkspaceId });

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filtersWithWorkspace = useMemo(
    () => ({ ...filters, workspaceId: activeWorkspaceId }),
    [filters, activeWorkspaceId],
  );

  const handleCreateDispute = async (payload) => {
    await createDispute(payload);
    setCreateModalOpen(false);
  };

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Disputes"
      subtitle="Live control center for trust operations"
      menuSections={MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="flex flex-col gap-8 pb-12">
        <section
          id="overview"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,260px)_1fr] xl:items-start">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Workspace</h2>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={workspaceInput}
                  onChange={(event) => setWorkspaceInput(event.target.value)}
                  placeholder="Workspace ID"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = workspaceInput.trim();
                      if (!trimmed) {
                        setActiveWorkspaceId(undefined);
                        return;
                      }
                      const parsed = Number(trimmed);
                      setActiveWorkspaceId(Number.isFinite(parsed) ? parsed : undefined);
                    }}
                    className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceInput('');
                      setActiveWorkspaceId(undefined);
                    }}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                New case
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <DisputeSummaryCards summary={summary} onRefresh={refresh} />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1">
            {VIEW_OPTIONS.map((view) => (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeView === view.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
          >
            Refresh
          </button>
        </div>

        <section id="cases" className={activeView === 'cases' ? 'block' : 'hidden'}>
          <DisputeQueueTable
            disputes={disputes}
            loading={loading}
            filters={filtersWithWorkspace}
            onFilterChange={setFilters}
            onSelectDispute={(id) => selectCase(id)}
            onCreateDispute={() => setCreateModalOpen(true)}
            pagination={pagination}
            onRefresh={refresh}
            onRequestReminder={(id) => selectCase(id)}
          />
        </section>

        <section id="rules" className={activeView === 'rules' ? 'block' : 'hidden'}>
          <DisputeSettingsPanel settings={settings} loading={settingsLoading} onSave={saveSettings} />
        </section>

        <section id="playbooks" className={activeView === 'playbooks' ? 'block' : 'hidden'}>
          <DisputeTemplateManager
            templates={templates}
            loading={templatesLoading}
            onCreate={createTemplate}
            onUpdate={updateTemplate}
            onDelete={removeTemplate}
          />
        </section>
      </div>

      <DisputeDetailDrawer
        dispute={selectedCase}
        open={Boolean(selectedCaseId)}
        loading={selectedCaseLoading}
        onClose={() => selectCase(null)}
        onUpdate={updateDispute}
        onAddEvent={addDisputeEvent}
        templates={templates}
      />

      <DisputeCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateDispute}
        templates={templates}
      />
    </DashboardLayout>
  );
}
