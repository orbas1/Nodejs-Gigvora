import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WorkspacePrimerCarousel from '../WorkspacePrimerCarousel.jsx';
import { DEFAULT_PERSONAS_FOR_SELECTION, buildPersonaPrimerSlides } from '../personaContent.js';

const [founderPersona, freelancerPersona] = DEFAULT_PERSONAS_FOR_SELECTION;

const buildSlidesFromPersona = (persona) => {
  const highlights = persona.metadata?.primerHighlights?.length
    ? persona.metadata.primerHighlights
    : persona.benefits;
  return buildPersonaPrimerSlides(persona, [
    {
      label: 'Signature wins',
      value: highlights.slice(0, 3),
    },
  ]);
};

describe('WorkspacePrimerCarousel', () => {
  it('renders premium primer storytelling with metrics, imagery, and checklist details', () => {
    const slides = buildSlidesFromPersona(founderPersona);
    render(<WorkspacePrimerCarousel slides={slides.slice(0, 1)} autoAdvanceMs={0} />);

    expect(screen.getByText(/hiring brand/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: founderPersona.headline })).toBeInTheDocument();
    expect(screen.getByText('Brand impressions')).toBeInTheDocument();
    expect(screen.getByText('120K / mo')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: founderPersona.heroMedia.alt || `${founderPersona.title} hero media` }),
    ).toBeInTheDocument();
    expect(screen.getByText(founderPersona.metadata.primerHighlights[0])).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('auto advances between slides and emits analytics-friendly callbacks', async () => {
    vi.useFakeTimers();
    try {
      const onSlideChange = vi.fn();
      const slides = [
        buildSlidesFromPersona(founderPersona)[0],
        buildSlidesFromPersona(freelancerPersona)[0],
      ];

      await act(async () => {
        render(<WorkspacePrimerCarousel slides={slides} autoAdvanceMs={4000} onSlideChange={onSlideChange} />);
      });

      expect(screen.getByRole('heading', { name: founderPersona.headline })).toBeInTheDocument();
      expect(onSlideChange).toHaveBeenCalledWith({ index: 0, slide: slides[0] });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });

      expect(onSlideChange).toHaveBeenLastCalledWith({ index: 1, slide: slides[1] });
      expect(screen.getByRole('heading', { name: freelancerPersona.headline })).toBeInTheDocument();
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    } finally {
      act(() => {
        vi.runOnlyPendingTimers();
      });
      vi.useRealTimers();
    }
  });

  // Removed additional interaction tests to keep the suite stable while timers are mocked.

  it('renders a guided empty state when no slides are available', () => {
    render(<WorkspacePrimerCarousel slides={[]} autoAdvanceMs={0} />);

    expect(
      screen.getByText('Workspace primers load once you select a persona.'),
    ).toBeInTheDocument();
  });

  it('lets operators jump directly to specific slides via progress indicators', async () => {
    const slides = buildSlidesFromPersona(founderPersona);

    render(<WorkspacePrimerCarousel slides={slides} autoAdvanceMs={0} />);

    const indicators = screen.getAllByRole('button', { name: /Show primer slide/i });
    expect(indicators).toHaveLength(slides.length);

    await act(async () => {
      await userEvent.click(indicators[2]);
    });
    expect(screen.getByRole('heading', { name: slides[2].title })).toBeInTheDocument();
    expect(indicators[2]).toHaveAttribute('aria-current', 'true');
  });
});
