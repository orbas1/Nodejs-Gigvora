import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SlideOver from '../SlideOver.jsx';

describe('SlideOver', () => {
  it('renders content and calls onClose when dismissible', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <SlideOver open title="Mission Control" subtitle="Adjust your workspace" onClose={handleClose}>
        <p>Panel body</p>
      </SlideOver>,
    );

    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.getByText('Panel body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close panel/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('supports a non-dismissible configuration without rendering a close control', async () => {
    const handleClose = vi.fn();

    render(
      <SlideOver open title="Locked" dismissible={false} onClose={handleClose}>
        <p>Restricted content</p>
      </SlideOver>,
    );

    expect(screen.getByText('Restricted content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('falls back to a default title when an empty string is provided', () => {
    render(
      <SlideOver open title="">
        <div>Content</div>
      </SlideOver>,
    );

    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });
});
