import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import BudgetManagementTab from '../BudgetManagementTab.jsx';
import CalendarTab from '../CalendarTab.jsx';
import DeliverablesTab from '../DeliverablesTab.jsx';
import FileManagerTab from '../FileManagerTab.jsx';
import GanttChartTab from '../GanttChartTab.jsx';
import HrManagementTab from '../HrManagementTab.jsx';
import InvitationsTab from '../InvitationsTab.jsx';
import MeetingsTab from '../MeetingsTab.jsx';
import ProjectChatTab from '../ProjectChatTab.jsx';

describe('BudgetManagementTab', () => {
  it('creates a budget line entry with numeric values', async () => {
    const actions = {
      createBudgetLine: vi.fn().mockResolvedValue(),
      updateBudgetLine: vi.fn(),
      deleteBudgetLine: vi.fn(),
    };

    render(
      <BudgetManagementTab
        project={{ id: 99, budgetCurrency: 'USD', budgetLines: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'New line' }));
    });
    const dialog = await screen.findByRole('dialog', { name: 'New budget line' });

    await userEvent.type(within(dialog).getByLabelText('Label'), 'Design sprint');
    await userEvent.type(within(dialog).getByLabelText('Planned amount'), '15000');
    await userEvent.type(within(dialog).getByLabelText('Actual amount'), '12000');
    await userEvent.type(within(dialog).getByLabelText('Owner'), '42');
    await userEvent.type(within(dialog).getByLabelText('Notes'), 'Brand initiative');
    await act(async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save line' }));
    });

    await waitFor(() => expect(actions.createBudgetLine).toHaveBeenCalledTimes(1));
    expect(actions.createBudgetLine.mock.calls[0]).toEqual([
      99,
      {
        label: 'Design sprint',
        category: 'Operations',
        plannedAmount: 15000,
        actualAmount: 12000,
        currency: 'USD',
        status: 'planned',
        ownerId: 42,
        notes: 'Brand initiative',
      },
    ]);
  });
});

describe('CalendarTab', () => {
  it('creates calendar events and parses metadata', async () => {
    const actions = {
      createCalendarEvent: vi.fn().mockResolvedValue(),
      updateCalendarEvent: vi.fn(),
      deleteCalendarEvent: vi.fn(),
    };

    render(
      <CalendarTab
        project={{ id: 7, calendarEvents: [] }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.type(screen.getByLabelText('Title'), 'Client kickoff');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'event');
    await userEvent.type(screen.getByLabelText('Starts'), '2024-04-10T09:00');
    await userEvent.type(screen.getByLabelText('Ends'), '2024-04-10T10:00');
    await userEvent.type(screen.getByLabelText('Location'), 'HQ Boardroom');
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Metadata (JSON)'), {
        target: { value: '{"stream":"Zoom"}' },
      });
    });
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Add event' }));
    });

    await waitFor(() => expect(actions.createCalendarEvent).toHaveBeenCalledTimes(1));
    expect(actions.createCalendarEvent.mock.calls[0]).toEqual([
      7,
      expect.objectContaining({
        title: 'Client kickoff',
        location: 'HQ Boardroom',
        metadata: { stream: 'Zoom' },
        allDay: false,
      }),
    ]);
  });
});

describe('DeliverablesTab', () => {
  it('records a deliverable asset for the workspace', async () => {
    const actions = {
      createDeliverable: vi.fn().mockResolvedValue(),
      updateDeliverable: vi.fn(),
      deleteDeliverable: vi.fn(),
    };

    render(
      <DeliverablesTab
        project={{ id: 5, deliverables: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'New asset' }));
    });
    const dialog = await screen.findByRole('dialog', { name: 'New asset' });

    await userEvent.type(within(dialog).getByLabelText('Title'), 'Brand guidelines');
    await userEvent.type(within(dialog).getByLabelText('Description'), 'Visual identity pack');
    await userEvent.selectOptions(within(dialog).getByLabelText('Status'), 'approved');
    await userEvent.type(within(dialog).getByLabelText('Due date'), '2024-05-01');
    await userEvent.type(within(dialog).getByLabelText('Submission link'), 'https://files.gigvora.com/brand.pdf');
    await act(async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save asset' }));
    });

    await waitFor(() => expect(actions.createDeliverable).toHaveBeenCalledTimes(1));
    expect(actions.createDeliverable.mock.calls[0]).toEqual([
      5,
      {
        title: 'Brand guidelines',
        description: 'Visual identity pack',
        status: 'approved',
        dueDate: '2024-05-01',
        submissionUrl: 'https://files.gigvora.com/brand.pdf',
      },
    ]);
  });
});

describe('FileManagerTab', () => {
  it('stores file metadata and reports usage', async () => {
    const actions = {
      createFile: vi.fn().mockResolvedValue(),
      updateFile: vi.fn(),
      deleteFile: vi.fn(),
    };

    render(
      <FileManagerTab
        project={{ id: 12, files: [] }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.type(screen.getByLabelText('Label'), 'Contract PDF');
    await userEvent.type(screen.getByLabelText('Storage URL'), 'https://storage.gigvora.com/files/contract.pdf');
    await userEvent.type(screen.getByLabelText('File type'), 'application/pdf');
    await userEvent.type(screen.getByLabelText('File size (bytes)'), '2048');
    await userEvent.type(screen.getByLabelText('Uploaded by'), 'Taylor');
    await userEvent.selectOptions(screen.getByLabelText('Visibility'), 'client');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Save file' }));
    });

    await waitFor(() => expect(actions.createFile).toHaveBeenCalledTimes(1));
    expect(actions.createFile.mock.calls[0]).toEqual([
      12,
      {
        label: 'Contract PDF',
        storageUrl: 'https://storage.gigvora.com/files/contract.pdf',
        fileType: 'application/pdf',
        sizeBytes: 2048,
        uploadedBy: 'Taylor',
        visibility: 'client',
      },
    ]);
  });
});

describe('GanttChartTab', () => {
  it('adds task dependency records', async () => {
    const actions = {
      createTaskDependency: vi.fn().mockResolvedValue(),
      deleteTaskDependency: vi.fn(),
    };

    render(
      <GanttChartTab
        project={{
          id: 22,
          tasks: [
            { id: 1, title: 'Research', startDate: '2024-04-01', dueDate: '2024-04-05', status: 'in_progress' },
            { id: 2, title: 'Design', startDate: '2024-04-06', dueDate: '2024-04-15', status: 'planned' },
          ],
        }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Task'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Depends on'), '2');
    await userEvent.type(screen.getByLabelText('Lag (days)'), '3');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Add dependency' }));
    });

    await waitFor(() => expect(actions.createTaskDependency).toHaveBeenCalledTimes(1));
    expect(actions.createTaskDependency.mock.calls[0]).toEqual([
      22,
      1,
      { dependsOnTaskId: 2, lagDays: 3 },
    ]);
  });
});

describe('HrManagementTab', () => {
  it('captures team member roster details', async () => {
    const actions = {
      createHrRecord: vi.fn().mockResolvedValue(),
      updateHrRecord: vi.fn(),
      deleteHrRecord: vi.fn(),
    };

    render(
      <HrManagementTab
        project={{ id: 33, hrRecords: [] }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.type(screen.getByLabelText('Full name'), 'Jordan Smith');
    await userEvent.type(screen.getByLabelText('Position / role'), 'Product lead');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    await userEvent.type(screen.getByLabelText('Start date'), '2024-04-01');
    await userEvent.type(screen.getByLabelText('Compensation (USD)'), '120000');
    await userEvent.type(screen.getByLabelText('Allocation %'), '80');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Save team member' }));
    });

    await waitFor(() => expect(actions.createHrRecord).toHaveBeenCalledTimes(1));
    expect(actions.createHrRecord.mock.calls[0]).toEqual([
      33,
      {
        fullName: 'Jordan Smith',
        position: 'Product lead',
        status: 'active',
        startDate: '2024-04-01',
        endDate: undefined,
        compensation: 120000,
        allocationPercent: 80,
      },
    ]);
  });
});

describe('InvitationsTab', () => {
  it('sends an invitation with expiry', async () => {
    const actions = {
      createInvitation: vi.fn().mockResolvedValue(),
      updateInvitation: vi.fn(),
      deleteInvitation: vi.fn(),
    };

    render(
      <InvitationsTab
        project={{ id: 55, invitations: [] }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.type(screen.getByLabelText('Email'), 'alex@gigvora.com');
    await userEvent.type(screen.getByLabelText('Role'), 'Client partner');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'pending');
    await userEvent.type(screen.getByLabelText('Invited by'), 'Jordan');
    await userEvent.type(screen.getByLabelText('Expires on'), '2024-05-01');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    });

    await waitFor(() => expect(actions.createInvitation).toHaveBeenCalledTimes(1));
    expect(actions.createInvitation.mock.calls[0]).toEqual([
      55,
      {
        email: 'alex@gigvora.com',
        role: 'Client partner',
        status: 'pending',
        invitedBy: 'Jordan',
        expiresAt: '2024-05-01T00:00:00.000Z',
      },
    ]);
  });
});

describe('MeetingsTab', () => {
  it('schedules a meeting with attendees', async () => {
    const actions = {
      createMeeting: vi.fn().mockResolvedValue(),
      updateMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
    };

    render(
      <MeetingsTab
        project={{ id: 77, meetings: [] }}
        actions={actions}
        canManage
      />,
    );

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'New meeting' }));
    });
    const dialog = await screen.findByRole('dialog', { name: 'Schedule meeting' });

    await userEvent.type(within(dialog).getByLabelText('Title'), 'Sprint demo');
    await userEvent.type(within(dialog).getByLabelText('Start'), '2024-04-12T14:00');
    await userEvent.type(within(dialog).getByLabelText('Duration (minutes)'), '45');
    await userEvent.type(within(dialog).getByLabelText('Location'), 'Zoom');
    await userEvent.type(within(dialog).getByLabelText('Agenda'), 'Review stories');
    await userEvent.type(within(dialog).getByLabelText('Notes'), 'Invite stakeholders');
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Taylor');
    await userEvent.type(within(dialog).getByLabelText('Email'), 'taylor@gigvora.com');
    await userEvent.selectOptions(within(dialog).getByLabelText('Response'), 'accepted');
    await act(async () => {
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save meeting' }));
    });

    await waitFor(() => expect(actions.createMeeting).toHaveBeenCalledTimes(1));
    expect(actions.createMeeting.mock.calls[0]).toEqual([
      77,
      expect.objectContaining({
        title: 'Sprint demo',
        durationMinutes: 45,
        attendees: [
          {
            name: 'Taylor',
            email: 'taylor@gigvora.com',
            role: undefined,
            responseStatus: 'accepted',
          },
        ],
      }),
    ]);
  });
});

describe('ProjectChatTab', () => {
  it('sends and edits messages within a channel', async () => {
    const actions = {
      createChatMessage: vi.fn().mockResolvedValue(),
      updateChatMessage: vi.fn().mockResolvedValue(),
      deleteChatMessage: vi.fn(),
    };

    render(
      <ProjectChatTab
        project={{
          id: 88,
          chat: {
            channels: [{ id: 1, name: 'general' }],
            messages: [
              { id: 21, channelId: 1, authorName: 'Alex', authorRole: 'PM', body: 'Kickoff at 2pm', createdAt: '2024-04-01T09:00:00.000Z' },
            ],
          },
        }}
        actions={actions}
        canManage
      />,
    );

    await userEvent.type(screen.getByLabelText('Display name'), 'Jordan');
    await userEvent.type(screen.getByLabelText('Role or team'), 'Designer');
    await userEvent.type(screen.getByLabelText('Message'), 'Mockups ready for review.');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    });

    await waitFor(() => expect(actions.createChatMessage).toHaveBeenCalledTimes(1));
    expect(actions.createChatMessage.mock.calls[0]).toEqual([
      88,
      {
        channelId: 1,
        authorName: 'Jordan',
        authorRole: 'Designer',
        body: 'Mockups ready for review.',
      },
    ]);

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    const editField = screen.getByLabelText('Edit message');
    await userEvent.clear(editField);
    await userEvent.type(editField, 'Kickoff moved to 3pm.');
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Save message' }));
    });

    await waitFor(() => expect(actions.updateChatMessage).toHaveBeenCalledTimes(1));
    expect(actions.updateChatMessage.mock.calls[0]).toEqual([
      88,
      21,
      { body: 'Kickoff moved to 3pm.' },
    ]);
  });
});
