import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PanelDialog from '../PanelDialog.jsx';

describe('PanelDialog', () => {
  it('renders content and triggers close callback', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <PanelDialog
        open
        onClose={handleClose}
        title="Preview"
        actions={<button type="button">Done</button>}
      >
        <p>Dialog content</p>
      </PanelDialog>,
    );

    expect(await screen.findByText('Dialog content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();

    await user.click(screen.getByLabelText(/close panel/i));
    expect(handleClose).toHaveBeenCalled();
  });
});
