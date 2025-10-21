import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentRepositoryManager from '../DocumentRepositoryManager.jsx';
import DocumentReviewWorkflow from '../DocumentReviewWorkflow.jsx';
import DocumentUploadModal from '../DocumentUploadModal.jsx';

describe('DocumentRepositoryManager', () => {
  const documents = [
    {
      id: 1,
      name: 'Security Playbook',
      version: '3.1',
      type: 'policy',
      owner: 'Alex',
      tags: ['security'],
      status: 'published',
      updatedAt: '2024-05-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Finance Checklist',
      version: '1.0',
      type: 'procedure',
      owner: 'Jamie',
      tags: ['finance'],
      status: 'draft',
      updatedAt: '2024-05-02T00:00:00Z',
    },
  ];

  it('filters documents by tag and search query', () => {
    const handleFilter = vi.fn();
    const handleSearch = vi.fn();
    render(
      <DocumentRepositoryManager
        documents={documents}
        collections={[]}
        onFilter={handleFilter}
        onSearch={handleSearch}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Security/i }));
    expect(handleFilter).toHaveBeenCalledWith('security');

    const searchInput = screen.getByPlaceholderText('Search documents');
    fireEvent.change(searchInput, { target: { value: 'security' } });
    expect(handleSearch).toHaveBeenCalledWith('security');

    expect(screen.getByText('Security Playbook')).toBeInTheDocument();
    expect(screen.queryByText('Finance Checklist')).not.toBeInTheDocument();
  });
});

describe('DocumentReviewWorkflow', () => {
  it('groups reviews by status and triggers actions', () => {
    const handleApprove = vi.fn();
    render(
      <DocumentReviewWorkflow
        reviews={[
          { id: '1', status: 'pending', documentName: 'MSA', requestedBy: 'Alex' },
          { id: '2', status: 'approved', documentName: 'NDA', requestedBy: 'Sam' },
        ]}
        onApprove={handleApprove}
      />,
    );

    expect(screen.getByText('MSA')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));
    expect(handleApprove).toHaveBeenCalledWith('1');
  });
});

describe('DocumentUploadModal', () => {
  it('submits a normalized upload payload', async () => {
    const handleUpload = vi.fn();
    const handleClose = vi.fn();
    const file = new File(['Policy body'], 'policy.pdf', { type: 'application/pdf' });

    const user = userEvent.setup();
    render(
      <DocumentUploadModal
        open
        onClose={handleClose}
        onUpload={handleUpload}
        collections={[{ id: 'c1', name: 'Due diligence' }]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Document name/i), {
      target: { value: 'SOC2 policy' },
    });
    fireEvent.change(screen.getByLabelText(/Owner/i), {
      target: { value: 'Alex' },
    });
    fireEvent.change(screen.getByLabelText(/Tags/), {
      target: { value: 'security, audit' },
    });
    const collectionsSelect = screen.getByLabelText(/Collections/i);
    await user.selectOptions(collectionsSelect, ['c1']);

    const dropzoneLabel = screen.getByText(/Drop file or click to browse/i).closest('label');
    expect(dropzoneLabel).not.toBeNull();
    const fileInput = dropzoneLabel?.querySelector('input[type="file"]');
    expect(fileInput).toBeInstanceOf(HTMLInputElement);
    await user.upload(fileInput, file);

    fireEvent.submit(screen.getByRole('button', { name: /Upload document/i }).closest('form'));

    await waitFor(() => {
      expect(handleUpload).toHaveBeenCalled();
    });

    expect(handleUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SOC2 policy',
        owner: 'Alex',
        tags: ['security', 'audit'],
        collectionIds: ['c1'],
        file,
      }),
    );
  });
});
