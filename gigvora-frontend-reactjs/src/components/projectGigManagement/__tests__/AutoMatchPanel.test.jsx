import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AutoMatchPanel from '../AutoMatchPanel.jsx';

describe('AutoMatchPanel', () => {
  const sampleSettings = {
    enabled: false,
    matchingWindowDays: 14,
    budgetMin: 1500,
    budgetMax: 7500,
    seniority: 'Mid',
    targetRoles: ['Designer'],
    focusSkills: ['UX'],
    geoPreferences: ['US'],
  };

  const sampleMatches = [
    {
      id: 101,
      freelancerName: 'Taylor Morgan',
      freelancerEmail: 'taylor@example.com',
      matchScore: 88,
      status: 'suggested',
      channel: 'Email',
      matchedAt: '2024-05-01T10:00:00Z',
    },
  ];

  const sampleProjects = [
    { id: 501, title: 'Alpha Initiative' },
    { id: 502, title: 'Beta Sprint' },
  ];

  it('renders summary metrics and existing matches', () => {
    render(
      <AutoMatchPanel
        settings={sampleSettings}
        matches={sampleMatches}
        summary={{ total: 1, engaged: 0, averageScore: 88 }}
        projects={sampleProjects}
        canManage
      />,
    );

    expect(screen.getByText('Pool 1')).toBeInTheDocument();
    expect(screen.getByText('Avg 88.0')).toBeInTheDocument();
    expect(screen.getByText('Taylor Morgan')).toBeInTheDocument();

    const projectSelect = screen.getByLabelText('Project');
    const options = within(projectSelect).getAllByRole('option').map((option) => option.textContent);
    expect(options).toContain('Alpha Initiative');
    expect(options).toContain('Beta Sprint');
  });

  it('normalises settings and match payloads before submission', async () => {
    const onUpdateSettings = vi.fn().mockResolvedValue();
    const onCreateMatch = vi.fn().mockResolvedValue();

    const user = userEvent.setup();

    render(
      <AutoMatchPanel
        settings={sampleSettings}
        matches={sampleMatches}
        summary={{ total: 1, engaged: 0, averageScore: 88 }}
        projects={sampleProjects}
        onUpdateSettings={onUpdateSettings}
        onCreateMatch={onCreateMatch}
        canManage
      />,
    );

    await user.click(screen.getByLabelText('Enabled'));
    await user.clear(screen.getByLabelText('Window (days)'));
    await user.type(screen.getByLabelText('Window (days)'), '30');
    await user.clear(screen.getByLabelText('Budget min'));
    await user.type(screen.getByLabelText('Budget min'), '2000');
    await user.clear(screen.getByLabelText('Budget max'));
    await user.type(screen.getByLabelText('Budget max'), '8000');
    await user.clear(screen.getByLabelText('Seniority'));
    await user.type(screen.getByLabelText('Seniority'), 'Senior');
    await user.clear(screen.getByLabelText('Target roles'));
    await user.type(screen.getByLabelText('Target roles'), 'Strategist, Producer');
    await user.clear(screen.getByLabelText('Skills'));
    await user.type(screen.getByLabelText('Skills'), 'Brand, UX');
    await user.clear(screen.getByLabelText('Regions'));
    await user.type(screen.getByLabelText('Regions'), 'EU, Remote');

    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => {
      expect(onUpdateSettings).toHaveBeenCalledWith({
        enabled: true,
        matchingWindowDays: 30,
        budgetMin: 2000,
        budgetMax: 8000,
        seniority: 'Senior',
        targetRoles: ['Strategist', 'Producer'],
        focusSkills: ['Brand', 'UX'],
        geoPreferences: ['EU', 'Remote'],
      });
    });

    await user.selectOptions(screen.getByLabelText('Project'), '501');
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Jordan Blake');
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'jordan@example.com');
    await user.clear(screen.getByLabelText('Score'));
    await user.type(screen.getByLabelText('Score'), '95');
    await user.selectOptions(screen.getByLabelText('Status'), 'engaged');
    await user.clear(screen.getByLabelText('Channel'));
    await user.type(screen.getByLabelText('Channel'), 'Slack');
    await user.clear(screen.getByLabelText('Notes'));
    await user.type(screen.getByLabelText('Notes'), 'Available next week');

    await user.click(screen.getByRole('button', { name: 'Add to pool' }));

    await waitFor(() => {
      expect(onCreateMatch).toHaveBeenCalledWith({
        projectId: 501,
        freelancerName: 'Jordan Blake',
        freelancerEmail: 'jordan@example.com',
        matchScore: 95,
        status: 'engaged',
        channel: 'Slack',
        notes: 'Available next week',
      });
    });
  });
});
