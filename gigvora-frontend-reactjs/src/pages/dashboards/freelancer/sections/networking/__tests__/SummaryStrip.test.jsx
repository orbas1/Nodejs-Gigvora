import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SummaryStrip from '../SummaryStrip.jsx';

describe('SummaryStrip', () => {
  it('returns null when no valid cards are provided', () => {
    const { container } = render(<SummaryStrip cards={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders cards with formatted values', () => {
    render(
      <SummaryStrip
        cards={[
          { label: 'Connections', value: 1200, hint: 'Across all cohorts' },
          { label: 'Last sync', value: new Date('2024-05-01T00:00:00Z') },
        ]}
      />,
    );

    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Across all cohorts')).toBeInTheDocument();
    expect(screen.getByText(/May/)).toBeInTheDocument();
  });

  it('ignores cards missing labels to avoid duplicate keys', () => {
    render(
      <SummaryStrip
        cards={[
          { label: 'Valid', value: 'Ready' },
          { label: '', value: 'Ignored' },
          null,
        ]}
      />,
    );

    expect(screen.getAllByText(/Valid|Ready/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
  });
});
