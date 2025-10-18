import { UsersIcon, ChartBarIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function ProfileCollaborationCard({
  collaborationRoster,
  onAddCollaborator,
  onUpdateCollaborator,
  onRemoveCollaborator,
  impactHighlights,
  onAddImpact,
  onUpdateImpact,
  onRemoveImpact,
  pipelineInsights,
  onAddPipeline,
  onUpdatePipeline,
  onRemovePipeline,
  canEdit,
}) {
  const collaborators = Array.isArray(collaborationRoster) ? collaborationRoster : [];
  const impacts = Array.isArray(impactHighlights) ? impactHighlights : [];
  const pipelines = Array.isArray(pipelineInsights) ? pipelineInsights : [];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Team</h3>
        <UsersIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">Collaborators</span>
          <button
            type="button"
            onClick={onAddCollaborator}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {collaborators.length === 0 ? <p className="text-sm text-slate-500">Add your core crew.</p> : null}
          {collaborators.map((collaborator, index) => (
            <details key={`collaborator-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                <span>{collaborator.name || 'Collaborator'}</span>
                <span className="text-xs font-medium text-slate-500">{collaborator.role || ''}</span>
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                  <input
                    type="text"
                    value={collaborator.name}
                    onChange={(event) => onUpdateCollaborator(index, { name: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
                  <input
                    type="text"
                    value={collaborator.role}
                    onChange={(event) => onUpdateCollaborator(index, { role: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar seed</span>
                  <input
                    type="text"
                    value={collaborator.avatarSeed}
                    onChange={(event) => onUpdateCollaborator(index, { avatarSeed: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</span>
                  <input
                    type="text"
                    value={collaborator.contact}
                    onChange={(event) => onUpdateCollaborator(index, { contact: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveCollaborator(index)}
                  disabled={!canEdit}
                  className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Remove
                </button>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ChartBarIcon className="h-5 w-5 text-accent" aria-hidden="true" /> Impact
          </span>
          <button
            type="button"
            onClick={onAddImpact}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {impacts.length === 0 ? <p className="text-sm text-slate-500">Pin key numbers.</p> : null}
          {impacts.map((impact, index) => (
            <details key={`impact-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                <span>{impact.title || 'Impact'}</span>
                <span className="text-xs font-medium text-slate-500">{impact.value || ''}</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                    <input
                      type="text"
                      value={impact.title}
                      onChange={(event) => onUpdateImpact(index, { title: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</span>
                    <input
                      type="text"
                      value={impact.value}
                      onChange={(event) => onUpdateImpact(index, { value: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                  <textarea
                    rows={3}
                    value={impact.description}
                    onChange={(event) => onUpdateImpact(index, { description: event.target.value })}
                    disabled={!canEdit}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoveImpact(index)}
                    disabled={!canEdit}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <RocketLaunchIcon className="h-5 w-5 text-accent" aria-hidden="true" /> Pipeline
          </span>
          <button
            type="button"
            onClick={onAddPipeline}
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Add
          </button>
        </div>

        <div className="space-y-3">
          {pipelines.length === 0 ? <p className="text-sm text-slate-500">Note key deals.</p> : null}
          {pipelines.map((pipeline, index) => (
            <details key={`pipeline-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4" open={index === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                <span>{pipeline.project || 'Project'}</span>
                <span className="text-xs font-medium text-slate-500">{pipeline.status || ''}</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</span>
                    <input
                      type="text"
                      value={pipeline.project}
                      onChange={(event) => onUpdatePipeline(index, { project: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payout</span>
                    <input
                      type="text"
                      value={pipeline.payout}
                      onChange={(event) => onUpdatePipeline(index, { payout: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                    <input
                      type="text"
                      value={pipeline.status}
                      onChange={(event) => onUpdatePipeline(index, { status: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Countdown</span>
                    <input
                      type="text"
                      value={pipeline.countdown}
                      onChange={(event) => onUpdatePipeline(index, { countdown: event.target.value })}
                      disabled={!canEdit}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemovePipeline(index)}
                    disabled={!canEdit}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
