import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import CreationStudioWizard from '../CreationStudioWizard.jsx';

describe('CreationStudioWizard', () => {
  it('creates a draft after selecting a template', async () => {
    const onCreateDraft = vi.fn().mockResolvedValue({ id: 'draft-1', type: 'gig', steps: [] });
    const onUpdateDraft = vi.fn();
    const onSaveStep = vi.fn();
    const onShare = vi.fn();
    const onSelectItem = vi.fn();
    const onRefresh = vi.fn();

    const user = userEvent.setup();
    render(
      <CreationStudioWizard
        catalog={[{ type: 'gig', label: 'Gig', summary: 'Sample summary', recommendedVisibility: 'public' }]}
        shareDestinations={[]}
        summary={{ drafts: 0 }}
        activeItem={null}
        onCreateDraft={onCreateDraft}
        onUpdateDraft={onUpdateDraft}
        onSaveStep={onSaveStep}
        onShare={onShare}
        onSelectItem={onSelectItem}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();

    await user.click(screen.getAllByRole('button', { name: /gig/i })[0]);
    await user.type(screen.getByLabelText(/working title/i), 'Rapid service');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(onCreateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gig',
          title: 'Rapid service',
          status: 'draft',
        }),
      );
    });

    expect(onSelectItem).toHaveBeenCalledWith('draft-1');
    expect(onRefresh).toHaveBeenCalled();
    expect(onUpdateDraft).not.toHaveBeenCalled();
    expect(onSaveStep).not.toHaveBeenCalled();
    expect(onShare).not.toHaveBeenCalled();
  });
});

