import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import MentorShowcaseManager from '../MentorShowcaseManager.jsx';
import useLocalCollection from '../../../hooks/useLocalCollection.js';
import randomId from '../../../utils/randomId.js';

vi.mock('../../../hooks/useLocalCollection.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../utils/randomId.js', () => ({
  default: vi.fn(),
}));

function buildMentor(overrides = {}) {
  return {
    id: 'mentor-1',
    name: 'Alex Rivers',
    headline: 'Growth mentor',
    category: 'Growth',
    title: 'Head of Growth at Example Co',
    price: 200,
    currency: 'USD',
    sessionDuration: 60,
    location: 'Remote',
    remote: true,
    description: 'Helps founders unlock product-led growth.',
    bio: 'Operator turned mentor with a focus on activation loops.',
    skills: ['Activation', 'Retention'],
    tags: ['growth'],
    rating: 4.9,
    reviewCount: 28,
    showcase: ['Built growth teams at Series B companies.'],
    offerings: [
      { id: 'offering-1', name: 'Growth audit', price: '$1,200', description: 'Deep dive on funnels.' },
    ],
    gallery: [
      { id: 'gallery-1', url: 'https://example.com/image.jpg', caption: 'Workshop moment' },
    ],
    testimonials: [
      { id: 'testimonial-1', author: 'Jordan • Founder', rating: 5, comment: 'Outstanding guidance.' },
    ],
    bookings: [
      {
        id: 'booking-1',
        menteeName: 'Jamie',
        email: 'jamie@example.com',
        focus: 'Growth roadmap',
        scheduledAt: '2024-06-11T10:00:00Z',
        status: 'confirmed',
        notes: 'Share deck before call',
      },
    ],
    ...overrides,
  };
}

function setupCollection(overrides = {}) {
  const createItem = vi.fn((payload) => ({ id: 'mentor-new', ...payload }));
  const updateItem = vi.fn();
  const removeItem = vi.fn();
  const resetCollection = vi.fn();
  const items = overrides.items ?? [buildMentor(), buildMentor({ id: 'mentor-2', name: 'Sky Patel', remote: false })];
  useLocalCollection.mockReturnValue({
    items,
    createItem,
    updateItem,
    removeItem,
    resetCollection,
    clearCollection: vi.fn(),
    hasSeedData: true,
  });
  return { createItem, updateItem, removeItem, resetCollection, items };
}

beforeEach(() => {
  randomId.mockImplementation((prefix = 'id') => `${prefix}-generated`);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('MentorShowcaseManager', () => {
  it('renders mentor metrics and listings', async () => {
    setupCollection();

    render(<MentorShowcaseManager />);

    expect(screen.getByText('Mentors live')).toBeInTheDocument();
    expect(screen.getByText('Remote friendly')).toBeInTheDocument();
    expect(screen.getByText('Average rating')).toBeInTheDocument();
    expect(screen.getByText('Upcoming sessions')).toBeInTheDocument();

    const metrics = screen.getAllByRole('definition');
    expect(metrics).toHaveLength(4);

    expect(screen.getByRole('button', { name: /new mentor/i })).toBeEnabled();
    expect(screen.getByRole('searchbox', { name: /search mentors/i })).toBeInTheDocument();

    // initial mentor selection renders detail pane
    expect(screen.getByText('Helps founders unlock product-led growth.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book session/i })).toBeEnabled();
  });

  it('filters mentors by search term', async () => {
    setupCollection();

    const user = userEvent.setup();
    render(<MentorShowcaseManager />);

    const search = screen.getByRole('searchbox', { name: /search mentors/i });
    await act(async () => {
      await user.clear(search);
      await user.type(search, 'nonexistent');
    });

    expect(
      screen.getByText('No mentors match those filters. Try broadening your search.'),
    ).toBeInTheDocument();
  });

  it('creates a mentor from the modal form', async () => {
    const { createItem } = setupCollection();

    const user = userEvent.setup();
    render(<MentorShowcaseManager />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /new mentor/i }));
    });
    const formHeading = await screen.findByRole('heading', { name: /add mentor to marketplace/i });
    const form = formHeading.closest('form');
    const formScope = within(form);

    await act(async () => {
      fireEvent.change(formScope.getByLabelText('Name'), { target: { value: ' Taylor Orion ' } });
      fireEvent.change(formScope.getByLabelText('Headline'), { target: { value: ' Venture mentor ' } });
      fireEvent.change(formScope.getByLabelText('Category'), { target: { value: ' Strategy ' } });
      fireEvent.change(formScope.getByLabelText('Title / credentials'), { target: { value: 'Founder coach' } });
      fireEvent.change(formScope.getByLabelText('Price per session'), { target: { value: '350' } });
      fireEvent.change(formScope.getByLabelText('Session duration (minutes)'), { target: { value: '' } });
      fireEvent.change(formScope.getByLabelText('Session duration (minutes)'), { target: { value: '75' } });
      fireEvent.change(formScope.getByLabelText('Location'), { target: { value: 'London' } });
      fireEvent.change(formScope.getByLabelText('Mentor description'), {
        target: { value: ' Helps teams shape funding narratives. ' },
      });
      fireEvent.change(formScope.getByLabelText('Bio'), {
        target: { value: ' Former CPO with storytelling chops. ' },
      });
      fireEvent.change(formScope.getByLabelText('Core skills (comma separated)'), {
        target: { value: 'Pitching, Fundraising ' },
      });
      fireEvent.change(formScope.getByLabelText('Tags (comma separated)'), {
        target: { value: 'mentor, strategy' },
      });
      fireEvent.change(formScope.getByLabelText('Video URL (YouTube, Vimeo, MP4)'), {
        target: { value: 'https://example.com/video.mp4' },
      });
      fireEvent.change(formScope.getByLabelText('Gallery (one per line: URL | Caption)'), {
        target: { value: 'https://example.com/image.png | Demo' },
      });
      fireEvent.change(formScope.getByLabelText('Showcase highlights (one per line)'), {
        target: { value: 'Highlight one' },
      });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add mentor/i }));
    });

    await waitFor(() => expect(createItem).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /add mentor to marketplace/i })).not.toBeInTheDocument(),
    );
    const payload = createItem.mock.calls[0][0];
    expect(payload.name).toBe('Taylor Orion');
    expect(payload.skills).toEqual(['Pitching', 'Fundraising']);
    expect(payload.showcase).toEqual(['Highlight one']);
    expect(payload.gallery).toEqual([
      { id: 'mentor-gallery-generated', url: 'https://example.com/image.png', caption: 'Demo' },
    ]);
  });

  it('schedules a booking for the selected mentor', async () => {
    const { updateItem } = setupCollection();
    const user = userEvent.setup();

    render(<MentorShowcaseManager />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /book session/i }));
    });
    const bookingHeading = await screen.findByRole('heading', { name: /schedule mentorship/i });
    const bookingForm = bookingHeading.closest('form');
    const bookingScope = within(bookingForm);

    await act(async () => {
      fireEvent.change(bookingScope.getByLabelText('Mentee name'), { target: { value: 'Jamie Doe' } });
      fireEvent.change(bookingScope.getByLabelText('Email'), { target: { value: 'jamie.doe@example.com' } });
      fireEvent.change(bookingScope.getByLabelText('Focus area'), { target: { value: 'Investor deck' } });
      fireEvent.change(bookingScope.getByLabelText('Schedule'), { target: { value: '2024-07-01T09:30' } });
      fireEvent.change(bookingScope.getByLabelText('Notes'), { target: { value: 'Needs deck review' } });
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^add booking$/i }));
    });

    await waitFor(() => expect(updateItem).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /schedule mentorship/i })).not.toBeInTheDocument(),
    );
    const [mentorId, updater] = updateItem.mock.calls[0];
    expect(mentorId).toBe('mentor-1');
    const updated = updater({ bookings: [] });
    expect(updated.bookings).toHaveLength(1);
    expect(updated.bookings[0]).toMatchObject({
      menteeName: 'Jamie Doe',
      email: 'jamie.doe@example.com',
      focus: 'Investor deck',
      status: 'pending',
    });
  });
});
