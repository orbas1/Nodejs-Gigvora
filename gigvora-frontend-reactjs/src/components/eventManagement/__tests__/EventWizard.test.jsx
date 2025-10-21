import { render, screen } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import EventWizard from '../EventWizard.jsx';

vi.mock('@headlessui/react', () => {
  const renderChild = (child) => (typeof child === 'function' ? child({}) : child);
  const Dialog = ({ children }) => <div>{children}</div>;
  Dialog.Panel = ({ children }) => <div>{children}</div>;
  Dialog.Title = ({ children }) => <div>{children}</div>;
  const Transition = ({ children }) => <>{renderChild(children)}</>;
  Transition.Child = ({ children }) => <>{renderChild(children)}</>;
  return { Dialog, Transition };
});

describe('EventWizard', () => {
  it('progresses through steps and builds payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();

    render(
      <EventWizard
        open
        mode="create"
        initialValues={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        busy={false}
        defaults={{ timezone: 'Europe/London', format: 'virtual', visibility: 'invite_only', status: 'planned' }}
      />,
    );

    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), 'Demo Day');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /next/i }));
    });

    await act(async () => {
      await user.type(screen.getByLabelText(/starts/i), '2024-04-10T10:00');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/ends/i), '2024-04-10T12:00');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /next/i }));
    });

    await act(async () => {
      await user.type(screen.getByLabelText(/capacity/i), '150');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/registration link/i), 'https://example.com');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /save/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Demo Day',
        startAt: new Date('2024-04-10T10:00').toISOString(),
        capacity: 150,
        registrationUrl: 'https://example.com',
        timezone: 'Europe/London',
      }),
    );
  });
});
