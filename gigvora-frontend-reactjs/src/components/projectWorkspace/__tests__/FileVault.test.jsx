import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileVault from '../FileVault.jsx';

const project = {
  id: 55,
  files: [
    {
      id: 1,
      label: 'Brand guidelines',
      storageUrl: 'https://files.gigvora.com/brand.pdf',
      fileType: 'application/pdf',
      sizeBytes: 1200000,
      uploadedBy: 'Studio',
      visibility: 'client',
      updatedAt: '2025-02-01T00:00:00.000Z',
    },
    {
      id: 2,
      label: 'Sprint plan',
      storageUrl: 'https://files.gigvora.com/plan.xlsx',
      fileType: 'application/vnd.ms-excel',
      sizeBytes: 420000,
      uploadedBy: 'PMO',
      visibility: 'internal',
      updatedAt: '2025-01-28T00:00:00.000Z',
    },
  ],
};

describe('FileVault', () => {
  it('filters files and shows vault analytics', async () => {
    const actions = {
      createFile: vi.fn().mockResolvedValue({}),
      updateFile: vi.fn(),
      deleteFile: vi.fn(),
    };

    render(<FileVault project={project} actions={actions} canManage />);

    expect(screen.getByText(/Secure project asset storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Files stored/i).closest('div')).toHaveTextContent('2');

    await userEvent.type(screen.getByPlaceholderText(/Search by name/i), 'Brand');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows).toHaveLength(2); // header + 1 match
  });

  it('creates a new file record', async () => {
    const actions = {
      createFile: vi.fn().mockResolvedValue({}),
      updateFile: vi.fn(),
      deleteFile: vi.fn(),
    };

    render(<FileVault project={project} actions={actions} canManage />);

    await userEvent.click(screen.getByRole('button', { name: /Add asset/i }));
    await userEvent.type(screen.getByLabelText(/Label/i), 'Executive summary');
    await userEvent.type(screen.getByLabelText(/Storage URL/i), 'https://files.gigvora.com/summary.pdf');
    await userEvent.type(screen.getByLabelText(/File type/i), 'application/pdf');
    await userEvent.type(screen.getByLabelText(/File size/i), '2048');
    await userEvent.type(screen.getByLabelText(/Uploaded by/i), 'Ops lead');
    await userEvent.selectOptions(screen.getByLabelText(/Visibility/i), 'client');
    await userEvent.click(screen.getByRole('button', { name: /Upload file/i }));

    expect(actions.createFile).toHaveBeenCalledWith(55, {
      label: 'Executive summary',
      storageUrl: 'https://files.gigvora.com/summary.pdf',
      fileType: 'application/pdf',
      sizeBytes: 2048,
      uploadedBy: 'Ops lead',
      visibility: 'client',
    });
  });
});
