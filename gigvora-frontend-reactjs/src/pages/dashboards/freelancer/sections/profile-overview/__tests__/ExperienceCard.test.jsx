import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ExperienceCard from '../ExperienceCard.jsx';

describe('ExperienceCard', () => {
  it('sorts experiences by start date and renders links', () => {
    render(
      <ExperienceCard
        experience={[
          { id: 1, title: 'Recent', company: 'A', startDate: '2024-01-01', mediaUrl: 'https://example.com' },
          { id: 2, title: 'Old', company: 'B', startDate: '2020-01-01' },
        ]}
      />,
    );

    const headings = screen.getAllByText(/recent|old/i);
    expect(headings[0]).toHaveTextContent('Recent');
    expect(screen.getByRole('link', { name: /preview media/i })).toHaveAttribute('href', 'https://example.com');
  });

  it('shows fallback when empty', () => {
    render(<ExperienceCard experience={[]} />);

    expect(screen.getByText(/tell clients/i)).toBeInTheDocument();
  });
});
