import { CalendarDaysIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';

export default function SupportSection() {
  return (
    <SectionShell
      id="support"
      title="Support desk"
      description="Work with Gigvora success engineers when you need a co-pilot."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Open tickets</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {[
              {
                subject: 'Automation rule tuning',
                status: 'In progress',
                owner: 'Jordan · Success engineer',
                updated: 'Updated 2h ago',
              },
              {
                subject: 'Project blueprint review',
                status: 'Scheduled',
                owner: 'AI concierge',
                updated: 'Session Apr 17',
              },
            ].map((ticket) => (
              <div key={ticket.subject} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{ticket.owner}</p>
                <p className="mt-1 text-xs text-slate-500">{ticket.updated}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Need something fast?</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200"
            >
              Launch live chat
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              Book strategy session
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
