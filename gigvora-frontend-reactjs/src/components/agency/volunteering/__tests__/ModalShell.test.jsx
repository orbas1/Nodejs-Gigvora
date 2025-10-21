import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalShell from '../ModalShell.jsx';

describe('ModalShell', () => {
  it('does not render when closed', () => {
    const { container } = render(<ModalShell title="Test" onClose={vi.fn()} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dialog content and actions when open', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ModalShell
        title="Manage volunteering"
        subtitle="Coordinate your outreach"
        open
        onClose={handleClose}
        actions={<button type="button">Save</button>}
      >
        <div>Body content</div>
      </ModalShell>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Manage volunteering' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Coordinate your outreach')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
