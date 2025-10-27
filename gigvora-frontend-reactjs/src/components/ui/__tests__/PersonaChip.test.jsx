import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PersonaChip from '../PersonaChip.jsx';
import { ComponentTokenProvider } from '../../../context/ComponentTokenContext.jsx';

const tokens = {
  personaChip: {
    base: 'chip-base',
    label: 'chip-label',
    indicator: 'chip-indicator',
    icon: 'chip-icon',
    sizes: { md: 'chip-size-md' },
    tones: {
      accent: { shell: 'chip-shell', indicator: 'chip-indicator-accent' },
    },
    states: { interactive: 'chip-interactive', selected: 'chip-selected' },
    analytics: { datasetTone: 'data-tone', datasetSize: 'data-size' },
  },
};

describe('PersonaChip', () => {
  it('applies token classes and dataset attributes', () => {
    render(
      <ComponentTokenProvider tokens={tokens}>
        <PersonaChip data-testid="chip" label="Founders" icon={<span>F</span>} interactive selected />
      </ComponentTokenProvider>,
    );

    const chip = screen.getByTestId('chip');
    expect(chip).toHaveClass('chip-base', 'chip-shell', 'chip-size-md', 'chip-interactive', 'chip-selected');
    expect(chip).toHaveAttribute('data-tone', 'accent');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(chip.querySelector('.chip-indicator')).toHaveClass('chip-indicator-accent');
    expect(chip.querySelector('.chip-label')).toHaveTextContent('Founders');
    expect(chip.querySelector('.chip-icon')).toHaveTextContent('F');
  });

  it('renders custom children with labelClassName', () => {
    render(
      <ComponentTokenProvider tokens={tokens}>
        <PersonaChip data-testid="chip" label="Agencies" labelClassName="custom-label" />
      </ComponentTokenProvider>,
    );

    const chip = screen.getByTestId('chip');
    expect(chip.querySelector('.chip-label')).toHaveClass('custom-label');
  });
});
