import { useMemo, useState } from 'react';
import DataStatus from '../../DataStatus.jsx';
import WorkforceSummaryCards from './WorkforceSummaryCards.jsx';
import WorkforceMemberManager from './WorkforceMemberManager.jsx';
import PayDelegationsPanel from './PayDelegationsPanel.jsx';
import ProjectDelegationsPanel from './ProjectDelegationsPanel.jsx';
import GigDelegationsPanel from './GigDelegationsPanel.jsx';
import CapacitySnapshotsPanel from './CapacitySnapshotsPanel.jsx';
import AvailabilityPanel from './AvailabilityPanel.jsx';

export default function AgencyWorkforceDashboard({
  data,
  loading,
  error,
  summaryCards,
  onRefresh,
  workspaceId,
  permissions = {},
  actions = {},
}) {
  const [activeSection, setActiveSection] = useState('home');
  const members = data?.members ?? [];
  const payDelegations = data?.payDelegations ?? [];
  const projectDelegations = data?.projectDelegations ?? [];
  const gigDelegations = data?.gigDelegations ?? [];
  const capacitySnapshots = data?.capacitySnapshots ?? [];
  const availability = data?.availability ?? [];

  const canEdit = Boolean(permissions?.canEdit);

  const navItems = useMemo(
    () => [
      { id: 'home', label: 'Home' },
      { id: 'team', label: 'Team' },
      { id: 'pay', label: 'Pay' },
      { id: 'projects', label: 'Projects' },
      { id: 'gigs', label: 'Gigs' },
      { id: 'capacity', label: 'Capacity' },
      { id: 'availability', label: 'Availability' },
    ],
    [],
  );

  const statusBanner = useMemo(() => {
    if (error) {
      return <DataStatus status="error" title="Unable to load data" />;
    }
    if (loading && !data) {
      return <DataStatus status="loading" title="Loading" />;
    }
    return null;
  }, [data, error, loading]);

  const quickSections = useMemo(() => navItems.filter((item) => item.id !== 'home'), [navItems]);

  let sectionContent = null;

  switch (activeSection) {
    case 'team':
      sectionContent = (
        <WorkforceMemberManager
          members={members}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.createMember}
          onUpdate={actions.updateMember}
          onDelete={actions.deleteMember}
        />
      );
      break;
    case 'pay':
      sectionContent = (
        <PayDelegationsPanel
          delegations={payDelegations}
          members={members}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.createPayDelegation}
          onUpdate={actions.updatePayDelegation}
          onDelete={actions.deletePayDelegation}
        />
      );
      break;
    case 'projects':
      sectionContent = (
        <ProjectDelegationsPanel
          delegations={projectDelegations}
          members={members}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.createProjectDelegation}
          onUpdate={actions.updateProjectDelegation}
          onDelete={actions.deleteProjectDelegation}
        />
      );
      break;
    case 'gigs':
      sectionContent = (
        <GigDelegationsPanel
          delegations={gigDelegations}
          members={members}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.createGigDelegation}
          onUpdate={actions.updateGigDelegation}
          onDelete={actions.deleteGigDelegation}
        />
      );
      break;
    case 'capacity':
      sectionContent = (
        <CapacitySnapshotsPanel
          snapshots={capacitySnapshots}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.recordCapacitySnapshot}
          onUpdate={actions.updateCapacitySnapshot}
          onDelete={actions.deleteCapacitySnapshot}
        />
      );
      break;
    case 'availability':
      sectionContent = (
        <AvailabilityPanel
          availability={availability}
          members={members}
          workspaceId={workspaceId}
          canEdit={canEdit}
          onCreate={actions.createAvailabilityEntry}
          onUpdate={actions.updateAvailabilityEntry}
          onDelete={actions.deleteAvailabilityEntry}
        />
      );
      break;
    case 'home':
    default:
      sectionContent = (
        <WorkforceSummaryCards
          cards={summaryCards}
          onRefresh={onRefresh ? () => onRefresh({ force: true }) : undefined}
          loading={loading}
          quickSections={quickSections}
          onSelectSection={(sectionId) => setActiveSection(sectionId)}
        />
      );
      break;
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[200px_1fr] xl:grid-cols-[220px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-col gap-6">
        {statusBanner}
        {sectionContent}
      </div>
    </div>
  );
}
