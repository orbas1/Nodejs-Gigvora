import { useRef, useState } from 'react';
import { vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileHubNav from '../workspace/ProfileHubNav.jsx';
import ProfileHubInfoPanel from '../workspace/ProfileHubInfoPanel.jsx';
import ProfileHubPhotoPanel from '../workspace/ProfileHubPhotoPanel.jsx';
import ProfileHubLinksPanel from '../workspace/ProfileHubLinksPanel.jsx';
import ProfileHubFollowersPanel from '../workspace/ProfileHubFollowersPanel.jsx';
import ProfileHubFollowerDialog from '../workspace/ProfileHubFollowerDialog.jsx';
import ProfileHubConnectionsPanel from '../workspace/ProfileHubConnectionsPanel.jsx';
import ProfileHubConnectionDialog from '../workspace/ProfileHubConnectionDialog.jsx';

const StubIcon = () => <svg data-testid="icon" />;

describe('Profile hub workspace panels', () => {
  it('invokes nav selection callbacks', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileHubNav
        panels={[
          { id: 'info', label: 'Info', icon: StubIcon },
          { id: 'photo', label: 'Photo', icon: StubIcon },
        ]}
        activePanelId="info"
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Photo' }));
    expect(onSelect).toHaveBeenCalledWith('photo');
  });

  it('emits info panel changes and save requests', async () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onOpenAdvanced = vi.fn();
    const user = userEvent.setup();

    function InfoWrapper() {
      const [draft, setDraft] = useState({
        headline: 'Product lead',
        location: 'Berlin',
        timezone: 'Europe/Berlin',
        missionStatement: 'Build better tools',
        bio: 'Product leader',
        profileVisibility: 'members',
        networkVisibility: 'connections',
        followersVisibility: 'connections',
      });

      return (
        <ProfileHubInfoPanel
          draft={draft}
          onChange={(key, value) => {
            onChange(key, value);
            setDraft((previous) => ({ ...previous, [key]: value }));
          }}
          onSave={onSave}
          saving={false}
          onOpenAdvanced={onOpenAdvanced}
        />
      );
    }

    render(<InfoWrapper />);

    const headlineInput = screen.getByLabelText('Name headline');
    await act(async () => {
      await user.clear(headlineInput);
    });
    await act(async () => {
      await user.type(headlineInput, 'Chief Product Officer');
    });
    expect(onChange.mock.calls.at(-1)).toEqual(['headline', 'Chief Product Officer']);

    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /advanced editor/i }));
    expect(onOpenAdvanced).toHaveBeenCalledTimes(1);
  });

  it('forwards photo panel actions', async () => {
    const user = userEvent.setup();
    const onAvatarDraftChange = vi.fn();
    const onSelectFile = vi.fn();
    const onApplyUrl = vi.fn();

    function PhotoWrapper() {
      const [avatarUrlDraft, setAvatarUrlDraft] = useState('');
      const fileInputRef = useRef(null);

      return (
        <ProfileHubPhotoPanel
          profile={{ name: 'Jordan', avatarUrl: 'https://cdn.example.com/avatar.png' }}
          avatarUrlDraft={avatarUrlDraft}
          onAvatarDraftChange={(value) => {
            onAvatarDraftChange(value);
            setAvatarUrlDraft(value);
          }}
          onSelectFile={onSelectFile}
          onApplyUrl={onApplyUrl}
          saving={false}
          fileInputRef={fileInputRef}
        />
      );
    }

    const { container } = render(<PhotoWrapper />);

    const urlInput = screen.getByPlaceholderText('https://');
    await act(async () => {
      await user.type(urlInput, 'https://images.example.com/new.png');
    });
    expect(onAvatarDraftChange.mock.calls.at(-1)[0]).toBe('https://images.example.com/new.png');

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);
    expect(onApplyUrl).toHaveBeenCalledTimes(1);

    const fileInput = container.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [new File(['data'], 'avatar.png', { type: 'image/png' })] } });
    expect(onSelectFile).toHaveBeenCalledTimes(1);
  });

  it('handles link panel edits, additions, and removals', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function LinksWrapper() {
      const [links, setLinks] = useState([
        { id: 'link-1', label: 'Website', url: 'https://example.com', description: 'Site' },
      ]);

      return (
        <ProfileHubLinksPanel
          links={links}
          onChange={(next) => {
            onChange(next);
            setLinks(next);
          }}
          disabled={false}
        />
      );
    }

    render(<LinksWrapper />);

    const labelInput = screen.getByLabelText('Label');
    await act(async () => {
      await user.type(labelInput, ' Hub');
    });
    expect(onChange.mock.calls.at(-1)[0]).toEqual([
      { id: 'link-1', label: 'Website Hub', url: 'https://example.com', description: 'Site' },
    ]);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /add link/i }));
    });
    expect(onChange.mock.calls.at(-1)[0]).toEqual([
      { id: 'link-1', label: 'Website Hub', url: 'https://example.com', description: 'Site' },
      expect.objectContaining({ label: '', url: '', description: '' }),
    ]);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await act(async () => {
      await user.click(removeButtons[removeButtons.length - 1]);
    });
    expect(onChange.mock.calls.at(-1)[0]).toEqual([
      { id: 'link-1', label: 'Website Hub', url: 'https://example.com', description: 'Site' },
    ]);
  });

  it('tracks follower panel interactions', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onOpenFollower = vi.fn();
    const onRemove = vi.fn();
    const onChangeAddForm = vi.fn();

    function FollowersWrapper() {
      const [form, setForm] = useState({
        identifier: 'ally@example.com',
        displayName: 'Ally',
        tags: 'alpha',
        notes: 'Met at summit',
      });

      return (
        <ProfileHubFollowersPanel
          stats={{ total: 2, active: 1, muted: 1, blocked: 0 }}
          followers={[
            {
              followerId: 'fol-1',
              status: 'active',
              lastInteractedAt: '2024-01-11T00:00:00Z',
              summary: { name: 'Taylor', headline: 'Engineer' },
            },
          ]}
          addForm={form}
          onChangeAddForm={(next) => {
            onChangeAddForm(next);
            setForm(next);
          }}
          onAdd={onAdd}
          onOpenFollower={onOpenFollower}
          onRemove={onRemove}
        />
      );
    }

    render(<FollowersWrapper />);

    const emailInput = screen.getByLabelText('Email or ID');
    await act(async () => {
      await user.clear(emailInput);
    });
    await act(async () => {
      await user.type(emailInput, 'mentor@example.com');
    });
    expect(onChangeAddForm.mock.calls.at(-1)[0]).toEqual(
      expect.objectContaining({ identifier: 'mentor@example.com' }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^add$/i }));
    });
    expect(onAdd).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^open$/i }));
    expect(onOpenFollower).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /^remove$/i }));
    expect(onRemove).toHaveBeenCalledWith('fol-1');
  });

  it('submits follower dialog updates', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProfileHubFollowerDialog
        open
        follower={{
          followerId: 'fol-1',
          status: 'active',
          displayName: 'Taylor',
          tags: ['alpha'],
          notes: 'Met at summit',
          notificationsEnabled: true,
          lastInteractedAt: '2024-01-11T00:00:00Z',
          summary: { name: 'Taylor', headline: 'Engineer' },
        }}
        onClose={vi.fn()}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    const displayInput = screen.getByLabelText('Display name');
    await act(async () => {
      await user.type(displayInput, ' Lynn');
    });
    await act(async () => {
      await user.click(screen.getByRole('switch'));
    });
    fireEvent.change(screen.getByLabelText('Last touch'), { target: { value: '2024-02-01' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        followerId: 'fol-1',
        displayName: 'Taylor Lynn',
        notificationsEnabled: false,
        lastInteractedAt: '2024-02-01',
      }),
    );

    await user.click(screen.getByRole('button', { name: /remove follower/i }));
    expect(onDelete).toHaveBeenCalledWith('fol-1');
  });

  it('relays connection panel events', async () => {
    const user = userEvent.setup();
    const onToggleFavourite = vi.fn();
    const onOpenConnection = vi.fn();

    render(
      <ProfileHubConnectionsPanel
        connections={[
          {
            id: 'con-1',
            favourite: false,
            relationshipTag: 'Partner',
            lastInteractedAt: '2024-01-10T00:00:00Z',
            visibility: 'connections',
            notes: 'Quarterly sync',
            counterpart: { name: 'Alex Doe', headline: 'Founder' },
          },
        ]}
        pending={[]}
        onOpenConnection={onOpenConnection}
        onToggleFavourite={onToggleFavourite}
        busyId={null}
      />,
    );

    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: /^star/i })[0]);
    });
    expect(onToggleFavourite).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'con-1' }),
    );

    await user.click(screen.getAllByRole('button', { name: /^open$/i })[0]);
    expect(onOpenConnection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'con-1' }),
    );
  });

  it('submits connection dialog edits', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <ProfileHubConnectionDialog
        open
        connection={{
          id: 'con-1',
          relationshipTag: 'Partner',
          notes: 'Quarterly sync',
          favourite: false,
          visibility: 'connections',
          lastInteractedAt: '2024-01-10T00:00:00Z',
          counterpart: { name: 'Alex Doe', headline: 'Founder' },
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    const relationshipInput = screen.getByLabelText('Relationship tag');
    await act(async () => {
      await user.type(relationshipInput, ' Plus');
    });
    await act(async () => {
      await user.click(screen.getByRole('switch'));
    });
    fireEvent.change(screen.getByLabelText('Last touch'), { target: { value: '2024-02-01' } });

    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: 'con-1',
        relationshipTag: 'Partner Plus',
        favourite: true,
        lastInteractedAt: '2024-02-01',
      }),
    );
  });
});
