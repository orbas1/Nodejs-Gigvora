import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FavouritesPanel from '../FavouritesPanel.jsx';

describe('FavouritesPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const favourites = [
    {
      id: 'fav-1',
      title: 'Growth PM',
      companyName: 'Gigvora',
      priority: 'actively_interviewing',
      salaryMin: 90000,
      salaryMax: 120000,
      currencyCode: 'USD',
      location: 'Remote',
      tags: ['product', 'growth'],
      notes: 'Align with upcoming launches',
      savedAt: '2024-04-28T12:00:00Z',
    },
  ];

  it('renders saved favourites with formatted fields', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <FavouritesPanel favourites={favourites} onCreate={onCreate} onEdit={onEdit} onDelete={onDelete} />,
    );

    expect(screen.getByText('Growth PM')).toBeInTheDocument();
    expect(screen.getByText('Gigvora')).toBeInTheDocument();
    expect(screen.getByText(/Saved 3 days ago/)).toBeInTheDocument();
    expect(screen.getByText('$90,000 – $120,000')).toBeInTheDocument();
  });

  it('triggers create, edit, and delete callbacks', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <FavouritesPanel favourites={favourites} onCreate={onCreate} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save role/i }));
    expect(onCreate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(favourites[0]);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(favourites[0]);
  });
});
