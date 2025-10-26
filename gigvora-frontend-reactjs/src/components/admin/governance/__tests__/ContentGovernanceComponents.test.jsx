import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ContentApprovalQueue from '../ContentApprovalQueue.jsx';
import PolicyEditor from '../PolicyEditor.jsx';
import ModerationActions from '../ModerationActions.jsx';

const BASE_ITEM = {
  id: 'item-1',
  title: 'Pending article submission',
  summary: 'Explores professional networking etiquette for remote teams.',
  author: { name: 'Alicia Daniels' },
  channel: 'editorial',
  submittedAt: '2024-05-01T10:00:00.000Z',
  severity: 'high',
  status: 'pending',
  riskScore: 72,
  reviewers: [{ id: 1, name: 'Morgan' }],
  flags: [
    { code: 'LANGUAGE', message: 'Potentially aggressive tone detected.' },
  ],
  attachments: [
    { id: 'att-1', label: 'Screenshot evidence', url: 'https://example.com' },
  ],
  timeline: [
    { id: 'evt-1', actor: 'Auto-moderation', summary: 'Queued for review', timestamp: '2024-05-01T10:05:00.000Z' },
  ],
};

const SECOND_ITEM = {
  ...BASE_ITEM,
  id: 'item-2',
  title: 'Mentorship event recap',
  severity: 'medium',
  riskScore: 41,
  submittedAt: '2024-05-01T09:00:00.000Z',
};

describe('ContentApprovalQueue', () => {
  it('renders queue insights, supports selection, and triggers bulk actions', async () => {
    const onBulkAction = vi.fn();
    const onItemSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ContentApprovalQueue
        items={[BASE_ITEM, SECOND_ITEM]}
        guidelines={[
          { id: 'guide-1', title: 'Community Guidelines', description: 'Uphold respectful discourse.' },
        ]}
        slaMinutes={45}
        onBulkAction={onBulkAction}
        onItemSelect={onItemSelect}
      />,
    );

    expect(screen.getByText(/Approval control tower/i)).toBeInTheDocument();
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
    expect(onItemSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }));

    const [queueCardTitle] = screen.getAllByText('Pending article submission');
    await user.click(queueCardTitle);
    await screen.findByText('1 selected');

    const approveButton = screen.getByRole('button', { name: /Approve selected/i });
    expect(approveButton).not.toBeDisabled();
    await user.click(approveButton);

    expect(onBulkAction).toHaveBeenCalledWith(
      'approve',
      expect.arrayContaining([expect.objectContaining({ id: 'item-1' })]),
    );
  });
});

describe('PolicyEditor', () => {
  it('surfaces version metadata and forwards edits to handlers', async () => {
    const onChange = vi.fn();
    const onSaveDraft = vi.fn();
    const user = userEvent.setup();

    render(
      <PolicyEditor
        title="Acceptable use policy"
        value="Be respectful."
        onChange={onChange}
        versions={[
          {
            id: 'v1',
            title: 'Draft v1',
            content: 'Be respectful.',
            createdAt: '2024-05-01T12:00:00.000Z',
            summary: 'Baseline policy',
          },
        ]}
        approvals={[{ id: 'ap-1', name: 'Chief Legal Officer', role: 'Approver', status: 'pending', dueAt: '2024-05-03' }]}
        guidance={[{ id: 'g-1', title: 'Tone guidance', description: 'Lead with clarity and empathy.', snippet: 'Communicate with empathy.' }]}
        tags={['compliance', 'policy']}
        onSaveDraft={onSaveDraft}
      />,
    );

    const [editorTextarea] = screen.getAllByRole('textbox');
    await user.type(editorTextarea, ' Operate fairly.');

    expect(onChange).toHaveBeenLastCalledWith('Be respectful. Operate fairly.');

    await user.click(screen.getByRole('button', { name: /Save draft/i }));
    expect(onSaveDraft).toHaveBeenCalledWith('Be respectful. Operate fairly.', expect.any(Object));
  });
});

describe('ModerationActions', () => {
  it('shows templates, history and executes actions with context payload', async () => {
    const onExecute = vi.fn();
    const user = userEvent.setup();

    render(
      <ModerationActions
        subject={{
          title: 'Flagged stream clip',
          summary: 'Contains potential harassment cues.',
          riskScore: 92,
          reports: 5,
          aiSignals: [{ id: 'ml-1' }],
          guidelines: [{ id: 'gd-1', title: 'Harassment policy', description: 'Zero tolerance for abuse.' }],
          signals: [
            { id: 'sig-1', label: 'Violence indicators', description: 'Language flagged by ML.', score: '88', level: 'critical' },
          ],
        }}
        templates={[
          { id: 'tpl-1', name: 'Immediate suspension', description: 'Suspend for 72 hours.', metrics: [{ label: 'Success', value: '92%' }] },
        ]}
        history={[{ id: 'h1', actor: 'Moderator', action: 'flagged', notes: 'Escalated from auto mod', timestamp: '2024-05-01T09:00:00.000Z' }]}
        analytics={[{ label: 'Resolution SLA', value: '12m', progress: 80 }]}
        onExecute={onExecute}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Approve/i }));

    expect(onExecute).toHaveBeenCalledWith(
      'approve',
      expect.objectContaining({
        subject: expect.objectContaining({ title: 'Flagged stream clip' }),
      }),
    );
    expect(screen.getByText(/Harassment policy/)).toBeInTheDocument();
    expect(screen.getByText(/Immediate suspension/)).toBeInTheDocument();
    expect(screen.getByText(/Resolution SLA/)).toBeInTheDocument();
  });
});

