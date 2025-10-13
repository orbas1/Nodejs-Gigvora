import SectionShell from '../SectionShell.jsx';
import { SAMPLE_GIG_ORDERS, SAMPLE_JOBS } from '../sampleData.js';

export default function DeliveryOperationsSection() {
  return (
    <SectionShell
      id="delivery-ops"
      title="Delivery operations"
      description="Monitor live jobs, gig production, and client commitments."
      actions={[
        <button
          key="delivery-alert"
          type="button"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          Raise delivery alert
        </button>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Active jobs</p>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
              {SAMPLE_JOBS.length} jobs
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_JOBS.map((job) => (
              <li key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.client}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{job.stage}</p>
                    <p className="mt-1 font-semibold text-blue-600">Due {job.dueDate}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Projected value</span>
                  <span className="font-semibold text-slate-900">{job.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Gig production</p>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
              SLA 94%
            </span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_GIG_ORDERS.map((order) => (
              <li key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{order.gig}</p>
                    <p className="text-xs text-slate-500">Order {order.id}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{order.status}</p>
                    <p className="mt-1 font-semibold text-blue-600">Submitted {order.submitted}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Contract value</span>
                  <span className="font-semibold text-slate-900">{order.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Delivery rituals</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Quality reviews', cadence: 'Every Tuesday', owner: 'Amelia' },
            { label: 'Client pulse checks', cadence: 'Wed & Fri', owner: 'Account AI' },
            { label: 'Success story capture', cadence: 'Bi-weekly', owner: 'Advocacy desk' },
            { label: 'Renewal forecasting', cadence: 'Monthly', owner: 'Finance partner' },
          ].map((ritual) => (
            <div key={ritual.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{ritual.label}</p>
              <p className="mt-1 text-xs text-slate-500">{ritual.cadence}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Lead: {ritual.owner}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
