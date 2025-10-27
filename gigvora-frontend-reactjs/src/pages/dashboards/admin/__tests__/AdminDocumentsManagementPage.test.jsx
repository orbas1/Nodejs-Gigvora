import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockFetchDocumentRepository = vi.hoisted(() => vi.fn());
const layoutProps = vi.hoisted(() => ({ current: null }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../components/admin/AdminGovernanceLayout.jsx', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    layoutProps.current = props;
    return <div data-testid="admin-governance-layout">{children}</div>;
  },
}));

vi.mock('../../../../context/SessionContext.jsx', () => ({
  __esModule: true,
  useSession: () => ({
    session: {
      id: 'admin-user',
      roles: ['admin'],
      memberships: ['admin'],
      primaryDashboard: 'admin',
    },
  }),
}));

vi.mock('../../../../components/admin/documents/DocumentRepositoryManager.jsx', () => ({
  __esModule: true,
  default: ({ onUploadClick }) => (
    <div data-testid="document-repository-manager">
      <button type="button" onClick={onUploadClick}>
        Trigger upload
      </button>
    </div>
  ),
}));

vi.mock('../../../../components/admin/documents/DocumentReviewWorkflow.jsx', () => ({
  __esModule: true,
  default: ({ reviews }) => (
    <div data-testid="document-review-workflow">Reviews: {reviews.length}</div>
  ),
}));

vi.mock('../../../../components/admin/documents/DocumentUploadModal.jsx', () => ({
  __esModule: true,
  default: ({ open }) => (open ? <div data-testid="document-upload-modal">Modal open</div> : null),
}));

vi.mock('../../../../services/documentsManagement.js', () => ({
  __esModule: true,
  fetchDocumentRepository: mockFetchDocumentRepository,
  uploadDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  publishDocument: vi.fn(),
  requestDocumentReview: vi.fn(),
  createDocumentCollection: vi.fn(),
  updateDocumentCollection: vi.fn(),
  deleteDocumentCollection: vi.fn(),
}));

import AdminDocumentsManagementPage from '../AdminDocumentsManagementPage.jsx';

beforeEach(() => {
  mockNavigate.mockReset();
  mockFetchDocumentRepository.mockReset();
  layoutProps.current = null;
  mockFetchDocumentRepository.mockResolvedValue({
    documents: [
      {
        id: 'doc-1',
        name: 'Security policy',
        status: 'draft',
      },
    ],
    collections: [
      {
        id: 'collection-1',
        name: 'Risk playbooks',
        documents: ['doc-1'],
      },
    ],
    reviews: [
      {
        id: 'review-1',
        documentName: 'Security policy',
        status: 'pending',
      },
    ],
    refreshedAt: '2025-05-01T10:00:00.000Z',
  });
});

describe('AdminDocumentsManagementPage', () => {
  it('renders governance layout sections with navigation actions', async () => {
    render(<AdminDocumentsManagementPage />);

    expect(await screen.findByText('Repository snapshot')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download manifest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload document' })).toBeInTheDocument();

    expect(document.getElementById('document-repository')).toBeTruthy();
    expect(document.getElementById('document-reviews')).toBeTruthy();
    expect(document.getElementById('document-collaboration')).toBeTruthy();
    expect(layoutProps.current?.statusLabel).toBe('Document repository');
    expect(layoutProps.current?.menuConfig).toHaveLength(2);
    expect(layoutProps.current?.sections).toEqual([
      { id: 'document-repository', title: 'Repository' },
      { id: 'document-reviews', title: 'Reviews' },
      { id: 'document-collaboration', title: 'Collaboration' },
    ]);
    expect(layoutProps.current?.headerActions?.map((action) => action.label)).toEqual([
      'Governance overview',
      'Policy workflows',
      'Download manifest',
      'Upload document',
    ]);
  });

  it('falls back to offline snapshot when repository fetch fails', async () => {
    mockFetchDocumentRepository.mockRejectedValueOnce(new Error('Network offline'));

    render(<AdminDocumentsManagementPage />);

    expect(
      await screen.findByText('Using offline document data. Connect the API for real-time content.'),
    ).toBeInTheDocument();
    expect(document.getElementById('document-repository')).toBeTruthy();
    expect(layoutProps.current?.fromCache).toBe(true);
    expect(layoutProps.current?.statusLabel).toBe('Document repository');
  });
});
