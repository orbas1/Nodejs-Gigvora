import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import WalletDrawer from '../WalletDrawer.jsx';

describe('WalletDrawer', () => {
  it('does not render when closed', () => {
    const { queryByRole } = render(
      <WalletDrawer title="Wallet" open={false} onClose={vi.fn()}>
        <p>Content</p>
      </WalletDrawer>,
    );

    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('locks scroll, focuses the panel and responds to escape and backdrop interactions', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { rerender, getByTestId } = render(
      <WalletDrawer title="Wallet" subtitle="Manage" open onClose={onClose}>
        <p>Drawer body</p>
      </WalletDrawer>,
    );

    const dialog = screen.getByRole('dialog', { name: /wallet/i });
    expect(dialog).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(getByTestId('wallet-drawer-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <WalletDrawer title="Wallet" open={false} onClose={onClose}>
        <p>Drawer body</p>
      </WalletDrawer>,
    );

    expect(document.body.style.overflow).toBe('');
  });
});
