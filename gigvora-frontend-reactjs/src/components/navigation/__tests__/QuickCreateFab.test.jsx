import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import QuickCreateFab from '../QuickCreateFab.jsx';

function renderFab(props = {}) {
  return render(<QuickCreateFab {...props} />);
}

describe('QuickCreateFab', () => {
  it('opens the menu, focuses the first action, and highlights the recommended badge', async () => {
    const user = userEvent.setup();

    renderFab();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });

    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();

    const firstAction = within(menu).getByRole('menuitem', { name: /launch a gig/i });
    await waitFor(() => {
      expect(firstAction).toHaveFocus();
    });
    expect(within(firstAction).getByText(/recommended/i)).toBeInTheDocument();
    expect(within(firstAction).getByText(/craft a premium gig brief/i)).toBeInTheDocument();
  });

  it('invokes navigation, onAction, and custom selection handlers', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const onNavigate = vi.fn();
    const customSelect = vi.fn().mockResolvedValue();

    const actions = [
      {
        id: 'share-update',
        label: 'Share an update',
        description: 'Publish a multimedia post',
        icon: 'megaphone',
        tone: 'sky',
        href: '/feed/new',
      },
      {
        id: 'schedule-review',
        label: 'Schedule a review',
        description: 'Book a review session',
        icon: 'calendar',
        tone: 'amber',
        onSelect: customSelect,
        badge: 'Live',
      },
    ];

    renderFab({ actions, defaultActionId: 'schedule-review', onAction, onOpenChange, onNavigate });

    // initial effect fires with closed state
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    const firstAction = await screen.findByRole('menuitem', { name: /share an update/i });

    await act(async () => {
      await user.click(firstAction);
    });

    expect(onNavigate).toHaveBeenCalledWith('/feed/new', expect.objectContaining({ id: 'share-update' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'share-update' }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    const secondAction = await screen.findByRole('menuitem', { name: /schedule a review/i });

    await act(async () => {
      await user.click(secondAction);
    });

    expect(customSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'schedule-review' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'schedule-review' }));
  });

  it('supports keyboard navigation and escape dismissal', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    renderFab({
      initialOpen: true,
      onOpenChange,
      actions: [
        { id: 'action-one', label: 'Action one', description: 'One', icon: 'briefcase', tone: 'violet' },
        { id: 'action-two', label: 'Action two', description: 'Two', icon: 'lifebuoy', tone: 'emerald' },
        { id: 'action-three', label: 'Action three', description: 'Three', icon: 'sparkles', tone: 'sky' },
      ],
    });

    try {
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });

      const actions = screen.getAllByRole('menuitem');
      expect(actions).toHaveLength(3);

      await waitFor(() => {
        expect(actions[0]).toHaveFocus();
      });

      const initialFocusCalls = focusSpy.mock.calls.length;
      await act(async () => {
        fireEvent.keyDown(actions[0], { key: 'ArrowDown', code: 'ArrowDown' });
      });
      await waitFor(() => {
        expect(focusSpy.mock.calls.length).toBeGreaterThan(initialFocusCalls);
        expect(focusSpy.mock.instances.at(-1)).toBe(actions[1]);
      });

      const afterDownCalls = focusSpy.mock.calls.length;
      await act(async () => {
        fireEvent.keyDown(actions[1], { key: 'End', code: 'End' });
      });
      await waitFor(() => {
        expect(focusSpy.mock.calls.length).toBeGreaterThan(afterDownCalls);
        expect(focusSpy.mock.instances.at(-1)).toBe(actions[2]);
      });

      const afterEndCalls = focusSpy.mock.calls.length;
      await act(async () => {
        fireEvent.keyDown(actions[2], { key: 'Home', code: 'Home' });
      });
      await waitFor(() => {
        expect(focusSpy.mock.calls.length).toBeGreaterThan(afterEndCalls);
        expect(focusSpy.mock.instances.at(-1)).toBe(actions[0]);
      });

      const afterHomeCalls = focusSpy.mock.calls.length;
      await act(async () => {
        fireEvent.keyDown(actions[0], { key: 'ArrowUp', code: 'ArrowUp' });
      });
      await waitFor(() => {
        expect(focusSpy.mock.calls.length).toBeGreaterThan(afterHomeCalls);
        expect(focusSpy.mock.instances.at(-1)).toBe(actions[2]);
      });

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    } finally {
      focusSpy.mockRestore();
    }
  });
});
