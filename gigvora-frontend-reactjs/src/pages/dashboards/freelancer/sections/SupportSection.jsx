import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useSession from '../../../../hooks/useSession.js';
import { resolveActorId } from '../../../../utils/session.js';
import SectionShell from '../SectionShell.jsx';
import SupportDeskPanel from '../../../../components/support/SupportDeskPanel.jsx';

function resolveFreelancerId(session) {
  if (!session) {
    return null;
  }
  const candidates = [session.freelancerId, session.profileId, session.primaryProfileId];
  for (const candidate of candidates) {
    const numeric = Number.parseInt(candidate, 10);
    if (Number.isInteger(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return null;
}

export default function SupportSection({ userId: userIdProp, freelancerId: freelancerIdProp }) {
  const { session } = useSession();
  const sessionUserId = useMemo(() => resolveActorId(session), [session]);
  const sessionFreelancerId = useMemo(() => resolveFreelancerId(session), [session]);
  const userId = userIdProp ?? sessionUserId;
  const freelancerId = freelancerIdProp ?? sessionFreelancerId;

  if (!userId) {
    return (
      <SectionShell
        id="support"
        title="Support desk"
        description="Sign in to view escalations, transcripts, and dispute playbooks."
      >
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
          Connect a freelancer workspace to unlock the Gigvora support console with live transcripts and resolution metrics.
        </div>
      </SectionShell>
    );
  }

  return (
    <section id="support" className="scroll-mt-32 space-y-6">
      <SupportDeskPanel userId={userId} freelancerId={freelancerId} />
    </section>
  );
}

SupportSection.propTypes = {
  userId: PropTypes.number,
  freelancerId: PropTypes.number,
};

SupportSection.defaultProps = {
  userId: null,
  freelancerId: null,
};
