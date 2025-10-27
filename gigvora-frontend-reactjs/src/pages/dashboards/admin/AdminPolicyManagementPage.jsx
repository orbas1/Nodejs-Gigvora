import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminGovernanceLayout from '../../../components/admin/AdminGovernanceLayout.jsx';
import PolicyManager from '../../../components/admin/legal/PolicyManager.jsx';
import useSession from '../../../hooks/useSession.js';

const MENU_SECTIONS = [
  {
    label: 'Legal',
    items: [
      { id: 'library', name: 'Library', sectionId: 'policy-library' },
      { id: 'workflow', name: 'Workflow', sectionId: 'policy-workflow' },
    ],
  },
  {
    label: 'Navigation',
    items: [
      { id: 'governance-home', name: 'Governance overview', href: '/dashboard/admin/governance' },
      { id: 'documents', name: 'Document workflows', href: '/dashboard/admin/governance/documents' },
    ],
  },
];

const SECTIONS = [
  { id: 'policy-library', title: 'Policy library' },
  { id: 'policy-workflow', title: 'Workflow' },
];

export default function AdminPolicyManagementPage() {
  const { session } = useSession();
  const navigate = useNavigate();

  const headerActions = useMemo(
    () => [
      {
        label: 'Governance overview',
        variant: 'secondary',
        onClick: () => navigate('/dashboard/admin/governance'),
      },
      {
        label: 'Document workflows',
        variant: 'secondary',
        onClick: () => navigate('/dashboard/admin/governance/documents'),
      },
    ],
    [navigate],
  );

  return (
    <AdminGovernanceLayout
      session={session}
      currentDashboard="admin"
      title="Legal policies"
      subtitle="Admin portal & governance"
      description="Manage policy versions, audit events, and publication workflows."
      menuConfig={MENU_SECTIONS}
      sections={SECTIONS}
      headerActions={headerActions}
      statusLabel="Policy manager"
      statusChildren={
        <p className="text-xs text-slate-500">Create, review, and publish Gigvora legal documents across every locale.</p>
      }
      onNavigate={(href) => navigate(href)}
    >
      <section id="policy-library" className="min-h-screen rounded-3xl bg-slate-50/60 px-6 pb-12 pt-6">
        <PolicyManager />
      </section>
      <section
        id="policy-workflow"
        className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-sm text-slate-600"
      >
        <h2 className="text-base font-semibold text-slate-900">Workflow guidance</h2>
        <p className="mt-2">
          Use the workflow tools to capture approvals, schedule effective dates, and broadcast changes to stakeholders. Every
          activation records an audit event so legal teams and executives can review provenance before sign-off.
        </p>
      </section>
    </AdminGovernanceLayout>
  );
}
