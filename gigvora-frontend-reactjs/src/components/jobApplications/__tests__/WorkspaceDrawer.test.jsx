import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WorkspaceDrawer from '../WorkspaceDrawer.jsx';

vi.mock('@headlessui/react', () => {
  const DialogComponent = ({ children }) => (
    <div role="dialog" aria-modal="true">
      {typeof children === 'function' ? children({}) : children}
    </div>
  );
  const Panel = ({ children, ...props }) => <div {...props}>{children}</div>;
  const Title = ({ children }) => <h2>{children}</h2>;
  DialogComponent.Panel = Panel;
  DialogComponent.Title = Title;

  const TransitionRoot = ({ show, children }) => (show ? <div>{children}</div> : null);
  const TransitionChild = ({ children }) => <div>{children}</div>;

  return {
    __esModule: true,
    Dialog: DialogComponent,
    Transition: { Root: TransitionRoot, Child: TransitionChild },
  };
});

describe('WorkspaceDrawer', () => {
  it('renders a drawer with title and description and handles close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <WorkspaceDrawer open title="New item" description="Helpful context" onClose={onClose}>
        <p>Drawer body</p>
      </WorkspaceDrawer>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New item')).toBeInTheDocument();
    expect(screen.getByText('Helpful context')).toBeInTheDocument();
    expect(screen.getByText('Drawer body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
