import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import FinancialSummaryCards from '../../../components/admin/finance/FinancialSummaryCards.jsx';
import TreasuryPolicyForm from '../../../components/admin/finance/TreasuryPolicyForm.jsx';
import FeeRuleManager from '../../../components/admin/finance/FeeRuleManager.jsx';
import PayoutScheduleManager from '../../../components/admin/finance/PayoutScheduleManager.jsx';
import EscrowAdjustmentManager from '../../../components/admin/finance/EscrowAdjustmentManager.jsx';
import RecentTransactionsTable from '../../../components/admin/finance/RecentTransactionsTable.jsx';
import {
  fetchFinanceDashboard,
  saveTreasuryPolicy,
  createFeeRule,
  updateFeeRule,
  deleteFeeRule,
  createPayoutSchedule,
  updatePayoutSchedule,
  deletePayoutSchedule,
  createEscrowAdjustment,
  updateEscrowAdjustment,
  deleteEscrowAdjustment,
} from '../../../services/adminFinance.js';

const MENU_SECTIONS = [
  {
    label: 'Financial management',
    items: [
      { name: 'Treasury overview', sectionId: 'finance-summary' },
      { name: 'Treasury policy', sectionId: 'finance-policy' },
      { name: 'Fee rules', sectionId: 'finance-fee-rules' },
      { name: 'Payout schedules', sectionId: 'finance-payout-schedules' },
      { name: 'Escrow adjustments', sectionId: 'finance-escrow-adjustments' },
      { name: 'Recent transactions', sectionId: 'finance-transactions' },
    ],
  },
  {
    label: 'Navigate',
    items: [{ name: 'Admin control tower', href: '/dashboard/admin' }],
  },
];

const LOOKBACK_DAYS = 90;

function StatusSummaryCard({ title, items }) {
  const entries = Object.entries(items ?? {}).filter(([, value]) => value != null);
  if (!entries.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-600">
        {entries.map(([key, value]) => (
          <li key={key} className="flex items-center justify-between">
            <span className="uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
            <span className="font-semibold text-slate-800">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow">
      <p className="text-sm font-semibold text-slate-600">Loading financial data…</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow">
      <p className="text-sm font-semibold text-rose-600">{error}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-400"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export default function AdminFinancialManagementPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    fetchFinanceDashboard({ lookbackDays: LOOKBACK_DAYS })
      .then((response) => {
        if (!isMounted) return;
        setData(response);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message ?? 'Unable to load financial dashboard.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [refreshIndex]);

  const defaultCurrency = (data?.treasuryPolicy?.defaultCurrency ?? 'USD').toUpperCase();

  const formatCurrency = useMemo(() => {
    return (value, currency = defaultCurrency) => {
      const numeric = Number(value ?? 0);
      if (!Number.isFinite(numeric)) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(0);
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: Math.abs(numeric) >= 1000 ? 0 : 2,
      }).format(numeric);
    };
  }, [defaultCurrency]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

  const formatNumber = (value) => {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) {
      return '0';
    }
    return numberFormatter.format(numeric);
  };

  const formatPercent = (value) => {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) {
      return '0%';
    }
    return `${numeric.toFixed(2)}%`;
  };

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    setRefreshIndex((index) => index + 1);
  };

  const handleSavePolicy = async (payload) => {
    await saveTreasuryPolicy(payload);
    handleRefresh();
  };

  const handleCreateFeeRule = async (payload) => {
    await createFeeRule(payload);
    handleRefresh();
  };

  const handleUpdateFeeRule = async (feeRuleId, payload) => {
    await updateFeeRule(feeRuleId, payload);
    handleRefresh();
  };

  const handleDeleteFeeRule = async (feeRuleId) => {
    await deleteFeeRule(feeRuleId);
    handleRefresh();
  };

  const handleCreateSchedule = async (payload) => {
    await createPayoutSchedule(payload);
    handleRefresh();
  };

  const handleUpdateSchedule = async (scheduleId, payload) => {
    await updatePayoutSchedule(scheduleId, payload);
    handleRefresh();
  };

  const handleDeleteSchedule = async (scheduleId) => {
    await deletePayoutSchedule(scheduleId);
    handleRefresh();
  };

  const handleCreateAdjustment = async (payload) => {
    await createEscrowAdjustment(payload);
    handleRefresh();
  };

  const handleUpdateAdjustment = async (adjustmentId, payload) => {
    await updateEscrowAdjustment(adjustmentId, payload);
    handleRefresh();
  };

  const handleDeleteAdjustment = async (adjustmentId) => {
    await deleteEscrowAdjustment(adjustmentId);
    handleRefresh();
  };

  const renderDashboard = () => {
    if (loading && !data) {
      return <LoadingState />;
    }
    if (error) {
      return <ErrorState error={error} onRetry={handleRefresh} />;
    }
    if (!data) {
      return null;
    }

    return (
      <div className="space-y-8">
        <FinancialSummaryCards
          summary={data.summary}
          lookbackDays={LOOKBACK_DAYS}
          refreshedAt={data.refreshedAt}
          onRefresh={handleRefresh}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <StatusSummaryCard title="Transactions by status" items={data.summary?.transactionsByStatus} />
          <StatusSummaryCard title="Accounts by status" items={data.summary?.accountsByStatus} />
        </div>

        <TreasuryPolicyForm policy={data.treasuryPolicy} onSave={handleSavePolicy} />

        <FeeRuleManager
          feeRules={data.feeRules}
          onCreate={handleCreateFeeRule}
          onUpdate={handleUpdateFeeRule}
          onDelete={handleDeleteFeeRule}
          formatCurrency={formatCurrency}
          formatPercent={formatPercent}
        />

        <PayoutScheduleManager
          payoutSchedules={data.payoutSchedules}
          onCreate={handleCreateSchedule}
          onUpdate={handleUpdateSchedule}
          onDelete={handleDeleteSchedule}
          formatDate={formatDate}
        />

        <EscrowAdjustmentManager
          adjustments={data.escrowAdjustments}
          onCreate={handleCreateAdjustment}
          onUpdate={handleUpdateAdjustment}
          onDelete={handleDeleteAdjustment}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />

        <RecentTransactionsTable
          transactions={data.recentTransactions}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>
    );
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Financial management"
      subtitle="Treasury, payouts, and fee governance"
      description="Operate Gigvora’s financial backbone with confidence—configure policies, monitor liquidity, and approve adjustments."
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      activeMenuItem="finance-summary"
    >
      {renderDashboard()}
    </DashboardLayout>
  );
}
