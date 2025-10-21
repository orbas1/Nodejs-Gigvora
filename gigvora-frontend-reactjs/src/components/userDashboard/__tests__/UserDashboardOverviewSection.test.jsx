import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDashboardOverviewSection from '../UserDashboardOverviewSection.jsx';

vi.mock('../../../services/userDashboardOverview.js', () => ({
  __esModule: true,
  updateUserDashboardOverview: vi.fn(),
  refreshUserDashboardOverviewWeather: vi.fn(),
}));

const { updateUserDashboardOverview, refreshUserDashboardOverviewWeather } = await import(
  '../../../services/userDashboardOverview.js'
);

const baseOverview = {
  greetingName: 'Avery',
  headline: 'Build unstoppable experiences',
  overview:
    'Operate your gigs, relationships, and reputation from one unified workspace with instant insights.',
  avatarUrl: 'https://example.com/avatar.png',
  bannerImageUrl: 'https://example.com/banner.png',
  permissions: { canEdit: true },
  followers: { count: 1200, goal: 2000 },
  trust: { score: 87, label: 'Top 5%' },
  rating: { score: 4.9, count: 56 },
  date: { formatted: 'Monday, 4 March', time: '09:30' },
  weather: {
    location: 'London, UK',
    temperature: { value: 19.4, unit: '°C' },
    apparentTemperature: { value: 18.5, unit: '°C' },
    condition: 'Sunny',
    windSpeed: { value: 14, unit: 'km/h' },
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    units: 'metric',
  },
};

describe('UserDashboardOverviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateUserDashboardOverview.mockResolvedValue({});
    refreshUserDashboardOverviewWeather.mockResolvedValue({});
  });

  it('renders hero, stats, weather, and visuals cards', () => {
    render(
      <UserDashboardOverviewSection userId={10} overview={baseOverview} onOverviewUpdated={vi.fn()} />,
    );

    expect(screen.getByText(/hi avery/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1,200/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/trust/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/weather/i)).toBeInTheDocument();
    expect(screen.getByText(/visuals/i)).toBeInTheDocument();
  });

  it('persists hero edits via the drawer', async () => {
    const user = userEvent.setup();
    const handleUpdated = vi.fn();

    render(
      <UserDashboardOverviewSection userId={10} overview={baseOverview} onOverviewUpdated={handleUpdated} />,
    );

    await user.click(screen.getByRole('button', { name: /^hero$/i }));

    const nameField = await screen.findByLabelText(/^name$/i);
    await user.clear(nameField);
    await user.type(nameField, 'Jordan');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(updateUserDashboardOverview).toHaveBeenCalledTimes(1);
    });

    const [userId, payload] = updateUserDashboardOverview.mock.calls[0];
    expect(userId).toBe(10);
    expect(payload).toMatchObject({
      greetingName: 'Jordan',
      headline: baseOverview.headline,
      overview: baseOverview.overview,
      followersCount: baseOverview.followers.count,
      trustScore: baseOverview.trust.score,
      rating: baseOverview.rating.score,
    });
    expect(handleUpdated).toHaveBeenCalled();
  });

  it('refreshes weather data when requested', async () => {
    const user = userEvent.setup();

    render(
      <UserDashboardOverviewSection userId={99} overview={baseOverview} onOverviewUpdated={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(refreshUserDashboardOverviewWeather).toHaveBeenCalledWith(99);
    });

    expect(await screen.findByText(/weather sync/i)).toBeInTheDocument();
  });

  it('opens the preview modal for quick review', async () => {
    const user = userEvent.setup();

    render(
      <UserDashboardOverviewSection userId={10} overview={baseOverview} onOverviewUpdated={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /preview/i }));

    const closeButton = await screen.findByRole('button', { name: /close preview/i });
    expect(closeButton).toBeInTheDocument();

    await user.click(closeButton);
  });

  it('hides editing controls when the user cannot edit', () => {
    render(
      <UserDashboardOverviewSection
        userId={10}
        overview={{ ...baseOverview, permissions: { canEdit: false } }}
        onOverviewUpdated={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^hero$/i })).not.toBeInTheDocument();
  });

  it('walks through the wizard to submit a consolidated update', async () => {
    const user = userEvent.setup();
    const handleUpdated = vi.fn();

    render(
      <UserDashboardOverviewSection userId={10} overview={baseOverview} onOverviewUpdated={handleUpdated} />,
    );

    await user.click(screen.getByRole('button', { name: /wizard/i }));

    const nameField = await screen.findByLabelText(/^name$/i);
    await user.clear(nameField);
    await user.type(nameField, 'Morgan');
    await user.click(screen.getByRole('button', { name: /next/i }));

    const followersField = await screen.findByLabelText(/^followers$/i);
    await user.clear(followersField);
    await user.type(followersField, '1500');
    await user.click(screen.getByRole('button', { name: /next/i }));

    const avatarField = await screen.findByLabelText(/avatar link/i);
    await user.clear(avatarField);
    await user.type(avatarField, 'https://example.com/avatar-updated.png');
    await user.click(screen.getByRole('button', { name: /next/i }));

    const cityField = await screen.findByLabelText(/city/i);
    await user.clear(cityField);
    await user.type(cityField, 'Berlin');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateUserDashboardOverview).toHaveBeenCalledTimes(1);
    });

    const [, payload] = updateUserDashboardOverview.mock.calls[0];
    expect(payload).toMatchObject({
      greetingName: 'Morgan',
      followersCount: 1500,
      avatarUrl: 'https://example.com/avatar-updated.png',
      weatherLocation: 'Berlin',
    });

    expect(handleUpdated).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/step 4 of 4/i)).not.toBeInTheDocument();
    });
  });
});
