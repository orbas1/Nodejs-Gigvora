import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import DashboardCollapsibleSection from '../../../../components/dashboard/shared/DashboardCollapsibleSection.jsx';
import DashboardAlertBanner from '../../../../components/dashboard/shared/DashboardAlertBanner.jsx';
import SupportDeskPanel from '../../../../components/support/SupportDeskPanel.jsx';

const CONTACT_OPTIONS = [
  { label: 'Open agency inbox', href: '/dashboard/agency/inbox' },
  { label: 'Escalate to trust & safety', href: 'mailto:trust@gigvora.com?subject=Agency%20support%20escalation' },
  { label: 'Ping finance ops', href: 'mailto:finance-ops@gigvora.com?subject=Vendor%20payment%20support' },
];

export default function AgencySupportSection({ userId, supportSnapshot, asModule }) {
  const content = (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-4xl border border-indigo-100 bg-white/90 p-6 shadow-sm">
        <SupportDeskPanel userId={userId} initialSnapshot={supportSnapshot} />
      </div>
      <aside className="space-y-4">
        <DashboardAlertBanner
          tone="highlight"
          badge="Playbooks"
          title="Keep agencies unblocked"
          message={
            <p className="text-sm leading-relaxed">
              Monitor CSAT, backlog velocity, and SLA breaches directly inside the control tower. Quick actions route operators
              to escalation runbooks without leaving the page.
            </p>
          }
          actions={
            <Link
              to="/dashboard/agency/support"
              className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Open full support desk
            </Link>
          }
        />
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 text-sm text-indigo-900 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">On-call escalation</p>
          <ul className="mt-3 space-y-3">
            {CONTACT_OPTIONS.map((option) => (
              <li key={option.label}>
                <Link
                  to={option.href}
                  className="inline-flex w-full items-center justify-between rounded-2xl border border-indigo-200 bg-white px-4 py-2 font-semibold text-indigo-700 transition hover:border-indigo-300 hover:text-indigo-900"
                >
                  <span>{option.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );

  if (asModule) {
    return content;
  }

  return (
    <DashboardCollapsibleSection
      id="agency-support"
      anchorId="agency-support"
      title="Support command desk"
      badge="Experience"
      description="Bring inbox triage, escalation playbooks, and knowledge capture into a single workspace module."
      tone="indigo"
    >
      {content}
    </DashboardCollapsibleSection>
  );
}

AgencySupportSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  supportSnapshot: PropTypes.oneOfType([PropTypes.object, PropTypes.shape({ data: PropTypes.object })]),
  asModule: PropTypes.bool,
};

AgencySupportSection.defaultProps = {
  userId: undefined,
  supportSnapshot: undefined,
  asModule: false,
};
