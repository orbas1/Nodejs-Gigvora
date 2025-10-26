import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import EndorsementWall from '../EndorsementWall.jsx';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
  identify: vi.fn(),
  setGlobalContext: vi.fn(),
  clearGlobalContext: vi.fn(),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

describe('EndorsementWall', () => {
  beforeEach(() => {
    analyticsMock.track.mockReset();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(),
      },
    });
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    delete navigator.share;
  });

  it('filters endorsements by persona and highlights featured content', () => {
    render(
      <EndorsementWall
        testimonials={{
          featured: {
            id: '1',
            quote: 'Featured engagement unlocked our growth.',
            clientName: 'Taylor Rivera',
            rating: 5,
            tags: ['Strategy'],
            createdAt: '2024-03-01T00:00:00.000Z',
          },
          recent: [
            {
              id: '2',
              quote: 'Mentor review that inspired our leads.',
              clientName: 'Morgan Lee',
              persona: 'mentor',
              tags: ['Mentorship'],
              createdAt: '2024-04-02T00:00:00.000Z',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/Featured engagement/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'mentor' }));
    expect(screen.getByText(/Mentor review/)).toBeInTheDocument();
  });

  it('copies share link when share action triggered', async () => {
    render(
      <EndorsementWall
        testimonials={{ recent: [{ id: '1', quote: 'Great partner', clientName: 'Alex', persona: 'client' }] }}
        shareLinks={[{ url: 'https://example.com/wall', label: 'Wall link' }]}
      />,
    );

    fireEvent.click(screen.getByText('Share wall'));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/wall'));
    expect(await screen.findByText(/Link copied to clipboard/)).toBeInTheDocument();
    expect(analyticsMock.track).toHaveBeenCalledWith('endorsement_wall_shared', { url: 'https://example.com/wall' });
  });
});
