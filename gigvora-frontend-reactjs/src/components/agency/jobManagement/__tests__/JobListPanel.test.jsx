import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import JobListPanel from '../JobListPanel.jsx';

describe('JobListPanel', () => {
  const sampleJobs = [
    {
      id: 1,
      title: 'Senior Product Designer',
      clientName: 'Acme Co',
      location: 'Remote',
      seniority: 'senior',
      status: 'open',
      favoriteMemberIds: ['member-1'],
      applicationSummary: { total: 2 },
      updatedAt: '2024-05-01T10:00:00.000Z',
    },
    {
      id: 2,
      title: 'Growth Marketer',
      clientName: 'Lumen',
      location: 'New York, NY',
      seniority: 'mid',
      status: 'paused',
      favoriteMemberIds: [],
      applicationSummary: { total: 1 },
      updatedAt: '2024-04-15T15:30:00.000Z',
    },
  ];

  const metadata = {
    jobStatuses: ['open', 'paused', 'closed'],
  };

  const defaultFilters = { search: '', status: undefined };

  let onFilterChange;
  let onSelectJob;
  let onFavoriteToggle;

  beforeEach(() => {
    onFilterChange = vi.fn();
    onSelectJob = vi.fn();
    onFavoriteToggle = vi.fn();
  });

  const setup = (override = {}) => {
    const { filters: initialFilters, onFilterChange: customFilterChange, ...rest } = override;

    function Harness(props) {
      const [filtersState, setFiltersState] = useState(initialFilters ?? defaultFilters);
      const handleFilterChange = (nextFilters) => {
        setFiltersState(nextFilters);
        (customFilterChange ?? onFilterChange)(nextFilters);
      };

      return (
        <JobListPanel
          jobs={sampleJobs}
          metadata={metadata}
          filters={filtersState}
          onFilterChange={handleFilterChange}
          onSelectJob={onSelectJob}
          onFavoriteToggle={onFavoriteToggle}
          workspaceId="ws-1"
          onCreateJob={vi.fn()}
          {...props}
        />
      );
    }

    return render(<Harness {...rest} />);
  };

  it('renders job entries with navigation links', () => {
    setup();

    expect(screen.getByText('Senior Product Designer')).toBeInTheDocument();
    expect(screen.getByText('Growth Marketer')).toBeInTheDocument();

    const openLinks = screen.getAllByRole('link', { name: 'Open' });
    expect(openLinks[0]).toHaveAttribute('href', '/dashboard/agency/job-management?workspaceId=ws-1&jobId=1');
    expect(openLinks[1]).toHaveAttribute('href', '/dashboard/agency/job-management?workspaceId=ws-1&jobId=2');
  });

  it('invokes filter change handlers when the user updates filters', async () => {
    setup();
    const user = userEvent.setup();

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'design');

    const lastFilter = onFilterChange.mock.calls.at(-1)?.[0];
    expect(lastFilter).toEqual({ search: 'design', status: undefined });

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'open' } });

    const finalCall = onFilterChange.mock.calls.at(-1)?.[0];
    expect(finalCall).toEqual({ search: 'design', status: 'open' });
  });

  it('selects jobs and toggles favorites without triggering unintended selections', () => {
    setup();

    const firstJob = screen.getByText('Senior Product Designer').closest('li');
    expect(firstJob).not.toBeNull();
    const listScope = firstJob ? within(firstJob) : null;
    const selectButton = listScope?.getAllByRole('button')[0];
    const starButton = listScope?.getByRole('button', { name: /star/i });

    fireEvent.click(selectButton);
    expect(onSelectJob).toHaveBeenCalledTimes(1);
    expect(onSelectJob.mock.calls[0][0]).toMatchObject({ id: 1, title: 'Senior Product Designer' });

    fireEvent.click(starButton);
    expect(onFavoriteToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(onSelectJob).toHaveBeenCalledTimes(1);
  });
});
