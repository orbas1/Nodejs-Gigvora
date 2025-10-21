import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OverviewSnapshot from '../OverviewSnapshot.jsx';
import OverviewStats from '../OverviewStats.jsx';
import OverviewStatModal from '../OverviewStatModal.jsx';
import OverviewSettingsDrawer from '../OverviewSettingsDrawer.jsx';
import {
  buildFormState,
  buildPayload,
  deriveGreeting,
  deriveLocationLabel,
  deriveTimezone,
  formatFollowers,
  formatRating,
  formatTrustScore,
  getWeatherIcon,
} from '../overviewUtils.js';

describe('OverviewSnapshot', () => {
  it('renders weather summary and actions', () => {
    const handleEdit = vi.fn();
    const handleWeather = vi.fn();
    render(
      <OverviewSnapshot
        name="Gigvora"
        greeting="Good morning"
        summary="Global workspace"
        weather={{ temperature: 21, description: 'Sunny', icon: 'sun', windSpeed: 12, humidity: 50, temperatureUnit: '°C' }}
        locationLabel="London"
        timezone="Europe/London"
        dateLabel="Monday 12 May"
        onEdit={handleEdit}
        onWeatherClick={handleWeather}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    expect(handleEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Weather/i }));
    expect(handleWeather).toHaveBeenCalled();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Sunny')).toBeInTheDocument();
  });
});

describe('OverviewStats', () => {
  it('renders cards and triggers onSelect', () => {
    const handleSelect = vi.fn();
    render(<OverviewStats cards={[{ key: 'followers', label: 'Followers', value: '10K' }]} onSelect={handleSelect} />);
    fireEvent.click(screen.getByText('Followers'));
    expect(handleSelect).toHaveBeenCalledWith({ key: 'followers', label: 'Followers', value: '10K' });
  });
});

describe('OverviewStatModal', () => {
  it('shows stat details and calls onEdit', () => {
    const handleClose = vi.fn();
    const handleEdit = vi.fn();
    render(
      <OverviewStatModal
        open
        stat={{ label: 'Followers', value: '10K', details: ['Top region: UK'] }}
        onClose={handleClose}
        onEdit={handleEdit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(handleClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Adjust in settings/i }));
    expect(handleEdit).toHaveBeenCalledWith({ label: 'Followers', value: '10K', details: ['Top region: UK'] });
  });
});

describe('OverviewSettingsDrawer', () => {
  it('updates fields and submits payload', () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn((event) => event.preventDefault());

    render(
      <OverviewSettingsDrawer
        open
        saving={false}
        formState={{
          displayName: 'Gigvora',
          greeting: 'Hi team',
          note: 'Building the future',
          avatarUrl: '',
          followerCount: '1000',
          trustScore: '80',
          rating: '4.5',
          locationLabel: 'London',
          timezone: 'Europe/London',
          latitude: '51.5072',
          longitude: '-0.1276',
        }}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Gigvora HQ' } });
    expect(handleChange).toHaveBeenCalledWith('displayName', 'Gigvora HQ');

    fireEvent.submit(screen.getByRole('button', { name: /Save changes/i }));
    expect(handleSubmit).toHaveBeenCalled();
  });
});

describe('overviewUtils helpers', () => {
  it('derives friendly text and payloads', () => {
    expect(getWeatherIcon('sun')).toBe('☀️');
    expect(getWeatherIcon('unknown')).toBe('ℹ️');
    expect(formatFollowers(1200)).toBe('1.2K');
    expect(formatTrustScore(105)).toBe('100');
    expect(formatRating(4.2)).toBe('4.2★');

    const overview = {
      displayName: 'Gigvora',
      summary: 'Global',
      followerCount: 1500,
      trustScore: 70,
      rating: 4.7,
      location: { displayName: 'London', timezone: 'Europe/London' },
      date: { timezone: 'Europe/London' },
      preferences: { customGreeting: 'Hello world', locationOverride: { label: 'Remote', timezone: 'UTC' } },
      updatedAt: '2024-05-01T10:00:00.000Z',
      lastEditedBy: { firstName: 'Taylor', lastName: 'Smith' },
      workspaceId: 'ws-1',
    };
    const profile = { companyName: 'Gigvora Ltd', locationDetails: { displayName: 'Manchester' } };
    const workspace = { id: 'ws-1', owner: { firstName: 'Avery', lastName: 'Jones' } };

    expect(deriveGreeting(overview, profile, workspace)).toBe('Hello world');
    expect(deriveLocationLabel(overview, profile)).toBe('London');
    expect(deriveTimezone(overview)).toBe('UTC');

    const formState = buildFormState(overview);
    expect(formState.displayName).toBe('Gigvora');

    const payload = buildPayload(
      { ...formState, followerCount: '2000', trustScore: '90', rating: '4.9' },
      overview,
      workspace,
    );
    expect(payload).toMatchObject({ workspaceId: 'ws-1', followerCount: 2000, trustScore: 90, rating: 4.9 });
  });
});
