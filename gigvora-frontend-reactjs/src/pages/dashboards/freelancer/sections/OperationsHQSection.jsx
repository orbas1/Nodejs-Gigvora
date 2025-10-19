import { HomeModernIcon } from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import { OPERATIONS_MEMBERSHIPS } from '../sampleData.js';

export default function OperationsHQSection() {
  return (
    <SectionShell
      id="operations-hq"
      title="Freelancer Operations HQ"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      actions={[
        <span
          key="memberships"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600"
        >
          Your memberships
        </span>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Freelancer Operations HQ</h3>
          <p className="mt-3 text-sm text-slate-600">
            An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace.
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">Your memberships:</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {OPERATIONS_MEMBERSHIPS.map((membership) => (
              <div key={membership} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
                <p className="text-sm font-semibold text-blue-700">{membership}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <HomeModernIcon className="h-6 w-6 text-blue-500" />
            <p className="text-sm font-semibold text-slate-900">Freelancer Operations HQ</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Keep memberships, strategic workstreams, and monetization programs aligned from a single cockpit built for freelancers who lead engagements end-to-end.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
