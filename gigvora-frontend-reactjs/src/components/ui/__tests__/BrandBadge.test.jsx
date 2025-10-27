import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BrandBadge from '../BrandBadge.jsx';
import { ComponentTokenProvider } from '../../../context/ComponentTokenContext.jsx';

const customTokens = {
  brandBadge: {
    base: 'badge-base',
    icon: 'badge-icon',
    text: 'badge-text',
    tones: {
      accent: { shell: 'accent-shell', icon: 'accent-icon' },
    },
    analytics: { datasetTone: 'data-tone' },
  },
};

describe('BrandBadge', () => {
  it('renders children, icon, and tone classes', () => {
    render(
      <ComponentTokenProvider tokens={customTokens}>
        <BrandBadge data-testid="badge" icon="GV">
          Launchpad
        </BrandBadge>
      </ComponentTokenProvider>,
    );

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('badge-base', 'accent-shell');
    expect(badge).toHaveAttribute('data-tone', 'accent');
    const icon = badge.querySelector('span.badge-icon');
    expect(icon).toBeTruthy();
    expect(icon).toHaveClass('accent-icon');
    expect(icon).toHaveTextContent('GV');
    expect(badge.querySelector('span.badge-text')).toHaveTextContent('Launchpad');
  });
});
