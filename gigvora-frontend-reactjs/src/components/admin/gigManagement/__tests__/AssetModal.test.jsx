import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetModal from '../AssetModal.jsx';

describe('AssetModal', () => {
  it('submits a normalized payload for the selected project', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();

    render(
      <AssetModal
        open
        projects={[
          { id: 1, title: 'Launch Story' },
          { id: 2, title: 'QA Sprint' },
        ]}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    await screen.findByRole('heading', { name: /add asset/i });

    await user.selectOptions(screen.getByLabelText(/project/i), '2');
    await user.type(screen.getByLabelText(/label/i), 'Storyboard');
    await user.type(screen.getByLabelText(/category/i), 'Design');
    await user.selectOptions(screen.getByLabelText(/permission/i), 'restricted');
    await user.type(screen.getByLabelText(/storage url/i), 'https://cdn.example.com/storyboard.pdf');
    await user.type(screen.getByLabelText(/thumbnail/i), 'https://cdn.example.com/thumb.png');
    await user.type(screen.getByLabelText(/size \(bytes\)/i), '4096');
    await user.click(screen.getByLabelText(/watermark/i));
    await user.type(screen.getByLabelText(/notes/i), 'Provide on project kickoff.');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(2, {
        label: 'Storyboard',
        category: 'Design',
        storageUrl: 'https://cdn.example.com/storyboard.pdf',
        thumbnailUrl: 'https://cdn.example.com/thumb.png',
        permissionLevel: 'restricted',
        sizeBytes: 4096,
        watermarkEnabled: false,
        metadata: { notes: 'Provide on project kickoff.' },
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
