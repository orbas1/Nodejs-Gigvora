import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import JobAdvertForm from '../JobAdvertForm.jsx';
import JobAdvertList from '../JobAdvertList.jsx';

const lookups = {
  jobStatuses: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ],
  remoteTypes: [
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
  ],
};

describe('Job adverts tooling', () => {
  it('validates and submits the job advert form', async () => {
    const handleSubmit = vi.fn();
    render(<JobAdvertForm lookups={lookups} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Product Manager' } });
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: 'Lead cross-functional teams' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Remote' } });
    fireEvent.change(screen.getByLabelText('Compensation minimum'), { target: { value: '80000' } });
    fireEvent.change(screen.getByLabelText('Compensation maximum'), { target: { value: '120000' } });
    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'product, leadership' } });

    fireEvent.click(screen.getByRole('button', { name: /^Save job$/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(handleSubmit).toHaveBeenCalledWith({
      payload: expect.objectContaining({
        title: 'Product Manager',
        openings: 1,
        compensationMin: 80000,
        compensationMax: 120000,
      }),
      keywords: [
        { keyword: 'product', weight: 1 },
        { keyword: 'leadership', weight: 1 },
      ],
    });
  });

  it('prevents submission when required fields are missing', async () => {
    const handleSubmit = vi.fn();
    render(<JobAdvertForm lookups={lookups} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: '   ' } });
    const form = screen.getByLabelText('Job title').closest('form');
    fireEvent.submit(form);

    expect(handleSubmit).not.toHaveBeenCalled();
    await screen.findByText('Title is required');
    await screen.findByText('Description is required');
  });

  it('validates numeric inputs, range logic, and sanitises currency codes', async () => {
    const handleSubmit = vi.fn();
    render(<JobAdvertForm lookups={lookups} onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Data Scientist' } });
    fireEvent.change(screen.getByLabelText('Job description'), { target: { value: 'Analyse data to inform strategy' } });
    const openingsInput = screen.getByLabelText('Openings');
    const minInput = screen.getByLabelText('Compensation minimum');
    const maxInput = screen.getByLabelText('Compensation maximum');

    fireEvent.change(openingsInput, { target: { value: '0' } });
    fireEvent.change(minInput, { target: { value: '90000' } });
    fireEvent.change(maxInput, { target: { value: '80000' } });
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'gbp1' } });

    const form = screen.getByLabelText('Job title').closest('form');
    fireEvent.submit(form);

    expect(handleSubmit).not.toHaveBeenCalled();
    await screen.findByText('Openings must be at least 1');
    await screen.findByText('Maximum must be greater than minimum');

    const currencyInput = screen.getByLabelText('Currency');
    expect(currencyInput).toHaveValue('GBP');

    fireEvent.change(openingsInput, { target: { value: '3' } });
    fireEvent.change(maxInput, { target: { value: '120000' } });
    fireEvent.change(minInput, { target: { value: '-1' } });
    fireEvent.submit(form);

    await screen.findByText('Minimum cannot be negative');
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('lists job adverts with controls and summary metrics', () => {
    const handleSelect = vi.fn();
    const handleEdit = vi.fn();
    const handleFavorite = vi.fn();
    const handleCreate = vi.fn();

    render(
      <JobAdvertList
        summary={{ totalJobs: 3, openJobs: 2, totalCandidates: 40, upcomingInterviews: 5, favourites: 1 }}
        jobs={[
          {
            advert: { jobId: '1', status: 'published', openings: 2, remoteType: 'remote', favorites: [1, 2] },
            job: { title: 'Product Manager', location: 'Remote', employmentType: 'Full-time' },
            applicants: [{ id: 'a-1' }],
          },
        ]}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onFavorite={handleFavorite}
        onCreate={handleCreate}
      />,
    );

    expect(screen.getByText('Adverts')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New job/i }));
    expect(handleCreate).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Product Manager'));
    expect(handleSelect).toHaveBeenCalled();

    const card = screen.getByRole('button', { name: /Product Manager/i });
    const editButton = within(card).getByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalled();

    const starButton = within(card).getByRole('button', { name: /Star/i });
    fireEvent.click(starButton);
    expect(handleFavorite).toHaveBeenCalled();
  });
});
