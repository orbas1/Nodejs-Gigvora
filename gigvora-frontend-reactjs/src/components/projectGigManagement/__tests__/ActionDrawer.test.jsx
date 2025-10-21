import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionDrawer from '../ActionDrawer.jsx';

describe('ActionDrawer', () => {
  it('renders its content when open and handles close', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ActionDrawer open onClose={onClose} title="Drawer title">
        <p>Drawer content</p>
      </ActionDrawer>,
    );

    expect(screen.getByText('Drawer content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drawer title' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
