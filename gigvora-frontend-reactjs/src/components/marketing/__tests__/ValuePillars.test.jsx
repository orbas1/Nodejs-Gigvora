import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ValuePillars from '../ValuePillars.jsx';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

afterEach(() => {
  analyticsMock.track.mockClear();
});

describe('ValuePillars', () => {
  it('renders provided pillars with descriptions and metrics', () => {
    render(
      <ValuePillars
        eyebrow="Why operators switch"
        headline="Value that compounds"
        description="Every pillar is verified"
        pillars={[
          {
            id: 'roi',
            eyebrow: 'Momentum',
            title: 'Accelerate operations',
            description: 'Streamline delivery with automation.',
            metric: { value: '4x', label: 'faster launch cycles' },
            cta: { label: 'Learn more', action: 'learn_more' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Value that compounds')).toBeInTheDocument();
    expect(screen.getByText('Accelerate operations')).toBeInTheDocument();
    expect(screen.getByText('4x')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
  });

  it('tracks analytics and forwards selection when CTA clicked', async () => {
    const onSelect = vi.fn();
    render(
      <ValuePillars
        pillars={[
          {
            id: 'trust',
            title: 'Operate with trust',
            cta: { label: 'Review trust architecture', action: 'view_trust' },
          },
        ]}
        analyticsMetadata={{ source: 'hero_test' }}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /review trust architecture/i }));

    expect(analyticsMock.track).toHaveBeenCalledWith(
      'marketing_value_pillar_interacted',
      expect.objectContaining({ pillarId: 'trust', action: 'view_trust' }),
      expect.objectContaining({ source: 'hero_test' }),
    );
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'trust' }));
  });
});
