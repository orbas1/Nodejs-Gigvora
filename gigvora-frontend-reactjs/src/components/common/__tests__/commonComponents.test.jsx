import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverlayModal from '../OverlayModal.jsx';
import SideDrawer from '../SideDrawer.jsx';

describe('OverlayModal', () => {
  it('renders children when open and triggers close callback', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <OverlayModal open title="Modal heading" onClose={onClose}>
        <p>Modal content</p>
      </OverlayModal>,
    );

    expect(screen.getByText(/Modal heading/)).toBeInTheDocument();
    expect(screen.getByText(/Modal content/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns null when closed', () => {
    const { container } = render(
      <OverlayModal open={false} onClose={() => {}} title="Hidden modal">
        <p>Hidden content</p>
      </OverlayModal>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SideDrawer', () => {
  it('renders drawer content and allows closing', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <SideDrawer open title="Drawer heading" onClose={onClose}>
        <p>Drawer content</p>
      </SideDrawer>,
    );

    expect(screen.getByText(/Drawer heading/)).toBeInTheDocument();
    expect(screen.getByText(/Drawer content/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns null when not open', () => {
    const { container } = render(
      <SideDrawer open={false} onClose={() => {}} title="Hidden drawer">
        <p>Hidden drawer content</p>
      </SideDrawer>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
