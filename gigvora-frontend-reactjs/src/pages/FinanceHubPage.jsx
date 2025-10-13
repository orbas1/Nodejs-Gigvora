import PageHeader from '../components/PageHeader.jsx';

export default function FinanceHubPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-12 top-12 h-64 w-64 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Workspace"
          title="Financial hub"
          description="Track escrow releases, invoices, and program budgets across your Gigvora partnerships."
        />
        <div className="mt-10 grid gap-6 rounded-3xl border border-slate-200 bg-white/95 p-8 text-sm text-slate-700 shadow-soft md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Escrow overview</p>
            <p className="mt-2 text-xs text-slate-500">
              Upcoming releases, safeguarding balances, and dispute resolution workflows centralised for finance teams.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Invoices & receipts</p>
            <p className="mt-2 text-xs text-slate-500">Download invoices, reconcile payouts, and sync ledgers with your ERP.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Launchpad budgets</p>
            <p className="mt-2 text-xs text-slate-500">Monitor cohort budgets, stipends, and grant-funded programmes in one view.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Support & reconciliation</p>
            <p className="mt-2 text-xs text-slate-500">Escalate finance questions directly to our support team for rapid assistance.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
