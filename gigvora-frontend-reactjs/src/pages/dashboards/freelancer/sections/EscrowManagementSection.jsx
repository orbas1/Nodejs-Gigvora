import { useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerEscrow from '../../../../hooks/useFreelancerEscrow.js';
import MetricBoard from './escrow/components/MetricBoard.jsx';
import AccountsPanel from './escrow/AccountsPanel.jsx';
import TransactionsPanel from './escrow/TransactionsPanel.jsx';
import DisputesPanel from './escrow/DisputesPanel.jsx';
import ActivityPanel from './escrow/ActivityPanel.jsx';
import SettingsPanel from './escrow/SettingsPanel.jsx';

const VIEWS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'payments', label: 'Payments' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

function computeFreelancerId(session) {
  return (
    session?.freelancerId ??
    session?.profileId ??
    session?.primaryProfileId ??
    session?.userId ??
    session?.id ??
    null
  );
}

function hasFreelancerAccess(session) {
  const role = (session?.activeRole ?? session?.role ?? '').toString().toLowerCase();
  const workspace = (session?.workspace?.role ?? session?.workspace?.type ?? '').toString().toLowerCase();
  const memberships = Array.isArray(session?.memberships)
    ? session.memberships.map((item) => item.toString().toLowerCase())
    : [];
  return [role, workspace, ...memberships].some((value) => value.includes('freelancer'));
}

export default function EscrowManagementSection() {
  const { session } = useSession();
  const [view, setView] = useState('accounts');

  const freelancerId = useMemo(() => computeFreelancerId(session), [session]);
  const accessGranted = useMemo(() => hasFreelancerAccess(session), [session]);

  const {
    accounts,
    transactions,
    disputes,
    activityLog,
    metrics,
    loading,
    error,
    refresh,
    actionState,
    createAccount,
    updateAccount,
    createTransaction,
    releaseTransaction,
    refundTransaction,
    openDispute,
    appendDisputeEvent,
  } = useFreelancerEscrow({ freelancerId, enabled: accessGranted });

  const body = useMemo(() => {
    if (!accessGranted) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">
          Switch to a freelancer workspace to manage escrow accounts.
        </div>
      );
    }

    switch (view) {
      case 'accounts':
        return (
          <AccountsPanel
            accounts={accounts}
            onCreate={createAccount}
            onUpdate={updateAccount}
            loading={loading}
            actionState={actionState}
          />
        );
      case 'payments':
        return (
          <TransactionsPanel
            accounts={accounts}
            transactions={transactions}
            onCreate={createTransaction}
            onRelease={releaseTransaction}
            onRefund={refundTransaction}
            loading={loading}
            actionState={actionState}
          />
        );
      case 'disputes':
        return (
          <DisputesPanel
            disputes={disputes}
            transactions={transactions}
            onOpenDispute={openDispute}
            onAppendEvent={appendDisputeEvent}
            actionState={actionState}
          />
        );
      case 'activity':
        return <ActivityPanel activity={activityLog} transactions={transactions} />;
      case 'settings':
        return <SettingsPanel accounts={accounts} onUpdate={updateAccount} />;
      default:
        return null;
    }
  }, [
    accessGranted,
    view,
    accounts,
    createAccount,
    updateAccount,
    loading,
    actionState,
    transactions,
    createTransaction,
    releaseTransaction,
    refundTransaction,
    disputes,
    openDispute,
    appendDisputeEvent,
    activityLog,
  ]);

  const actions = [
    <button
      key="sync"
      type="button"
      onClick={() => refresh({ force: true })}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
    >
      <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Sync
    </button>,
  ];

  return (
    <SectionShell
      id="escrow-management"
      title="Escrow"
      description="Control accounts, releases, and trust workflows in one place."
      actions={actions}
    >
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error.message}
        </div>
      ) : null}

      <MetricBoard metrics={metrics} />

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === item.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-slate-50 p-6 shadow-inner">{body}</div>
    </SectionShell>
  );
}
