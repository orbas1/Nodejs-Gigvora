import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import ReviewsBoard from '../ReviewsBoard.jsx';
import SpendBoard from '../SpendBoard.jsx';
import { formatCurrency, formatDate, formatRating } from '../../utils.js';

describe('Volunteering management panels', () => {
  describe('ReviewsBoard', () => {
    it('summarises reviews and surfaces actions', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onCreate = vi.fn();

      const reviews = [
        {
          id: 'rev-1',
          rating: 4.5,
          headline: 'Outstanding collaboration',
          publishedAt: '2024-03-18T00:00:00.000Z',
          applicationId: 'app-1',
          application: { role: { title: 'Community Mentor' } },
        },
        {
          id: 'rev-2',
          rating: '3',
          headline: 'Room to grow',
          publishedAt: '2024-03-19T00:00:00.000Z',
          applicationId: 'app-2',
        },
      ];

      render(
        <ReviewsBoard reviews={reviews} onEdit={onEdit} onDelete={onDelete} onCreate={onCreate} />,
      );

      expect(screen.getByText('2 reviews')).toBeInTheDocument();
      const expectedAverage = formatRating((Number(reviews[0].rating) + Number(reviews[1].rating)) / reviews.length);
      const averagePattern = new RegExp(`${expectedAverage.replace('.', '\\.')}` + '\\s*/\\s*5 average', 'i');
      expect(screen.getByTestId('reviews-average')).toHaveTextContent(averagePattern);

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(
        within(firstDataRow).getByText(formatDate('2024-03-18T00:00:00.000Z')),
      ).toBeInTheDocument();

      await userEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
      await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[1]);
      await userEvent.click(screen.getByRole('button', { name: /new/i }));

      expect(onEdit).toHaveBeenCalledWith(reviews[0]);
      expect(onDelete).toHaveBeenCalledWith(reviews[1]);
      expect(onCreate).toHaveBeenCalled();
    });

    it('shows a resilient empty state when no reviews exist', () => {
      render(<ReviewsBoard reviews={[]} />);
      expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
    });
  });

  describe('SpendBoard', () => {
    it('renders totals and human readable categories', async () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onCreate = vi.fn();

      const entries = [
        {
          id: 'spent-1',
          category: 'software_subscriptions',
          amount: 1200,
          currencyCode: 'USD',
          incurredAt: '2024-03-01T00:00:00.000Z',
          applicationId: 'app-1',
          application: { role: { title: 'Event Host' } },
        },
        {
          id: 'spent-2',
          category: null,
          amount: 320,
          currencyCode: 'EUR',
          incurredAt: '2024-03-05T00:00:00.000Z',
          applicationId: 'app-2',
        },
      ];

      const totals = { USD: 1200, EUR: 320 };

      render(
        <SpendBoard entries={entries} totals={totals} onEdit={onEdit} onDelete={onDelete} onCreate={onCreate} />,
      );

      Object.entries(totals).forEach(([currency, amount]) => {
        expect(screen.getByText(`${currency}: ${formatCurrency(amount, currency)}`)).toBeInTheDocument();
      });

      expect(screen.getByText('Software Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Uncategorised')).toBeInTheDocument();

      await userEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
      await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[1]);
      await userEvent.click(screen.getByRole('button', { name: /add/i }));

      expect(onEdit).toHaveBeenCalledWith(entries[0]);
      expect(onDelete).toHaveBeenCalledWith(entries[1]);
      expect(onCreate).toHaveBeenCalled();
    });
  });
});
