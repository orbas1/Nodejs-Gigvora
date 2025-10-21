import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../FilterBar.jsx';

describe('FilterBar', () => {
  it('invokes change handlers for each control', async () => {
    const user = userEvent.setup();
    let filters = { query: '', status: 'all', highlighted: undefined, minRating: null };
    let rerenderComponent = () => {};

    const renderComponent = () => (
      <FilterBar filters={filters} onChange={handleChange} onReset={handleReset} />
    );

    const handleChange = vi.fn((update) => {
      filters = { ...filters, ...update };
      rerenderComponent(renderComponent());
    });

    const handleReset = vi.fn(() => {
      filters = { query: '', status: 'all', highlighted: undefined, minRating: null };
      rerenderComponent(renderComponent());
    });

    const { rerender } = render(renderComponent());
    rerenderComponent = rerender;

    await user.type(screen.getByPlaceholderText(/search reviews/i), 'team');
    expect(handleChange).toHaveBeenLastCalledWith({ query: 'team', page: 1 });

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'pending');
    expect(handleChange).toHaveBeenLastCalledWith({ status: 'pending', page: 1 });

    await user.selectOptions(selects[1], 'true');
    expect(handleChange).toHaveBeenLastCalledWith({ highlighted: true, page: 1 });

    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '4');
    expect(handleChange).toHaveBeenLastCalledWith({ minRating: 4, page: 1 });

    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
