import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreationItemForm from '../CreationItemForm.jsx';

vi.mock('../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../services/agencyCreationStudio.js', () => ({
  createCreationStudioItem: vi.fn(() => Promise.resolve()),
  updateCreationStudioItem: vi.fn(() => Promise.resolve()),
  deleteCreationStudioItem: vi.fn(() => Promise.resolve()),
  fetchCreationStudioOverview: vi.fn(() => Promise.resolve({ data: {} })),
}));

describe('CreationItemForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('collects multi-step payload with trimmed values', () => {
    const onSubmit = vi.fn();
    render(
      <CreationItemForm
        onSubmit={onSubmit}
        config={{
          targetTypes: [
            { value: 'project', label: 'Project' },
          ],
          autoShareChannels: ['email', 'slack'],
          assetTypes: ['link', 'document'],
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: '  Demo drop  ' } });
    fireEvent.change(screen.getByLabelText(/^Summary$/i), { target: { value: '  Summary copy  ' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/^Tags$/i), { target: { value: 'alpha, beta ' } });
    fireEvent.change(screen.getByLabelText(/^Requirements$/i), { target: { value: 'First\nSecond' } });
    fireEvent.change(screen.getByLabelText(/^Budget$/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.click(screen.getAllByRole('button', { name: /^Add$/i })[0]);
    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: '  Alex  ' } });
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'alex@example.com ' } });
    fireEvent.change(screen.getByLabelText(/^Role$/i), { target: { value: ' Producer ' } });
    fireEvent.click(screen.getByLabelText(/^Publish$/i));

    fireEvent.click(screen.getAllByRole('button', { name: /^Add$/i })[1]);
    fireEvent.change(screen.getByLabelText(/^Label$/i), { target: { value: '  Guide  ' } });
    fireEvent.change(screen.getByLabelText(/^Type$/i), { target: { value: 'document' } });
    fireEvent.change(screen.getByLabelText(/^Link$/i), { target: { value: 'https://example.com' } });
    fireEvent.change(screen.getByLabelText(/^Notes$/i), { target: { value: '  Outline  ' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Demo drop');
    expect(payload.summary).toBe('Summary copy');
    expect(payload.autoShareChannels).toEqual([]);
    expect(payload.tags).toEqual(['alpha', 'beta']);
    expect(payload.requirements).toEqual(['First', 'Second']);
    expect(payload.budgetAmount).toBe(1000);
    expect(payload.collaborators).toHaveLength(1);
    expect(payload.collaborators[0]).toMatchObject({
      collaboratorName: 'Alex',
      collaboratorEmail: 'alex@example.com',
      role: 'Producer',
      permissions: expect.objectContaining({ canPublish: true }),
    });
    expect(payload.assets[0]).toMatchObject({
      label: 'Guide',
      url: 'https://example.com',
      description: 'Outline',
      assetType: 'document',
    });
  });
});

describe('CreationStudioSection', () => {
  let useCachedResourceMock;
  let services;

  beforeEach(async () => {
    vi.resetModules();
    useCachedResourceMock = (await import('../../../hooks/useCachedResource.js')).default;
    services = await import('../../../services/agencyCreationStudio.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders studio overview cards and refreshes after creating', async () => {
    const refresh = vi.fn();
    useCachedResourceMock.mockReturnValue({
      data: {
        summary: {
          totalItems: 4,
          backlogCount: 2,
          readyToPublishCount: 1,
          upcomingLaunches: [],
        },
        items: {
          data: [
            {
              id: 1,
              title: 'Launch academy',
              status: 'draft',
              targetType: 'project',
              priority: 'high',
              visibility: 'internal',
              ownerName: 'Alex',
              updatedAt: '2024-05-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, totalPages: 1, totalItems: 1 },
        },
        config: {
          targetTypes: [
            { value: 'project', label: 'Project' },
          ],
          statuses: [
            { value: 'draft', label: 'Draft' },
          ],
          priorities: [],
          visibilities: [],
        },
      },
      loading: false,
      error: null,
      fromCache: false,
      lastUpdated: new Date('2024-05-10T00:00:00Z'),
      refresh,
    });

    vi.doMock('../CreationItemForm.jsx', () => ({
      __esModule: true,
      default: ({ onSubmit, onCancel }) => (
        <div data-testid="creation-form">
          <button type="button" onClick={() => onSubmit({ title: 'New item' })}>
            Submit item
          </button>
          <button type="button" onClick={onCancel}>
            Close
          </button>
        </div>
      ),
    }));

    const { default: CreationStudioSection } = await import('../CreationStudioSection.jsx');

    render(<CreationStudioSection />);

    expect(screen.getByText(/creation studio/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /new/i }));
    expect(screen.getByTestId('creation-form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit item/i }));

    await waitFor(() => {
      expect(services.createCreationStudioItem).toHaveBeenCalledWith({ title: 'New item' });
    });
    expect(refresh).toHaveBeenCalledWith({ force: true });
  });
});
