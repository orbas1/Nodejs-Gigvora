import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useSession from '../../../../hooks/useSession.js';
import { resolveActorId } from '../../../../utils/session.js';
import SectionShell from '../SectionShell.jsx';
import WalletManagementSection from '../../../../components/wallet/WalletManagementSection.jsx';

export default function FreelancerWalletSection({ userId: userIdProp }) {
  const { session } = useSession();
  const sessionUserId = useMemo(() => resolveActorId(session), [session]);
  const userId = userIdProp ?? sessionUserId;

  if (!userId) {
    return (
      <SectionShell
        id="wallet"
        title="Wallet"
        description="Authenticate to manage wallet balances, funding sources, and treasury automation."
      >
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
          Wallet insights are available once you connect a freelancer account with treasury permissions.
        </div>
      </SectionShell>
    );
  }

  return (
    <section id="wallet" className="scroll-mt-32 space-y-6">
      <WalletManagementSection userId={userId} />
    </section>
  );
}

FreelancerWalletSection.propTypes = {
  userId: PropTypes.number,
};

FreelancerWalletSection.defaultProps = {
  userId: null,
};
