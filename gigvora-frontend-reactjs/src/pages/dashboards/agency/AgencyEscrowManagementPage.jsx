import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import { AGENCY_ESCROW_MENU } from '../../../constants/agencyDashboardMenu.js';
import { EscrowProvider, useEscrow } from './escrow/EscrowContext.jsx';
import EscrowShell from './escrow/EscrowShell.jsx';

function EscrowContent() {
  const { state } = useEscrow();
  const workspace = state.overview.data?.workspace ?? null;

  return (
    <AgencyDashboardLayout
      title="Escrow"
      subtitle="Manage balances, moves, and guardrails."
      menuSections={AGENCY_ESCROW_MENU}
      activeMenuItem="agency-escrow"
      workspace={workspace}
    >
      <EscrowShell />
    </AgencyDashboardLayout>
  );
}

export default function AgencyEscrowManagementPage() {
  return (
    <EscrowProvider>
      <EscrowContent />
    </EscrowProvider>
  );
}
