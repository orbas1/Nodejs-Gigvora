import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkspaceBudgetManager from '../WorkspaceBudgetManager.jsx';
import WorkspaceConversationCenter from '../WorkspaceConversationCenter.jsx';
import WorkspaceFileManager from '../WorkspaceFileManager.jsx';
import WorkspaceHrManager from '../WorkspaceHrManager.jsx';
import WorkspaceInviteManager from '../WorkspaceInviteManager.jsx';
import WorkspaceMeetingManager from '../WorkspaceMeetingManager.jsx';
import WorkspaceModuleDialog from '../WorkspaceModuleDialog.jsx';
import WorkspaceObjectManager from '../WorkspaceObjectManager.jsx';
import WorkspaceOverviewSection from '../WorkspaceOverviewSection.jsx';
import WorkspaceProjectSelector from '../WorkspaceProjectSelector.jsx';
import WorkspaceRoleManager from '../WorkspaceRoleManager.jsx';

vi.mock('../../../services/discovery.js', () => {
  const searchProjects = vi.fn();
  return {
    default: {
      searchProjects,
    },
  };
});

import discoveryService from '../../../services/discovery.js';

const { searchProjects } = discoveryService;

describe('workspace managers', () => {
  beforeEach(() => {
    searchProjects.mockReset();
  });

  it('summarises budgets and normalises values on save', async () => {
    const budgets = [
      {
        id: 'b-1',
        category: 'Design',
        status: 'approved',
        currency: 'USD',
        allocatedAmount: 5000,
        actualAmount: 4200,
        ownerName: 'Marin',
      },
      {
        id: 'b-2',
        category: 'Development',
        status: 'over_budget',
        currency: 'USD',
        allocatedAmount: 12000,
        actualAmount: 14800,
        ownerName: 'Jess',
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceBudgetManager budgets={budgets} onSave={onSave} onDelete={onDelete} currency="USD" />);

    expect(screen.getByText(/Budget management/)).toBeInTheDocument();
    expect(screen.getByText('Over budget lines:', { exact: false })).toHaveTextContent('Over budget lines: 1');

    await user.type(screen.getByLabelText('Category'), 'QA review');
    await user.clear(screen.getByLabelText('Allocated amount'));
    await user.type(screen.getByLabelText('Allocated amount'), '6500');
    await user.clear(screen.getByLabelText('Actual amount'));
    await user.type(screen.getByLabelText('Actual amount'), '6100');
    await user.type(screen.getByLabelText('Owner'), 'Dana');
    await user.type(screen.getByLabelText('Notes'), 'Includes test automation.');

    await user.click(screen.getByRole('button', { name: 'Add budget' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedBudget = onSave.mock.calls[0][0];
    expect(savedBudget).toMatchObject({
      id: null,
      category: 'QA review',
      allocatedAmount: 6500,
      actualAmount: 6100,
      ownerName: 'Dana',
      notes: 'Includes test automation.',
    });

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    expect(screen.getByRole('heading', { name: 'Edit budget line' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(budgets[0]));
  });

  it('supports threaded conversations, acknowledgements, and sending replies', async () => {
    const conversations = [
      {
        id: 'conv-1',
        topic: 'Branding kickoff',
        priority: 'urgent',
        unreadCount: 3,
        lastMessageAt: '2024-03-20T09:00:00.000Z',
        lastMessagePreview: 'We need mockups before EOW.',
        participants: ['Mira', 'Oscar'],
        messages: [
          {
            id: 'msg-1',
            authorName: 'Mira',
            body: 'Uploading first draft shortly.',
            postedAt: '2024-03-20T08:50:00.000Z',
          },
        ],
      },
      {
        id: 'conv-2',
        topic: 'Content calendar',
        priority: 'normal',
        unreadCount: 0,
        lastMessageAt: '2024-03-18T15:00:00.000Z',
      },
    ];
    const onAcknowledge = vi.fn().mockResolvedValue();
    const onSendMessage = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(
      <WorkspaceConversationCenter
        conversations={conversations}
        onAcknowledge={onAcknowledge}
        onSendMessage={onSendMessage}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Branding kickoff' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark conversation as read' }));
    await waitFor(() => expect(onAcknowledge).toHaveBeenCalledWith('conv-1'));

    await user.type(screen.getByLabelText('Your name'), 'Jordan');
    await user.type(screen.getByLabelText('Your role'), 'Project lead');
    await user.type(screen.getByLabelText('Message'), 'Latest brief is ready for review.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('conv-1', expect.any(Object)));
    expect(onSendMessage.mock.calls[0][1]).toMatchObject({
      authorName: 'Jordan',
      authorRole: 'Project lead',
      body: 'Latest brief is ready for review.',
    });
    expect(await screen.findByText('Message sent.')).toBeInTheDocument();
  });

  it('converts file metadata and tags for storage', async () => {
    const files = [
      {
        id: 'file-1',
        name: 'Scope document',
        category: 'Documentation',
        fileType: 'pdf',
        storageProvider: 'aws',
        version: 'v1',
        sizeBytes: 1048576,
        tags: ['scope', 'signed'],
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceFileManager files={files} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText('1.0 MB')).toBeInTheDocument();

    await user.type(screen.getByLabelText('File name'), 'Recording');
    await user.type(screen.getByLabelText('Category'), 'Meetings');
    await user.type(screen.getByLabelText('File type'), 'mp4');
    await user.type(screen.getByLabelText('Storage provider'), 'gdrive');
    await user.type(screen.getByLabelText('Storage path / URL'), '/meetings/rec.mp4');
    await user.type(screen.getByLabelText('Version'), '2.0');
    await user.type(screen.getByLabelText('Size (bytes)'), '2048');
    await user.type(screen.getByLabelText('Checksum'), 'abc123');
    await user.type(screen.getByLabelText('Tags (comma separated)'), 'recording, client call');

    await user.click(screen.getByRole('button', { name: 'Add file' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedFile = onSave.mock.calls[0][0];
    expect(savedFile).toMatchObject({
      name: 'Recording',
      category: 'Meetings',
      fileType: 'mp4',
      storageProvider: 'gdrive',
      storagePath: '/meetings/rec.mp4',
      version: '2.0',
      sizeBytes: 2048,
      checksum: 'abc123',
      tags: ['recording', 'client call'],
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(files[0]));
  });

  it('tracks staffing records and normalises dates', async () => {
    const records = [
      {
        id: 'hr-1',
        memberName: 'Liam',
        assignmentRole: 'Designer',
        status: 'active',
        capacityHours: 30,
        allocatedHours: 24,
        costRate: 85,
        currency: 'USD',
        startedAt: '2024-02-01T00:00:00.000Z',
        endedAt: '2024-04-01T00:00:00.000Z',
        notes: 'Primary designer',
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceHrManager records={records} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText(/Human resources assignments/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Start date')).toHaveValue('2024-02-01');

    await user.clear(screen.getByLabelText('Capacity hours'));
    await user.type(screen.getByLabelText('Capacity hours'), '35');
    await user.clear(screen.getByLabelText('Start date'));
    await user.type(screen.getByLabelText('Start date'), '2024-03-01');
    await user.click(screen.getByRole('button', { name: 'Update record' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedRecord = onSave.mock.calls[0][0];
    expect(savedRecord.capacityHours).toBe(35);
    expect(new Date(savedRecord.startedAt).toISOString()).toBe('2024-03-01T00:00:00.000Z');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(records[0]));
  });

  it('manages invitations and expiry dates', async () => {
    const invites = [
      {
        id: 'invite-1',
        email: 'client@example.com',
        role: 'Client reviewer',
        status: 'pending',
        invitedByName: 'Jordan',
        expiresAt: '2024-03-31T18:00:00.000Z',
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceInviteManager invites={invites} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText('Open invites:', { exact: false })).toHaveTextContent('Open invites: 1');

    await user.type(screen.getByLabelText('Email'), 'new-user@example.com');
    await user.type(screen.getByLabelText('Role'), 'Producer');
    await user.type(screen.getByLabelText('Invited by'), 'Alex');
    await user.type(screen.getByLabelText('Expires at'), '2024-04-15T10:30');
    await user.type(screen.getByLabelText('Message'), 'Join our workspace.');

    await user.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedInvite = onSave.mock.calls[0][0];
    expect(savedInvite).toMatchObject({
      email: 'new-user@example.com',
      role: 'Producer',
      invitedByName: 'Alex',
      message: 'Join our workspace.',
    });
    expect(new Date(savedInvite.expiresAt).toISOString()).toBe('2024-04-15T10:30:00.000Z');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(invites[0]));
  });

  it('creates structured meetings and groups them by date', async () => {
    const meetings = [
      {
        id: 'meet-1',
        title: 'Kickoff',
        agenda: 'Discuss scope',
        startAt: '2024-05-05T14:00:00.000Z',
        endAt: '2024-05-05T15:00:00.000Z',
        location: 'Zoom',
        meetingUrl: 'https://example.com/meet',
        hostName: 'Amal',
        status: 'scheduled',
        attendees: ['Amal', 'Jordan'],
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceMeetingManager meetings={meetings} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText(/Meetings & project calendar/)).toBeInTheDocument();
    expect(screen.getAllByText('Kickoff').length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText('Title'), 'Weekly sync');
    await user.type(screen.getByLabelText('Agenda'), 'Review blockers');
    await user.type(screen.getByLabelText('Start'), '2024-05-10T09:30');
    await user.type(screen.getByLabelText('End'), '2024-05-10T10:00');
    await user.type(screen.getByLabelText('Location / URL'), 'Conference room');
    await user.type(screen.getByLabelText('Meeting URL'), 'https://example.com/sync');
    await user.type(screen.getByLabelText('Host name'), 'Priya');
    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.type(screen.getByLabelText('Attendees (comma separated)'), 'Priya, Nolan');
    await user.type(screen.getByLabelText('Notes'), 'Share sprint review.');
    await user.type(screen.getByLabelText('Recording URL'), 'https://example.com/sync-recording');

    await user.click(screen.getByRole('button', { name: 'Schedule meeting' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedMeeting = onSave.mock.calls[0][0];
    expect(savedMeeting).toMatchObject({
      title: 'Weekly sync',
      attendees: ['Priya', 'Nolan'],
      status: 'completed',
    });
    expect(new Date(savedMeeting.startAt).toISOString()).toBe('2024-05-10T09:30:00.000Z');
    expect(new Date(savedMeeting.endAt).toISOString()).toBe('2024-05-10T10:00:00.000Z');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(meetings[0]));
  });

  it('renders module dialogs with close controls', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceModuleDialog open onClose={onClose} title="Module" subtitle="Details">
        <p>Module body</p>
      </WorkspaceModuleDialog>,
    );

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(screen.getByText('Module body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('normalises project objects and tracks status distribution', async () => {
    const objects = [
      {
        id: 'obj-1',
        name: 'Homepage redesign',
        objectType: 'deliverable',
        status: 'active',
        ownerName: 'Taylor',
        description: 'Refresh hero section',
        dueAt: '2024-04-10T12:00:00.000Z',
        tags: ['web', 'priority'],
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceObjectManager objects={objects} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText(/Project tasks & deliverables/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'Press kit');
    await user.selectOptions(screen.getByLabelText('Type'), 'asset');
    await user.selectOptions(screen.getByLabelText('Status'), 'completed');
    await user.type(screen.getByLabelText('Owner'), 'Jamie');
    await user.type(screen.getByLabelText('Due date'), '2024-06-01T18:00');
    await user.type(screen.getByLabelText('Tags (comma separated)'), 'press, release');
    await user.type(screen.getByLabelText('Description'), 'Approved by marketing.');

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedObject = onSave.mock.calls[0][0];
    expect(savedObject).toMatchObject({
      name: 'Press kit',
      objectType: 'asset',
      status: 'completed',
      ownerName: 'Jamie',
      tags: ['press', 'release'],
    });
    expect(new Date(savedObject.dueAt).toISOString()).toBe('2024-06-01T18:00:00.000Z');

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(objects[0]));
  });

  it('displays workspace overview metrics and submits brief updates', async () => {
    const onSaveBrief = vi.fn().mockResolvedValue();
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <WorkspaceOverviewSection
        project={{ id: 'p-1', title: 'Project Atlas', status: 'Active', location: 'Remote' }}
        brief={{
          title: 'Project Atlas brief',
          summary: 'Launch new GTM site.',
          objectives: ['Increase leads'],
          deliverables: ['Website redesign'],
          successMetrics: ['Demo bookings'],
          clientStakeholders: ['Dana'],
          currency: 'USD',
        }}
        metrics={{
          progressPercent: 72.5,
          pendingApprovals: 4,
          overdueApprovals: 1,
          unreadMessages: 7,
          budgetAllocated: 25000,
          budgetVariance: 0.04,
          activeContributors: 12,
          automationCoverage: 0.33,
        }}
        onSaveBrief={onSaveBrief}
        onRefresh={onRefresh}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Brief title')).toHaveValue('Project Atlas brief'));
    expect(screen.getByText('72.5%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh data' }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));

    await user.clear(screen.getByLabelText('Brief title'));
    await user.type(screen.getByLabelText('Brief title'), 'Updated Atlas brief');
    await user.click(screen.getByRole('button', { name: 'Save brief' }));

    await waitFor(() => expect(onSaveBrief).toHaveBeenCalledTimes(1));
    expect(onSaveBrief.mock.calls[0][0]).toMatchObject({ title: 'Updated Atlas brief' });
    expect(await screen.findByText('Workspace brief updated successfully.')).toBeInTheDocument();
  });

  it('searches and selects projects with assisted and manual flows', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    searchProjects.mockResolvedValue({
      items: [
        { id: 'proj-100', title: 'Apollo rollout', status: 'Active' },
      ],
    });

    render(<WorkspaceProjectSelector value={null} onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Search projects'), 'Apollo');

    await waitFor(() => expect(searchProjects).toHaveBeenCalledWith('Apollo', expect.objectContaining({ pageSize: 8 })));

    await waitFor(() => expect(screen.getByText('Apollo rollout')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Open workspace' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'proj-100' }));

    await user.clear(screen.getByLabelText('Project ID'));
    await user.type(screen.getByLabelText('Project ID'), '2048');
    await user.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSelect).toHaveBeenCalledWith({ id: '2048', title: '2048' });
  });

  it('normalises permissions and responsibilities when saving roles', async () => {
    const roles = [
      {
        id: 'role-1',
        memberName: 'Sasha',
        email: 'sasha@example.com',
        role: 'Product Manager',
        status: 'active',
        permissions: ['roadmap:manage'],
        responsibilities: ['Backlog grooming'],
        capacityHours: 30,
      },
    ];
    const onSave = vi.fn().mockResolvedValue();
    const onDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkspaceRoleManager roles={roles} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText(/Project roles/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Member name'), 'Aria');
    await user.type(screen.getByLabelText('Email'), 'aria@example.com');
    await user.type(screen.getByLabelText('Role title'), 'QA Lead');
    await user.selectOptions(screen.getByLabelText('Status'), 'pending');
    await user.type(screen.getByLabelText('Permissions (comma separated)'), 'tests:manage, reports:view');
    await user.type(
      screen.getByLabelText('Responsibilities (comma separated)'),
      'Test strategy, Release sign-off',
    );
    await user.type(screen.getByLabelText('Capacity hours'), '25');

    await user.click(screen.getByRole('button', { name: 'Add role' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const savedRole = onSave.mock.calls[0][0];
    expect(savedRole).toMatchObject({
      memberName: 'Aria',
      status: 'pending',
      permissions: ['tests:manage', 'reports:view'],
      responsibilities: ['Test strategy', 'Release sign-off'],
      capacityHours: 25,
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(roles[0]));
  });
});
