import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ViewSwitcher from '../ViewSwitcher.jsx';

describe('ViewSwitcher', () => {
  const options = [
    { id: 'grid', label: 'Grid' },
    { id: 'table', label: 'Table' },
  ];

  it('invokes the change handler with the selected option', () => {
    const handleChange = vi.fn();

    render(<ViewSwitcher options={options} activeId="grid" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Table' }));

    expect(handleChange).toHaveBeenCalledWith('table');
  });

  it('marks the active option as pressed', () => {
    render(<ViewSwitcher options={options} activeId="table" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables interaction when no change handler is provided', () => {
    render(<ViewSwitcher options={options} activeId="grid" />);

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
