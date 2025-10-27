import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InsightStatBlock from '../InsightStatBlock.jsx';
import { ComponentTokenProvider } from '../../../context/ComponentTokenContext.jsx';

const tokens = {
  statBlock: {
    base: 'stat-base',
    layout: 'stat-layout',
    label: 'stat-label',
    value: 'stat-value',
    helper: 'stat-helper',
    tones: {
      accent: {
        shell: 'stat-shell',
        label: 'stat-label-accent',
        value: 'stat-value-accent',
        helper: 'stat-helper-accent',
      },
    },
    analytics: { datasetTone: 'data-tone' },
  },
};

describe('InsightStatBlock', () => {
  it('renders label, value, helper with tone tokens', () => {
    render(
      <ComponentTokenProvider tokens={tokens}>
        <InsightStatBlock
          data-testid="stat"
          label="Network reach"
          value="7,800+ specialists"
          helper="Global pods aligned"
        />
      </ComponentTokenProvider>,
    );

    const stat = screen.getByTestId('stat');
    expect(stat).toHaveClass('stat-base', 'stat-layout', 'stat-shell');
    expect(stat).toHaveAttribute('data-tone', 'accent');
    expect(stat.querySelector('dt')).toHaveClass('stat-label', 'stat-label-accent');
    expect(stat.querySelector('dd')).toHaveClass('stat-value', 'stat-value-accent');
    expect(stat.querySelector('p')).toHaveClass('stat-helper', 'stat-helper-accent');
  });
});
