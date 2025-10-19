import SectionShell from '../../SectionShell.jsx';

export default function ProjectLabSection() {
  return (
    <SectionShell
      id="project-lab"
      title="Project lab"
      description="Blueprint custom enterprise engagements with structured milestones and controls."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Project composer</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-name">
                Engagement name
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="Transformation roadmap for Northwind Bank"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-duration">
                Duration
              </label>
              <select
                id="project-duration"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option>6 weeks</option>
                <option>8 weeks</option>
                <option>12 weeks</option>
                <option>Quarterly retainer</option>
              </select>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((milestone) => (
              <div key={milestone} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Milestone {milestone}</p>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Configure tasks
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Define deliverables, acceptance criteria, and key roles."
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {['Owner', 'Budget', 'Dependencies'].map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Risk & compliance guardrails</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                <span>Contract compliance locker</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Syncing</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <span>Security questionnaire</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Cleared</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2">
                <span>Payment milestones</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Automated</span>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Stakeholder map</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              {[
                { label: 'Executive sponsor', name: 'Riya Patel', status: 'Engaged' },
                { label: 'Ops lead', name: 'Caleb Myers', status: 'Needs update' },
                { label: 'Finance partner', name: 'Dana Lee', status: 'Reviewing SOW' },
              ].map((stakeholder) => (
                <div key={stakeholder.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stakeholder.label}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span>{stakeholder.name}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{stakeholder.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
