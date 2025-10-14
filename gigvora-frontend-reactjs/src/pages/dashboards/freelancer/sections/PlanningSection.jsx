import { HeartIcon } from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';

export default function PlanningSection() {
  return (
    <SectionShell
      id="planning"
      title="Calendar & capacity planning"
      description="Balance delivery, growth, and personal rituals with a single view."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">This week&rsquo;s capacity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Committed hours</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">32h / 40h</p>
              <p className="mt-1 text-xs text-slate-600">Room for two 2-hour discovery sessions.</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Focus blocks</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">5 deep-work sessions</p>
              <p className="mt-1 text-xs text-slate-600">AI calendar optimized around client meetings.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-600">
            {[
              'Mon · Research synthesis & workshop prep',
              'Tue · Atlas Robotics vision sprint (onsite)',
              'Wed · Community mastermind & marketing updates',
              'Thu · Two discovery calls + delivery QA',
              'Fri · Finance review & next week planning',
            ].map((entry) => (
              <div key={entry} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                <span>{entry}</span>
                <HeartIcon className="h-5 w-5 text-rose-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Availability broadcast</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Waitlist</p>
              <p className="text-xs text-slate-500">3 strategic slots open for May starts.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Update availability
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Signal boosters</p>
              <p className="text-xs text-slate-500">Share open calendar windows with top referrers.</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              >
                Notify alliances
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
