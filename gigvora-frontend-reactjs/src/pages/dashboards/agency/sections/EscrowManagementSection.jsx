import PropTypes from 'prop-types';
import { EscrowProvider } from '../escrow/EscrowContext.jsx';
import EscrowShell from '../escrow/EscrowShell.jsx';

export default function EscrowManagementSection({
  anchorId = 'agency-escrow',
  title = 'Escrow management',
  badge = 'Secure',
  workspaceId,
  workspaceSlug,
}) {
  return (
    <section id={anchorId} className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Escrow</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {badge}
        </span>
      </header>

      <EscrowProvider workspaceId={workspaceId} workspaceSlug={workspaceSlug}>
        <EscrowShell />
      </EscrowProvider>
    </section>
  );
}

EscrowManagementSection.propTypes = {
  anchorId: PropTypes.string,
  title: PropTypes.string,
  badge: PropTypes.string,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  workspaceSlug: PropTypes.string,
};

EscrowManagementSection.defaultProps = {
  anchorId: 'agency-escrow',
  title: 'Escrow management',
  badge: 'Secure',
  workspaceId: undefined,
  workspaceSlug: undefined,
};
