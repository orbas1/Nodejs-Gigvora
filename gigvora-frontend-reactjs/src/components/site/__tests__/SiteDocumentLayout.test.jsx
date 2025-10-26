import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const scrollToElementMock = vi.hoisted(() => vi.fn());
const announcePoliteMock = vi.hoisted(() => vi.fn());
const submitSitePageFeedbackMock = vi.hoisted(() => vi.fn());
let clipboardWriteMock;

vi.mock('../../../utils/accessibility.js', () => ({
  scrollToElement: scrollToElementMock,
  announcePolite: announcePoliteMock,
  default: {
    scrollToElement: scrollToElementMock,
    prefersReducedMotion: vi.fn(() => false),
    focusElement: vi.fn(),
    announcePolite: announcePoliteMock,
  },
}));

vi.mock('../../../services/publicSite.js', () => ({
  submitSitePageFeedback: submitSitePageFeedbackMock,
  default: { submitSitePageFeedback: submitSitePageFeedbackMock },
}));

import SiteDocumentLayout from '../SiteDocumentLayout.jsx';

describe('SiteDocumentLayout accessibility experience', () => {
  const intersectionObserverMock = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    scrollToElementMock.mockClear();
    announcePoliteMock.mockClear();
    intersectionObserverMock.mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
    window.IntersectionObserver = intersectionObserverMock;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    clipboardWriteMock = vi.fn().mockResolvedValue();
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: clipboardWriteMock },
      configurable: true,
    });
    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: clipboardWriteMock },
      configurable: true,
    });
    submitSitePageFeedbackMock.mockReset();
    submitSitePageFeedbackMock.mockResolvedValue({ id: 1, response: 'yes' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  const defaultProps = {
    hero: {
      title: 'Privacy Policy',
      eyebrow: 'Legal',
      description: 'Our latest policies for executives and mentors.',
    },
    metadata: {
      lastUpdated: '2024-05-01',
      documentCode: 'POL-001',
    },
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        summary: 'How we steward your data.',
        blocks: [
          { type: 'text', text: 'We steward data with enterprise-grade encryption.' },
        ],
      },
      {
        id: 'privacy',
        title: 'Privacy controls',
        summary: 'Granular controls for founders and mentors.',
        blocks: [
          { type: 'text', text: 'Privacy settings cover notices, consents, and data subject rights.' },
        ],
      },
    ],
  };

  it('announces filter results in a live region', async () => {
    const user = userEvent.setup();
    render(<SiteDocumentLayout {...defaultProps} />);

    expect(await screen.findByText('Showing all 2 sections.')).toBeInTheDocument();

    const search = screen.getByRole('searchbox', { name: /search document/i });
    await user.clear(search);
    await user.type(search, 'privacy');

    expect(await screen.findByText('1 section matching “privacy”.')).toBeInTheDocument();
    expect(announcePoliteMock).toHaveBeenCalledWith('Showing all 2 sections.');
    expect(announcePoliteMock).toHaveBeenCalledWith('1 section matching “privacy”.');
  });

  it('provides navigation buttons with aria metadata and triggers smooth scroll helper', async () => {
    const user = userEvent.setup();
    render(<SiteDocumentLayout {...defaultProps} />);

    const firstButton = screen.getByRole('button', { name: /overview/i });
    expect(firstButton).toHaveAttribute('aria-current', 'true');
    expect(firstButton).toHaveAttribute('aria-controls', 'overview');

    const secondButton = screen.getByRole('button', { name: /privacy controls/i });
    await user.click(secondButton);

    expect(scrollToElementMock).toHaveBeenCalled();
  });

  it('requires a rating before submitting feedback and surfaces accessible error text', async () => {
    const user = userEvent.setup();
    render(<SiteDocumentLayout {...defaultProps} />);

    const submit = screen.getByRole('button', { name: /submit feedback/i });
    await user.click(submit);

    expect(await screen.findByText(/Select a response before submitting your feedback./i)).toBeInTheDocument();
  });

  it('confirms submission with a success message when rating is selected', async () => {
    const user = userEvent.setup();
    render(<SiteDocumentLayout {...defaultProps} />);

    await user.click(screen.getByLabelText('Yes, it answered my question'));
    await user.type(screen.getByRole('textbox', { name: /share optional feedback/i }), 'Great insights');
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(
      await screen.findByText(
        /Thank you for your feedback. Our legal and support teams review submissions within two UK business days./i,
      ),
    ).toBeInTheDocument();
    expect(submitSitePageFeedbackMock).toHaveBeenCalledWith('POL-001', {
      rating: 'yes',
      message: 'Great insights',
    });
    expect(screen.getByRole('textbox', { name: /share optional feedback/i }).value).toBe('');
  });

  it('copies the share link and announces the outcome via status message', async () => {
    const user = userEvent.setup();
    render(<SiteDocumentLayout {...defaultProps} />);

    const shareButton = screen.getByRole('button', { name: /copy link/i });
    await user.click(shareButton);

    expect(await screen.findByText('Link copied to clipboard.')).toBeInTheDocument();
    expect(announcePoliteMock).toHaveBeenCalledWith('Link copied to clipboard.');
  });

  it('surfaces an error message if the feedback request fails', async () => {
    const user = userEvent.setup();
    submitSitePageFeedbackMock.mockRejectedValueOnce(new Error('Network issue'));
    render(<SiteDocumentLayout {...defaultProps} />);

    await user.click(screen.getByLabelText('Partially helpful'));
    await user.click(screen.getByRole('button', { name: /submit feedback/i }));

    expect(
      await screen.findByText(
        /We could not send your feedback right now. Please try again later or email legal@gigvora.com./i,
      ),
    ).toBeInTheDocument();
    expect(submitSitePageFeedbackMock).toHaveBeenCalledWith('POL-001', {
      rating: 'partially',
      message: '',
    });
  });
});
