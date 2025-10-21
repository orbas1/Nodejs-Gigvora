import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusBadge from '../StatusBadge.jsx';

describe('StatusBadge', () => {
  it('defaults to pending when status is not provided', () => {
    render(<StatusBadge />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('renders the correct label and icon tone for verified status', () => {
    render(<StatusBadge status="verified" />);
    const badge = screen.getByText(/verified/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/emerald/);
  });
});
