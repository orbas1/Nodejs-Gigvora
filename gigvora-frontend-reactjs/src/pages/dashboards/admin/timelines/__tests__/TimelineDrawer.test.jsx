import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineDrawer from '../TimelineDrawer.jsx';

function renderDrawer(overrides = {}) {
  const onSubmit = vi.fn();
  render(
    <TimelineDrawer
      open
      mode="create"
      initialValue={null}
      onClose={() => {}}
      onSubmit={onSubmit}
      busy={false}
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe('TimelineDrawer', () => {
  it('validates required fields and submits form data', async () => {
    const { onSubmit } = renderDrawer();

    const saveButton = await screen.findByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText(/name is required/i)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/name/i), '  Launch Plan  ');
    await userEvent.type(screen.getByLabelText(/slug/i), 'Launch-Plan');
    await userEvent.type(screen.getByLabelText(/summary/i), '  Summary ');

    await userEvent.click(saveButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const form = onSubmit.mock.calls[0][0];
    expect(form).toMatchObject({
      name: '  Launch Plan  ',
      slug: 'launch-plan',
      summary: '  Summary ',
      status: 'draft',
      visibility: 'internal',
    });
  });
});
