import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RoleAssignmentEditor from '../RoleAssignmentEditor.jsx';

describe('RoleAssignmentEditor', () => {
  it('shows an empty state and adds a new role from templates', () => {
    const onChange = vi.fn();

    render(
      <RoleAssignmentEditor
        value={[]}
        onChange={onChange}
        templates={[{ roleKey: 'admin', roleLabel: 'Admin', permissions: ['sync'] }]}
      />,
    );

    expect(screen.getByText('No role assignments configured.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add role/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextValue] = onChange.mock.calls[0];
    expect(nextValue[0]).toMatchObject({ roleKey: 'admin', roleLabel: 'Admin', permissions: ['sync'] });
  });

  it('updates an existing assignment when a different role is selected', () => {
    const onChange = vi.fn();
    const value = [
      {
        id: 'role-1',
        roleKey: '',
        roleLabel: '',
        assigneeName: '',
        assigneeEmail: '',
        permissions: [],
      },
    ];

    render(
      <RoleAssignmentEditor
        value={value}
        onChange={onChange}
        templates={[
          { roleKey: 'admin', roleLabel: 'Admin', permissions: ['sync'] },
          { roleKey: 'viewer', roleLabel: 'Viewer', permissions: [] },
        ]}
      />,
    );

    const roleSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(roleSelect, { target: { value: 'viewer' } });

    expect(onChange).toHaveBeenCalledWith([
      {
        id: 'role-1',
        roleKey: 'viewer',
        roleLabel: 'Viewer',
        assigneeName: '',
        assigneeEmail: '',
        permissions: [],
      },
    ]);
  });
});
