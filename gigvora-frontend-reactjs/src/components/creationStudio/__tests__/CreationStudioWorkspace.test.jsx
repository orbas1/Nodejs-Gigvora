import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../CreationStudioWizard.jsx', () => ({
  __esModule: true,
  default: vi.fn((props) => (
    <div>
      <div data-testid="wizard-props">{props.activeItem ? props.activeItem.title : 'new draft'}</div>
      <button type="button" onClick={() => props.onCreateDraft?.({ title: 'Draft' })}>
        Trigger create draft
      </button>
    </div>
  )),
}));

vi.mock('../../../services/creationStudio.js', () => ({
  createCreationItem: vi.fn(() => Promise.resolve({ id: 'draft-2', title: 'Draft' })),
  updateCreationItem: vi.fn(() => Promise.resolve()),
  saveCreationStep: vi.fn(() => Promise.resolve()),
  shareCreationItem: vi.fn(() => Promise.resolve()),
  archiveCreationItem: vi.fn(() => Promise.resolve()),
}));

import useCachedResource from '../../../hooks/useCachedResource.js';
import CreationStudioWizard from '../CreationStudioWizard.jsx';
import {
  createCreationItem,
} from '../../../services/creationStudio.js';
import CreationStudioWorkspace from '../CreationStudioWorkspace.jsx';

const mockUseCachedResource = useCachedResource;
const mockWizard = CreationStudioWizard;

describe('CreationStudioWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks unauthenticated visitors to sign in', () => {
    mockUseCachedResource.mockReturnValue({ data: null, loading: false, error: null, refresh: vi.fn() });

    render(
      <MemoryRouter>
        <CreationStudioWorkspace ownerId={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/sign in to manage your creation studio/i)).toBeInTheDocument();
  });

  it('blocks accounts without creator access', () => {
    mockUseCachedResource.mockReturnValue({ data: null, loading: false, error: null, refresh: vi.fn() });

    render(
      <MemoryRouter>
        <CreationStudioWorkspace ownerId={99} hasAccess={false} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/doesn't have creation studio access yet/i),
    ).toBeInTheDocument();
  });

  it('loads workspace data and creates drafts', async () => {
    const refresh = vi.fn();
    mockUseCachedResource.mockReturnValue({
      data: {
        items: [{ id: 'draft-1', title: 'Existing', type: 'gig', status: 'draft', updatedAt: '2024-07-01T00:00:00Z' }],
        catalog: [{ type: 'gig', label: 'Gig' }],
        summary: { drafts: 1 },
        shareDestinations: [],
      },
      loading: false,
      error: null,
      refresh,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreationStudioWorkspace ownerId={42} hasAccess />
      </MemoryRouter>,
    );

    expect(screen.getByText('Existing')).toBeInTheDocument();
    expect(mockWizard).toHaveBeenCalledWith(expect.objectContaining({ activeItem: null }), expect.anything());

    await user.click(screen.getByRole('button', { name: /trigger create draft/i }));

    await waitFor(() => {
      expect(createCreationItem).toHaveBeenCalledWith(42, { title: 'Draft' });
    });
    expect(refresh).toHaveBeenCalledWith({ force: true });
  });
});

