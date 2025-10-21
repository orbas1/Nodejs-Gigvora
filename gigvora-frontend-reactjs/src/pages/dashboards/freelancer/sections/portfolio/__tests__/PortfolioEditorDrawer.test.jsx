import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PortfolioEditorDrawer from '../PortfolioEditorDrawer.jsx';

describe('PortfolioEditorDrawer', () => {
  it('submits with trimmed data when valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();

    render(
      <PortfolioEditorDrawer open canEdit onSubmit={handleSubmit} onClose={handleClose} />,
    );

    await user.type(screen.getByLabelText(/title/i), '  Mission case  ');

    await user.click(screen.getByRole('button', { name: /publish/i }));

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Mission case');
    expect(payload.tags).toEqual([]);
    expect(handleClose).toHaveBeenCalled();
  });

  it('blocks submission when an invalid URL is provided', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<PortfolioEditorDrawer open canEdit onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Sample');
    await user.type(screen.getByLabelText(/call to action url/i), 'ftp://example.com');
    await user.click(screen.getByRole('button', { name: /publish/i }));
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/valid http/i)).toBeInTheDocument();
  });

  it('supports navigating between steps and clearing validation errors', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();

    render(<PortfolioEditorDrawer open canEdit onSubmit={handleSubmit} onClose={handleClose} />);

    await user.type(screen.getByLabelText(/title/i), 'Launch plan');

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByLabelText(/problem/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByLabelText(/repository url/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    expect(screen.getByLabelText(/call to action url/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/call to action url/i), 'ftp://invalid.example.com');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByText(/valid http/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(screen.queryByText(/valid http/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^publish$/i }));
    const ctaInput = screen.getByLabelText(/call to action url/i);
    await user.clear(ctaInput);
    await user.type(ctaInput, 'https://example.com/cta');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));
    expect(handleClose).toHaveBeenCalled();
  });
});
