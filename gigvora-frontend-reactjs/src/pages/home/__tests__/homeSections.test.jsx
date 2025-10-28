import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeHeroSection } from '../HomeHeroSection.jsx';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('HomeHeroSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback content and actions', () => {
    const primarySpy = vi.fn();
    const secondarySpy = vi.fn();

    renderWithRouter(<HomeHeroSection onPrimaryAction={primarySpy} onSecondaryAction={secondarySpy} />);

    expect(
      screen.getByRole('heading', {
        name: /a fresh place to grow your work/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /join gigvora/i }));
    fireEvent.click(screen.getByRole('button', { name: /browse opportunities/i }));

    expect(primarySpy).toHaveBeenCalledTimes(1);
    expect(secondarySpy).toHaveBeenCalledTimes(1);
  });

  it('uses provided data when available', () => {
    renderWithRouter(
      <HomeHeroSection
        headline="Build together"
        subheading="A calmer place to launch ideas."
        media={{ imageUrl: 'https://example.com/hero.jpg', alt: 'Custom hero' }}
      />,
    );

    expect(screen.getByRole('heading', { name: /build together/i })).toBeInTheDocument();
    expect(screen.getByText('A calmer place to launch ideas.')).toBeInTheDocument();
    expect(screen.getByAltText('Custom hero')).toBeInTheDocument();
  });
});
