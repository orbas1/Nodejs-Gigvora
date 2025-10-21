import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PortfolioAssetDrawer from '../PortfolioAssetDrawer.jsx';

const SAMPLE_PORTFOLIO = {
  id: 'portfolio-1',
  assets: [
    {
      id: 'asset-1',
      label: 'Hero image',
      url: 'https://example.com/hero.jpg',
      assetType: 'image',
      sortOrder: 1,
      isPrimary: true,
    },
  ],
};

describe('PortfolioAssetDrawer', () => {
  it('saves existing assets with sanitised payloads', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn().mockResolvedValue();

    render(
      <PortfolioAssetDrawer
        open
        item={SAMPLE_PORTFOLIO}
        canEdit
        onClose={vi.fn()}
        onUpdate={handleUpdate}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const labelInput = screen.getByLabelText(/label/i);
    await user.clear(labelInput);
    await user.type(labelInput, ' Updated Hero ');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(handleUpdate).toHaveBeenCalledTimes(1));
    expect(handleUpdate).toHaveBeenCalledWith(
      SAMPLE_PORTFOLIO.id,
      'asset-1',
      expect.objectContaining({ label: 'Updated Hero', url: 'https://example.com/hero.jpg' }),
    );
  });

  it('prevents creating assets with invalid urls', async () => {
    const user = userEvent.setup();

    render(<PortfolioAssetDrawer open item={{ id: 'p-1', assets: [] }} canEdit onCreate={vi.fn()} />);

    await user.type(screen.getByLabelText(/label/i), 'New asset');
    await user.type(screen.getByLabelText(/^url$/i), 'invalid');

    await user.click(screen.getByRole('button', { name: /add asset/i }));

    expect(screen.getByText(/valid https link/i)).toBeInTheDocument();
  });

  it('confirms deletion before invoking the handler', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const handleDelete = vi.fn().mockResolvedValue();

    render(
      <PortfolioAssetDrawer
        open
        item={SAMPLE_PORTFOLIO}
        canEdit
        onDelete={handleDelete}
        onUpdate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith('portfolio-1', 'asset-1'));

    confirmSpy.mockRestore();
  });

  it('allows creating assets without a thumbnail url', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn().mockResolvedValue();

    render(
      <PortfolioAssetDrawer
        open
        item={{ id: 'portfolio-2', assets: [] }}
        canEdit
        onCreate={handleCreate}
      />,
    );

    await user.type(screen.getByLabelText(/^label$/i), 'Moodboard');
    await user.type(screen.getByLabelText(/^url$/i), 'https://example.com/moodboard.pdf');

    await user.click(screen.getByRole('button', { name: /add asset/i }));

    await waitFor(() => expect(handleCreate).toHaveBeenCalledTimes(1));
    expect(handleCreate).toHaveBeenCalledWith(
      'portfolio-2',
      expect.objectContaining({ thumbnailUrl: null, label: 'Moodboard' }),
    );
  });
});
