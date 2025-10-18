import { useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import useSession from '../../../../../hooks/useSession.js';
import useVolunteeringManagement from '../../../../../hooks/useVolunteeringManagement.js';
import OverviewPanel from './OverviewPanel.jsx';
import ApplicationsPanel from './ApplicationsPanel.jsx';
import ResponsesPanel from './ResponsesPanel.jsx';
import ContractsPanel from './ContractsPanel.jsx';
import SpendPanel from './SpendPanel.jsx';

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'apply', label: 'Apply' },
  { id: 'reply', label: 'Reply' },
  { id: 'deals', label: 'Deals' },
  { id: 'spend', label: 'Spend' },
];

function ViewSwitch({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {VIEWS.map((view) => {
        const isActive = active === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isActive
                ? 'bg-slate-900 text-white focus:ring-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-400'
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}

export default function VolunteeringManagementSection() {
  const { freelancerProfile } = useSession();
  const freelancerId = freelancerProfile?.id;
  const [activeView, setActiveView] = useState('overview');
  const [queuedResponse, setQueuedResponse] = useState(null);
  const [queuedSpend, setQueuedSpend] = useState(null);

  const {
    workspace,
    metadata,
    loading,
    mutating,
    error,
    createApplication,
    updateApplication,
    deleteApplication,
    createResponse,
    updateResponse,
    deleteResponse,
    createContract,
    updateContract,
    deleteContract,
    createSpend,
    updateSpend,
    deleteSpend,
  } = useVolunteeringManagement({ freelancerId, enabled: Boolean(freelancerId) });

  const contractsList = useMemo(() => {
    const open = workspace?.contracts?.open ?? [];
    const finished = workspace?.contracts?.finished ?? [];
    return [...open, ...finished];
  }, [workspace]);

  const applications = workspace?.applications ?? [];
  const metrics = workspace?.metrics;

  const renderView = () => {
    if (!workspace && loading) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error.message}
        </div>
      );
    }

    switch (activeView) {
      case 'apply':
        return (
          <ApplicationsPanel
            applications={applications}
            metadata={metadata}
            mutating={mutating}
            onCreate={createApplication}
            onUpdate={updateApplication}
            onDelete={deleteApplication}
            onOpenResponses={(application) => {
              setActiveView('reply');
              setQueuedResponse(application.id);
            }}
          />
        );
      case 'reply':
        return (
          <ResponsesPanel
            applications={applications}
            metadata={metadata}
            mutating={mutating}
            onCreate={createResponse}
            onUpdate={updateResponse}
            onDelete={deleteResponse}
            queuedApplicationId={queuedResponse}
            onQueueConsumed={() => setQueuedResponse(null)}
          />
        );
      case 'deals':
        return (
          <ContractsPanel
            contracts={contractsList}
            applications={applications}
            metadata={metadata}
            mutating={mutating}
            onCreate={createContract}
            onUpdate={updateContract}
            onDelete={deleteContract}
            onOpenSpend={(contract) => {
              setQueuedSpend(contract.id);
              setActiveView('spend');
            }}
          />
        );
      case 'spend':
        return (
          <SpendPanel
            spend={workspace?.spend}
            contracts={contractsList}
            metadata={metadata}
            mutating={mutating}
            onCreate={createSpend}
            onUpdate={updateSpend}
            onDelete={deleteSpend}
            queuedContractId={queuedSpend}
            onQueueConsumed={() => setQueuedSpend(null)}
          />
        );
      case 'overview':
      default:
        return (
          <OverviewPanel
            metrics={metrics}
            workspace={workspace}
            onSelectView={(view) => setActiveView(view)}
          />
        );
    }
  };

  if (!freelancerId) {
    return (
      <SectionShell id="volunteering-management" title="Volunteering" description="Sign in to manage service work.">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Freelancer context missing.
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      id="volunteering-management"
      title="Volunteering"
      description="Applications, replies, deals, and spend."
      actions={<ViewSwitch active={activeView} onChange={setActiveView} />}
    >
      {renderView()}
    </SectionShell>
  );
}
