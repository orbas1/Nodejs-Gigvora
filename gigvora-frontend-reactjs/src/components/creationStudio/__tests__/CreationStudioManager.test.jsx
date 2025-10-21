import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('../../../services/creationStudio.js', () => ({
  listCreationStudioItems: vi.fn(),
  getCreationStudioItem: vi.fn(),
  createCreationStudioItem: vi.fn(),
  updateCreationStudioItem: vi.fn(),
  publishCreationStudioItem: vi.fn(),
}));

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import CreationStudioManager from '../CreationStudioManager.jsx';
import {
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
} from '../../../services/creationStudio.js';
import useSession from '../../../hooks/useSession.js';

const mockUseSession = useSession;

const baseSession = {
  session: {
    id: 42,
    memberships: ['freelancer'],
    permissions: ['creation:manage'],
  },
  isAuthenticated: true,
};

const listItem = {
  id: 101,
  title: 'Beta Launch Playbook',
  type: 'gig',
  status: 'draft',
  updatedAt: '2024-06-01T12:00:00.000Z',
  visibility: 'public',
};

const fullItem = {
  ...listItem,
  summary: 'Prep your launch pipeline in record time.',
  description: 'A detailed playbook covering onboarding, assets, and schedule.',
  ownerId: 42,
  deliverables: ['Kickoff call', 'Launch checklist'],
  tags: ['launch'],
  audienceSegments: ['founders'],
  roleAccess: ['freelancer'],
  permissions: [
    { role: 'freelancer', canView: true, canEdit: true, canPublish: true, canManageAssets: true },
  ],
  packages: [
    { id: 'basic', name: 'Basic', price: '$500', deliveryTime: '7 days', features: ['Audit'] },
  ],
  faqs: [
    { id: 'faq-1', question: 'What is included?', answer: 'You receive a launch plan and kickoff call.' },
  ],
  metadata: {
    packages: [
      { id: 'basic', name: 'Basic', price: '$500', deliveryTime: '7 days', features: ['Audit'] },
    ],
    faqs: [
      { id: 'faq-1', question: 'What is included?', answer: 'You receive a launch plan and kickoff call.' },
    ],
  },
};

function resolveShelfRowByTitle(title) {
  const cell = screen.getByText(title);
  return cell.closest('li') ?? cell.closest('tr');
}

describe('CreationStudioManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guards access for unauthenticated visitors', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });

    render(<CreationStudioManager />);

    expect(screen.getByText(/creation studio unavailable/i)).toBeInTheDocument();
    expect(listCreationStudioItems).not.toHaveBeenCalled();
  });

  it('loads existing items and supports editing flow', async () => {
    mockUseSession.mockReturnValue(baseSession);
    listCreationStudioItems.mockResolvedValue({ items: [listItem] });
    getCreationStudioItem.mockResolvedValue(fullItem);
    updateCreationStudioItem.mockResolvedValue({ ...fullItem, title: 'Beta Launch Playbook (Updated)' });

    const user = userEvent.setup();
    render(<CreationStudioManager />);

    expect(await screen.findByText(listItem.title)).toBeInTheDocument();
    expect(listCreationStudioItems).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 42 }));

    const row = resolveShelfRowByTitle(listItem.title);
    await user.click(within(row).getByRole('button', { name: /peek/i }));

    await waitFor(() => {
      expect(getCreationStudioItem).toHaveBeenCalledWith(listItem.id);
    });

    const previewDialog = await screen.findByRole('dialog');
    expect(previewDialog).toHaveTextContent(listItem.title);

    getCreationStudioItem.mockResolvedValueOnce(fullItem);
    await user.click(within(previewDialog).getByRole('button', { name: /edit/i }));

    const titleField = await screen.findByLabelText('Title');
    await user.clear(titleField);
    await user.type(titleField, 'Beta Launch Playbook (Updated)');

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(updateCreationStudioItem).toHaveBeenCalledWith(
        listItem.id,
        expect.objectContaining({
          title: 'Beta Launch Playbook (Updated)',
          ownerId: 42,
        }),
      );
    });
    expect(publishCreationStudioItem).not.toHaveBeenCalled();
  });

  it('creates and publishes a new creation', async () => {
    mockUseSession.mockReturnValue(baseSession);
    listCreationStudioItems.mockResolvedValue({ items: [] });
    createCreationStudioItem.mockResolvedValue({ id: 202, type: 'gig' });
    publishCreationStudioItem.mockResolvedValue({ id: 202, status: 'published' });

    const user = userEvent.setup();
    render(<CreationStudioManager />);

    await user.click(await screen.findByRole('button', { name: /new/i }));

    const wizard = await screen.findByRole('dialog');
    expect(wizard).toBeInTheDocument();

    const titleField = await screen.findByLabelText('Title');
    await user.clear(titleField);
    await user.type(titleField, 'New Service Blueprint');

    const summaryField = await screen.findByLabelText('Summary');
    await user.clear(summaryField);
    await user.type(summaryField, 'Accelerate client onboarding with automated playbooks.');

    await user.click(within(wizard).getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(createCreationStudioItem).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Service Blueprint',
          ownerId: 42,
        }),
      );
    });

    await waitFor(() => {
      expect(publishCreationStudioItem).toHaveBeenCalledWith(202, expect.objectContaining({ ownerId: 42 }));
    });
  });
});
