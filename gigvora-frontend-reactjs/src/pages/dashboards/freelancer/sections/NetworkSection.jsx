import SectionShell from '../SectionShell.jsx';

export default function NetworkSection() {
  return (
    <SectionShell
      id="network"
      title="Suggested follows"
      description="Grow your trusted circle with curated introductions and pods."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Collaboration pods</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                name: 'Enterprise product guild',
                focus: 'Seasoned strategists trading templates and opportunities.',
                members: 28,
              },
              {
                name: 'Healthtech circle',
                focus: 'Specialists in regulated markets aligning delivery standards.',
                members: 17,
              },
            ].map((pod) => (
              <div key={pod.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{pod.name}</p>
                <p className="mt-2 text-xs text-slate-500">{pod.focus}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">{pod.members} members</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Request invite
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Signal boost queue</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              'Share Amelia&rsquo;s latest case study to LinkedIn',
              'Invite Priya Desai to next mastermind',
              'Highlight research template in Gigvora spotlight',
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
