import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadPresetDrawer from './UploadPresetDrawer.jsx';

describe('UploadPresetDrawer', () => {
  const locations = [
    { id: 1, name: 'Primary site' },
    { id: 2, name: 'Backup site' },
  ];

  it('normalises payload before submitting a new preset', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();

    render(
      <UploadPresetDrawer
        open
        preset={null}
        locations={locations}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        saving={false}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText(/preset name/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/preset name/i), ' Marketing Assets ');
    await user.type(screen.getByLabelText(/description/i), 'Uploads for campaigns');
    await user.type(screen.getByLabelText(/path prefix/i), 'marketing/assets');
    await user.clear(screen.getByLabelText(/max file size/i));
    await user.type(screen.getByLabelText(/max file size/i), '250');
    await user.type(screen.getByLabelText(/allowed mime types/i), 'image/png, image/jpeg ');
    await user.type(screen.getByLabelText(/allowed roles/i), 'admin, marketing');
    await user.click(screen.getByLabelText(/flag uploads for moderation review/i));
    await user.selectOptions(screen.getByLabelText(/encryption mode/i), ['sse-kms']);
    await user.type(screen.getByLabelText(/signed url expiry/i), '60');

    await user.click(screen.getByRole('button', { name: /create preset/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        name: 'Marketing Assets',
        description: 'Uploads for campaigns',
        pathPrefix: 'marketing/assets',
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        allowedRoles: ['admin', 'marketing'],
        maxSizeMb: 250,
        requireModeration: true,
        encryption: 'sse-kms',
        expiresAfterMinutes: 60,
        active: true,
      }),
    );
  });

  it('prefills form values when editing and supports deletion', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue();

    render(
      <UploadPresetDrawer
        open
        preset={{
          id: 10,
          locationId: 2,
          name: 'Existing preset',
          allowedMimeTypes: ['application/pdf'],
          requireModeration: true,
        }}
        locations={locations}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        saving={false}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue('Existing preset')).toBeInTheDocument());

    expect(screen.getByLabelText(/site/i)).toBeDisabled();
    expect(screen.getByLabelText(/allowed mime types/i)).toHaveValue('application/pdf');

    await user.click(screen.getByRole('button', { name: /delete preset/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });
});
