import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunityManagementSection from '../CommunityManagementSection.jsx';
import GroupManagementPanel from '../GroupManagementPanel.jsx';
import PageManagementPanel from '../PageManagementPanel.jsx';

vi.mock('../../../services/groups.js', () => {
  const service = {
    createUserGroup: vi.fn(),
    updateUserGroup: vi.fn(),
    listUserGroupInvites: vi.fn(),
    createUserGroupInvite: vi.fn(),
    deleteUserGroupInvite: vi.fn(),
    listUserGroupPosts: vi.fn(),
    createUserGroupPost: vi.fn(),
    updateUserGroupPost: vi.fn(),
    deleteUserGroupPost: vi.fn(),
  };
  return { default: service };
});

vi.mock('../../../services/pages.js', () => {
  const service = {
    createUserPage: vi.fn(),
    updateUserPage: vi.fn(),
    listPageInvites: vi.fn(),
    createPageInvite: vi.fn(),
    deletePageInvite: vi.fn(),
    listPagePosts: vi.fn(),
    createPagePost: vi.fn(),
    updatePagePost: vi.fn(),
    deletePagePost: vi.fn(),
    listPageMemberships: vi.fn(),
    updatePageMembership: vi.fn(),
  };
  return { default: service };
});

import groupsService from '../../../services/groups.js';
import pagesService from '../../../services/pages.js';

describe('CommunityManagementSection', () => {
  it('renders summary statistics for groups and pages', () => {
    render(
      <CommunityManagementSection
        data={{
          groups: {
            stats: { total: 5, managed: 2, pendingInvites: 1 },
            items: [
              {
                id: 'group-1',
                name: 'Design leaders',
                slug: 'design-leaders',
                description: 'Craft leadership community.',
                status: 'active',
                role: 'owner',
                visibility: 'public',
                memberPolicy: 'request',
                metrics: { invitesPending: 1 },
              },
            ],
          },
          pages: {
            stats: { total: 3, managed: 1, pendingInvites: 2 },
            items: [
              {
                id: 'page-1',
                name: 'Gigvora Careers',
                slug: 'gigvora-careers',
                description: 'Highlighting open roles and stories.',
                status: 'published',
                role: 'owner',
                visibility: 'public',
                metrics: { followers: 4200 },
              },
            ],
          },
        }}
        userId="user-10"
      />,
    );

    expect(screen.getByText(/Group & Page management/)).toBeInTheDocument();
    expect(screen.getByText(/Design leaders/)).toBeInTheDocument();
    expect(screen.getByText(/Gigvora Careers/)).toBeInTheDocument();
    expect(screen.getByText(/3 managed spaces/)).toBeInTheDocument();
  });
});

describe('GroupManagementPanel', () => {
  beforeEach(() => {
    groupsService.createUserGroup.mockResolvedValue({ id: 'group-new' });
    groupsService.updateUserGroup.mockResolvedValue({ id: 'group-1' });
    groupsService.listUserGroupInvites.mockResolvedValue({ invites: [{ id: 'invite-1', email: 'mentor@example.com' }] });
    groupsService.deleteUserGroupInvite.mockResolvedValue(undefined);
    groupsService.createUserGroupPost.mockResolvedValue({ id: 'post-1', title: 'Welcome' });
    groupsService.listUserGroupPosts.mockResolvedValue({ posts: [] });
  });

  it('creates a new group and triggers refresh', async () => {
    const user = userEvent.setup();
    const refreshSpy = vi.fn();
    render(
      <GroupManagementPanel
        groups={{
          items: [
            {
              id: 'group-1',
              name: 'Growth marketers',
              slug: 'growth-marketers',
              role: 'owner',
              status: 'active',
              visibility: 'public',
              memberPolicy: 'request',
              metrics: {},
            },
          ],
        }}
        userId="user-1"
        onRefresh={refreshSpy}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^create group$/i }));
    });
    const groupNameInput = await screen.findByLabelText(/^Name$/i);
    await act(async () => {
      await user.type(groupNameInput, 'Future of work');
    });
    const groupSubmitButtons = screen.getAllByRole('button', { name: /^create group$/i });
    await act(async () => {
      await user.click(groupSubmitButtons[groupSubmitButtons.length - 1]);
    });

    await waitFor(() => {
      expect(groupsService.createUserGroup).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'Future of work' }));
    });
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('loads invites for a managed group and allows removal', async () => {
    const user = userEvent.setup();
    render(
      <GroupManagementPanel
        groups={{
          items: [
            {
              id: 'group-2',
              name: 'Product builders',
              slug: 'product-builders',
              role: 'owner',
              status: 'active',
              visibility: 'private',
              memberPolicy: 'invite',
              metrics: {},
            },
          ],
        }}
        userId="user-2"
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Invites & roles/i }));
    });
    await waitFor(() => {
      expect(groupsService.listUserGroupInvites).toHaveBeenCalledWith('user-2', 'group-2');
    });

    expect(screen.getByText(/mentor@example.com/)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /cancel/i }));
    });
    await waitFor(() => {
      expect(groupsService.deleteUserGroupInvite).toHaveBeenCalledWith('user-2', 'group-2', 'invite-1');
    });
  });
});

describe('PageManagementPanel', () => {
  beforeEach(() => {
    pagesService.createUserPage.mockResolvedValue({ id: 'page-new' });
    pagesService.updateUserPage.mockResolvedValue({ id: 'page-1' });
    pagesService.listPageInvites.mockResolvedValue({ invites: [] });
    pagesService.listPagePosts.mockResolvedValue({ posts: [] });
    pagesService.listPageMemberships.mockResolvedValue({ memberships: [] });
  });

  it('creates a new page and triggers refresh', async () => {
    const user = userEvent.setup();
    const refreshSpy = vi.fn();
    render(
      <PageManagementPanel
        pages={{
          items: [
            {
              id: 'page-1',
              name: 'Talent brand',
              slug: 'talent-brand',
              role: 'owner',
              status: 'published',
              visibility: 'public',
              metrics: {},
            },
          ],
        }}
        userId="user-9"
        onRefresh={refreshSpy}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^create page$/i }));
    });
    const pageNameInput = await screen.findByLabelText(/^Name$/i);
    await act(async () => {
      await user.type(pageNameInput, 'Partner success');
    });
    const submitButtons = screen.getAllByRole('button', { name: /^create page$/i });
    await act(async () => {
      await user.click(submitButtons[submitButtons.length - 1]);
    });

    await waitFor(() => {
      expect(pagesService.createUserPage).toHaveBeenCalledWith('user-9', expect.objectContaining({ name: 'Partner success' }));
    });
    expect(refreshSpy).toHaveBeenCalled();
  });
});
