import SectionShell from '../SectionShell.jsx';
import { SAMPLE_CALENDAR } from '../sampleData.js';

function GreetingCard({ profile }) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src={profile.avatarUrl} alt={profile.name} className="h-16 w-16 rounded-2xl object-cover" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{formattedDate}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              Good morning, {profile.name.split(' ')[0]} 👋
            </p>
            <p className="mt-1 text-sm text-slate-600">Here&rsquo;s what&rsquo;s lined up across your Gigvora workspace today.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white/70 px-6 py-4 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Today&rsquo;s weather</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">18&deg;C · Partly sunny</p>
          <p className="mt-1 text-xs text-slate-500">Perfect conditions for deep work sessions and afternoon workshops.</p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection({ profile }) {
  return (
    <SectionShell
      id="profile-overview"
      title="Mission control overview"
      description="Trust scores, active engagements, and live telemetry at a glance."
    >
      <GreetingCard profile={profile} />
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: 'Trustscore', value: '96 / 100', trend: '+2.1 vs last month' },
          { label: 'Reviews', value: '182', trend: '4 new this week' },
          { label: 'Active jobs', value: '7', trend: '2 in kickoff' },
          { label: 'Gig orders', value: '11', trend: '3 awaiting QA' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs font-medium text-emerald-600">{metric.trend}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Live workstreams</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-2xl border border-blue-50 bg-blue-50/60 px-3 py-2">
              <span>Experience audit · Lumina Health</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Due Fri</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-emerald-50 bg-emerald-50/70 px-3 py-2">
              <span>Retention diagnostics · Northwind</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">QA</span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>New gig onboarding · Atlas Robotics</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kickoff</span>
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Relationship health</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Retention score</p>
              <p className="text-xs text-slate-500">Tracking stability of retainers and renewals.</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[78%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-xs text-emerald-600">78% healthy · 3 accounts require attention</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Advocacy velocity</p>
              <p className="text-xs text-slate-500">Testimonials, case studies, and references flowing through.</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">6 assets in progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Upcoming schedule</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {SAMPLE_CALENDAR.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span>{slot.label}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">{slot.type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
