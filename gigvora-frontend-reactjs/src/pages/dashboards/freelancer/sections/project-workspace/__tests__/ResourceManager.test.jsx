import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResourceManager from '../ResourceManager.jsx';

describe('ResourceManager', () => {
  const baseFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'budgetCents',
      label: 'Budget',
      type: 'number',
      parse: (value) => (value === '' ? null : Math.round(Number(value) * 100)),
    },
    { name: 'active', label: 'Active', type: 'checkbox' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ];

  const baseColumns = [{ id: 'name', label: 'Name' }];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits sanitised payload when creating an item', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <ResourceManager
        title="Test manager"
        description="Manage records"
        items={[]}
        fields={baseFields}
        columns={baseColumns}
        createLabel="Add record"
        emptyLabel="Nothing yet"
        itemName="record"
        onCreate={handleCreate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add record/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/name/i), '  Launch plan  ');
    const budgetInput = within(dialog).getByLabelText(/budget/i);
    await user.clear(budgetInput);
    await user.type(budgetInput, '12.5');
    await user.click(within(dialog).getByLabelText(/active/i));
    await user.type(within(dialog).getByLabelText(/notes/i), 'Aligned with scope');

    await user.click(within(dialog).getByRole('button', { name: /create record/i }));

    await waitFor(() => expect(handleCreate).toHaveBeenCalledTimes(1));
    expect(handleCreate).toHaveBeenCalledWith({
      name: 'Launch plan',
      budgetCents: 1250,
      active: true,
      notes: 'Aligned with scope',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('validates required fields and surfaces the error message', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();

    render(
      <ResourceManager
        title="Validator"
        description=""
        items={[]}
        fields={baseFields}
        columns={baseColumns}
        createLabel="Create"
        emptyLabel="No data"
        itemName="record"
        onCreate={handleCreate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /create/i }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: /create record/i }));

    expect(await within(dialog).findByText(/name is required/i)).toBeInTheDocument();
    expect(handleCreate).not.toHaveBeenCalled();
  });

  it('confirms deletions and calls the delete handler', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ResourceManager
        title="With data"
        description=""
        items={[{ id: '1', name: 'Kick-off' }]}
        fields={baseFields}
        columns={baseColumns}
        createLabel="Add"
        emptyLabel=""
        itemName="record"
        onDelete={handleDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith({ id: '1', name: 'Kick-off' }));
  });

  it('disables interactions and renders the read-only message when access is denied', async () => {
    render(
      <ResourceManager
        title="Read only"
        description=""
        items={[{ id: '1', name: 'Entry' }]}
        fields={baseFields}
        columns={baseColumns}
        createLabel="Add"
        emptyLabel=""
        itemName="record"
        disabled
        readOnlyMessage="Only workspace owners can change this section."
      />,
    );

    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    expect(screen.getByText(/only workspace owners/i)).toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeDisabled();
    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toBeDisabled();
  });

  it('renders a loading placeholder and blocks actions during refresh', () => {
    render(
      <ResourceManager
        title="Loading state"
        description=""
        items={[{ id: '1', name: 'Entry' }]}
        fields={baseFields}
        columns={baseColumns}
        createLabel="Add"
        emptyLabel=""
        itemName="record"
        loading
      />,
    );

    expect(screen.getByText(/Loading records/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
  });
});

