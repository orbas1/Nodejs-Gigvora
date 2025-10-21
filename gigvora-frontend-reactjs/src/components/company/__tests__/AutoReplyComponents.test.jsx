import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AutoReplySettingsForm from '../auto-reply/AutoReplySettingsForm.jsx';
import AutoReplyTemplateForm from '../auto-reply/AutoReplyTemplateForm.jsx';
import AutoReplyTemplatesTable from '../auto-reply/AutoReplyTemplatesTable.jsx';
import ByokCredentialCard from '../auto-reply/ByokCredentialCard.jsx';
import {
  CHANNEL_OPTIONS,
  STATUS_OPTIONS,
  TONE_OPTIONS,
  normalizeTemplate,
} from '../auto-reply/templateOptions.js';

const sampleTemplate = {
  id: 'tmpl-1',
  title: 'Interview follow up',
  summary: 'Send friendly follow up after interviews.',
  tone: 'friendly',
  instructions: 'Thank the candidate and share next steps.',
  sampleReply: 'Thanks for meeting with us today…',
  channels: ['direct', 'support'],
  temperature: 0.45,
  status: 'active',
  isDefault: true,
  updatedAt: '2030-03-15T10:00:00.000Z',
};

describe('Auto reply components', () => {
  it('saves auto reply settings and surfaces feedback', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });

    render(
      <AutoReplySettingsForm
        settings={{
          model: 'gpt-4o-mini',
          autoReplies: {
            enabled: true,
            instructions: 'Respond with warmth.',
            channels: ['direct'],
            temperature: 0.5,
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByLabelText(/support cases/i));
    await user.selectOptions(screen.getByLabelText(/^model$/i), 'gpt-4o');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        model: 'gpt-4o',
        autoReplies: {
          enabled: true,
          instructions: 'Respond with warmth.',
          channels: ['direct', 'support'],
          temperature: 0.5,
        },
      });
    });

    expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
  });

  it('shows errors when saving auto reply settings fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network down'));

    render(<AutoReplySettingsForm settings={null} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });

  it('walks through template form steps and submits data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });

    render(<AutoReplyTemplateForm mode="create" onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/^Title$/i), 'Scheduling response');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.type(screen.getByLabelText(/^Instructions$/i), 'Keep the tone upbeat.');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Scheduling response',
          instructions: 'Keep the tone upbeat.',
          channels: expect.arrayContaining(['direct', 'support']),
        }),
      );
    });
  });

  it('handles delete errors in template form', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue(new Error('Unable to remove template.'));

    render(
      <AutoReplyTemplateForm
        mode="edit"
        initialValue={sampleTemplate}
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Delete$/i }));

    expect(await screen.findByText('Unable to remove template.')).toBeInTheDocument();
  });

  it('manages templates collection with create and update flows', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ id: 'tmpl-new' });
    const onUpdate = vi.fn().mockResolvedValue({ ok: true });

    render(
      <AutoReplyTemplatesTable
        templates={[sampleTemplate]}
        onCreate={onCreate}
        onUpdate={onUpdate}
        busy={{}}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^New$/i }));
    await user.type(screen.getByLabelText(/^Title$/i), 'Offer approval');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.type(screen.getByLabelText(/^Instructions$/i), 'Confirm offer and share onboarding steps.');
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Offer approval', instructions: 'Confirm offer and share onboarding steps.' }),
      );
    });

    await user.click(screen.getByRole('button', { name: /interview follow up/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        'tmpl-1',
        expect.objectContaining({ title: 'Interview follow up' }),
      );
    });

    expect(screen.getByText(/template updated/i)).toBeInTheDocument();
  });

  it('updates and tests BYOK credentials', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    const onTest = vi.fn().mockResolvedValue({ reply: 'All good' });

    render(
      <ByokCredentialCard
        settings={{
          apiKey: { fingerprint: 'fp-123', updatedAt: '2030-03-01T10:00:00.000Z' },
          connection: { baseUrl: 'https://api.openai.com/v1', lastTestedAt: '2030-03-02T10:00:00.000Z' },
        }}
        onSubmit={onSubmit}
        onTest={onTest}
      />,
    );

    await user.type(screen.getByPlaceholderText(/leave blank to keep current key/i), 'sk-test');
    await user.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        connection: { baseUrl: 'https://api.openai.com/v1', workspaceId: null },
        apiKey: 'sk-test',
        workspaceId: null,
      });
    });

    await user.click(screen.getByRole('button', { name: /^Test$/i }));
    await waitFor(() => {
      expect(onTest).toHaveBeenCalled();
    });

    expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
  });

  it('normalises template defaults with sensible fallbacks', () => {
    const result = normalizeTemplate({
      title: 'Follow up',
      channels: [],
      temperature: 3,
    });

    expect(result.channels).toEqual(['direct', 'support']);
    expect(result.temperature).toBe(2);
    expect(result.status).toBe('active');
  });

  it('exposes template configuration constants', () => {
    expect(CHANNEL_OPTIONS.map((option) => option.value)).toContain('direct');
    expect(STATUS_OPTIONS.find((option) => option.value === 'draft')).toBeTruthy();
    expect(TONE_OPTIONS).toContain('Friendly');
  });
});
