import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventLibrary from '../EventLibrary.jsx';

vi.mock('@headlessui/react', () => {
  const renderChild = (child) => (typeof child === 'function' ? child({}) : child);
  const Menu = ({ children }) => <div>{children}</div>;
  Menu.Button = ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  );
  Menu.Items = ({ children }) => <div>{children}</div>;
  Menu.Item = ({ children }) => children({ active: false });
  const Transition = ({ children }) => <>{renderChild(children)}</>;
  Transition.Child = ({ children }) => <>{renderChild(children)}</>;
  const Dialog = ({ children }) => <div>{children}</div>;
  Dialog.Panel = ({ children }) => <div>{children}</div>;
  Dialog.Title = ({ children }) => <div>{children}</div>;
  return {
    Menu,
    Transition,
    Dialog,
  };
});

describe('EventLibrary', () => {
  it('renders events and supports management actions', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenWorkspace = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const events = [
      {
        id: 'evt-1',
        title: 'Launch Summit',
        status: 'planned',
        startAt: '2024-05-01T10:00:00.000Z',
        location: 'London',
        guests: [{ id: 1 }],
      },
    ];

    render(
      <EventLibrary
        events={events}
        selectedEventId="evt-1"
        onSelect={onSelect}
        onOpenWorkspace={onOpenWorkspace}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreate={vi.fn()}
        canManage
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Launch Summit' }));
    expect(onSelect).toHaveBeenCalledWith('evt-1');

    await user.click(screen.getByRole('button', { name: /manage/i }));
    expect(onOpenWorkspace).toHaveBeenCalledWith('evt-1');

    await user.click(screen.getByRole('button', { name: /event actions/i }));
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('evt-1');

    await user.click(screen.getByRole('button', { name: /event actions/i }));
    await user.click(await screen.findByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('evt-1');
  });
});
