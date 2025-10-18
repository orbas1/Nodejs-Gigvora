import { useMemo, useState } from 'react';
import {
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import { useEscrow } from './EscrowContext.jsx';
import ActivityDrawer from './ActivityDrawer.jsx';
import AccountDrawer from './AccountDrawer.jsx';
import TransactionWizard from './TransactionWizard.jsx';
import EscrowToast from './EscrowToast.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import AccountsPanel from './AccountsPanel.jsx';
import TransactionsPanel from './TransactionsPanel.jsx';
import ControlsPanel from './ControlsPanel.jsx';
import AuditPanel from './AuditPanel.jsx';

const VIEWS = [
  { id: 'home', label: 'Home', icon: HomeIcon, component: OverviewPanel },
  { id: 'accounts', label: 'Accounts', icon: BanknotesIcon, component: AccountsPanel },
  { id: 'moves', label: 'Moves', icon: QueueListIcon, component: TransactionsPanel },
  { id: 'rules', label: 'Rules', icon: Cog6ToothIcon, component: ControlsPanel },
  { id: 'audit', label: 'Audit', icon: ChartBarIcon, component: AuditPanel },
];

export default function EscrowShell() {
  const { state, closeActivityDrawer } = useEscrow();
  const [activeView, setActiveView] = useState('home');

  const ActiveComponent = useMemo(
    () => VIEWS.find((view) => view.id === activeView)?.component ?? OverviewPanel,
    [activeView],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <nav className="flex flex-row gap-2 lg:flex-col">
          {VIEWS.map((view) => {
            const Icon = view.icon;
            const active = activeView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="min-h-[70vh]">
        <ActiveComponent />
      </main>
      <ActivityDrawer
        open={state.activityDrawer.open}
        title={state.activityDrawer.title}
        payload={state.activityDrawer.payload}
        onClose={closeActivityDrawer}
      />
      <AccountDrawer />
      <TransactionWizard />
      <EscrowToast />
    </div>
  );
}
