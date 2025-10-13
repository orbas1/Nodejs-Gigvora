export default function ResourcesSection({ explorerPlacement }) {
  const nextActions = explorerPlacement?.nextActions ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Explorer placement</h3>
        <p className="mt-1 text-sm text-slate-500">
          Your mentor profile ranks in Explorer based on responsiveness, feedback quality, and package clarity.
        </p>
        {explorerPlacement ? (
          <dl className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">Score</dt>
              <dd className="text-base font-semibold text-slate-900">{explorerPlacement.score}/100</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-slate-500">Placement</dt>
              <dd className="text-base font-semibold text-slate-900">{explorerPlacement.position}</dd>
            </div>
          </dl>
        ) : null}
        {nextActions.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next actions</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Mentor resource hub</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>
            <a href="https://guides.gigvora.com/mentor-playbook" target="_blank" rel="noreferrer" className="font-semibold text-accent hover:text-accentDark">
              Mentor playbook
            </a>
            <p className="text-xs text-slate-500">Frameworks for onboarding mentees, defining outcomes, and measuring progress.</p>
          </li>
          <li>
            <a href="https://guides.gigvora.com/mentor-automation" target="_blank" rel="noreferrer" className="font-semibold text-accent hover:text-accentDark">
              Automation toolkit
            </a>
            <p className="text-xs text-slate-500">Templates for calendar routing, Loom feedback workflows, and billing automation.</p>
          </li>
          <li>
            <a href="https://community.gigvora.com/mentor-guild" target="_blank" rel="noreferrer" className="font-semibold text-accent hover:text-accentDark">
              Mentor guild community
            </a>
            <p className="text-xs text-slate-500">Swap playbooks with other mentors, host clinics, and share best practices.</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
