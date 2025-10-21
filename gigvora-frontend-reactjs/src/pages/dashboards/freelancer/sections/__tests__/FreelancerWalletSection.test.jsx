import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FreelancerWalletSection from '../FreelancerWalletSection.jsx';

const sessionStub = vi.hoisted(() => ({ session: { id: 42 } }));
const walletSpy = vi.hoisted(() => vi.fn());

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionStub,
}));

vi.mock('../../../../../components/wallet/WalletManagementSection.jsx', () => ({
  __esModule: true,
  default: (props) => {
    walletSpy(props);
    return <div data-testid="wallet-management" />;
  },
}));

describe('FreelancerWalletSection', () => {
  it('prompts authentication when no actor is resolved', () => {
    sessionStub.session = null;

    render(<FreelancerWalletSection />);

    expect(screen.getByText(/Wallet insights are available/i)).toBeInTheDocument();
    expect(walletSpy).not.toHaveBeenCalled();
  });

  it('renders the wallet management surface with the actor id', () => {
    sessionStub.session = { id: 314, memberships: ['freelancer'] };

    render(<FreelancerWalletSection />);

    expect(walletSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: 314 }));
    expect(screen.getByTestId('wallet-management')).toBeInTheDocument();
  });
});
