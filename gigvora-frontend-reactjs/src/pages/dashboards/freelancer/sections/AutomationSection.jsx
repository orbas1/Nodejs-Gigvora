import SectionShell from '../SectionShell.jsx';
import { SAMPLE_AUTOMATIONS } from '../sampleData.js';

export default function AutomationSection() {
  return (
    <SectionShell
      id="automation"
      title="Automation & signals"
      description="Client success intelligence with automated playbooks and referrals."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Active playbooks</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_AUTOMATIONS.map((automation) => (
              <li key={automation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{automation.name}</p>
                    <p className="text-xs text-slate-500">Trigger: {automation.trigger}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    {automation.health}
                  </span>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                  {automation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            Create new playbook
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Referral intelligence</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="font-semibold text-slate-900">Warm advocates</p>
              <p className="text-xs text-slate-500">6 clients ready to refer within the next 14 days.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-slate-900">Affiliate partners</p>
              <p className="text-xs text-slate-500">Generate co-marketing kits and partnership tracking links.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Manage referrals
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
