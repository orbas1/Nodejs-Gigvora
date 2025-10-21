import PropTypes from 'prop-types';
import WalletManagementSection from '../../wallet/WalletManagementSection.jsx';
import FinanceControlTowerFeature from '../FinanceControlTowerFeature.jsx';

export default function UserWalletSection({ userId, currency }) {
  return (
    <section
      id="client-wallet"
      className="space-y-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Wallet</p>
          <h2 className="text-3xl font-semibold text-slate-900">Treasury & controls</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Operate ledgers, funding sources, payouts, and treasury automation with compliance guardrails ready for production.
          </p>
        </div>
      </header>

      <div className="space-y-6 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-inner">
        <WalletManagementSection userId={userId} />
        <FinanceControlTowerFeature userId={userId} currency={currency} />
      </div>
    </section>
  );
}

UserWalletSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currency: PropTypes.string,
};

UserWalletSection.defaultProps = {
  currency: 'USD',
};
