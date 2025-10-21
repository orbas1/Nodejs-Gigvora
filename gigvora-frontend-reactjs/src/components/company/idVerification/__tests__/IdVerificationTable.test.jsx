import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import IdVerificationTable from '../IdVerificationTable.jsx';

const sampleItems = [
  {
    id: '1',
    fullName: 'Pat Jordan',
    user: { email: 'pat@gigvora.test' },
    status: 'submitted',
    submittedAt: '2024-05-01T12:00:00.000Z',
    updatedAt: '2024-05-02T15:30:00.000Z',
    reviewer: { firstName: 'Taylor', lastName: 'Smith' },
  },
];

describe('IdVerificationTable', () => {
  it('renders loading state', () => {
    render(<IdVerificationTable loading items={[]} />);
    expect(screen.getByText(/Loading ID checks/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<IdVerificationTable error={new Error('Boom')} />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders rows and handles selection', () => {
    const handleSelect = vi.fn();
    render(<IdVerificationTable items={sampleItems} onSelect={handleSelect} />);

    expect(screen.getByText('Pat Jordan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    expect(handleSelect).toHaveBeenCalledWith(sampleItems[0]);
  });

  it('handles pagination interactions', () => {
    const handlePageChange = vi.fn();
    render(
      <IdVerificationTable
        items={sampleItems}
        pagination={{ page: 2, totalPages: 4 }}
        onPageChange={handlePageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });
});
