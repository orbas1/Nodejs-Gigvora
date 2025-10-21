import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { createRef } from 'react';

import ClientKanbanBoard from '../ClientKanbanBoard.jsx';

let toolbarProps;
let dataStatusProps;
let kanbanColumnsProps = [];
let cardDetailDrawerProps;
let cardWizardProps;
let columnDrawerProps;
let clientPanelProps;
let clientEditorDrawerProps;

vi.mock('../../DataStatus.jsx', () => ({
  default: (props) => {
    dataStatusProps = props;
    return <div data-testid="data-status" />;
  },
}));

vi.mock('../BoardToolbar.jsx', () => ({
  default: (props) => {
    toolbarProps = props;
    return <div data-testid="board-toolbar" />;
  },
}));

vi.mock('../KanbanColumn.jsx', () => ({
  default: (props) => {
    kanbanColumnsProps = kanbanColumnsProps.filter((item) => item.column.id !== props.column.id);
    kanbanColumnsProps.push(props);
    return <div data-testid={`kanban-column-${props.column.id}`} />;
  },
}));

vi.mock('../CardDetailDrawer.jsx', () => ({
  default: (props) => {
    cardDetailDrawerProps = props;
    return props.open ? <div data-testid="card-detail" /> : null;
  },
}));

vi.mock('../CardWizard.jsx', () => ({
  default: (props) => {
    cardWizardProps = props;
    return props.open ? <div data-testid="card-wizard" /> : null;
  },
}));

vi.mock('../ColumnDrawer.jsx', () => ({
  default: (props) => {
    columnDrawerProps = props;
    return props.open ? <div data-testid="column-drawer" /> : null;
  },
}));

vi.mock('../ClientPanel.jsx', () => ({
  default: (props) => {
    clientPanelProps = props;
    return <div data-testid="client-panel" />;
  },
}));

vi.mock('../ClientEditorDrawer.jsx', () => ({
  default: (props) => {
    clientEditorDrawerProps = props;
    return props.open ? <div data-testid="client-editor" /> : null;
  },
}));

describe('ClientKanbanBoard', () => {
  const actions = {
    refresh: vi.fn(),
    createColumn: vi.fn().mockResolvedValue({}),
    updateColumn: vi.fn().mockResolvedValue({}),
    deleteColumn: vi.fn().mockResolvedValue({}),
    createCard: vi.fn().mockResolvedValue({ id: 'card-new' }),
    updateCard: vi.fn().mockResolvedValue({}),
    moveCard: vi.fn().mockResolvedValue({}),
    deleteCard: vi.fn().mockResolvedValue({}),
    addChecklistItem: vi.fn().mockResolvedValue({}),
    updateChecklistItem: vi.fn().mockResolvedValue({}),
    deleteChecklistItem: vi.fn().mockResolvedValue({}),
    createClient: vi.fn().mockResolvedValue({ id: 'client-new' }),
    updateClient: vi.fn().mockResolvedValue({}),
  };

  const boardData = {
    columns: [
      {
        id: 'col-1',
        name: 'Prospects',
        cards: [
          {
            id: 'card-1',
            title: 'Acme Inc.',
            notes: 'Initial outreach',
            checklist: [
              { id: 'item-1', title: 'Send proposal', completed: false },
            ],
          },
        ],
      },
    ],
    clients: [
      { id: 'client-1', name: 'Acme Inc.' },
    ],
    metrics: { active: 5 },
    columnSummary: [{ id: 'col-1', total: 1 }],
  };

  beforeEach(() => {
    toolbarProps = undefined;
    dataStatusProps = undefined;
    kanbanColumnsProps = [];
    cardDetailDrawerProps = undefined;
    cardWizardProps = undefined;
    columnDrawerProps = undefined;
    clientPanelProps = undefined;
    clientEditorDrawerProps = undefined;
    Object.values(actions).forEach((fn) => fn.mockClear?.());
    window.confirm = vi.fn(() => true);
    window.prompt = vi.fn();
  });

  it('shows an error state when loading fails', () => {
    const { getByText } = render(
      <ClientKanbanBoard
        data={null}
        error="load failed"
        loading={false}
        actions={{
          ...actions,
          refresh: vi.fn(),
        }}
      />,
    );

    expect(getByText("We couldn't load your board. Try refreshing.")).toBeInTheDocument();
  });

  it('exposes imperative API and card workflows', async () => {
    const ref = createRef();
    render(<ClientKanbanBoard ref={ref} data={boardData} loading={false} error={null} actions={actions} />);

    await waitFor(() => expect(toolbarProps).toBeDefined());
    expect(toolbarProps.panelOpen).toBe(true);

    act(() => {
      ref.current.createLead({ columnId: 'col-1', title: 'Follow-up' });
    });
    await waitFor(() => expect(cardWizardProps.open).toBe(true));

    await act(async () => {
      await cardWizardProps.onSubmit({ title: 'Follow-up' });
    });
    expect(actions.createCard).toHaveBeenCalledWith({ title: 'Follow-up' });
    await waitFor(() => expect(cardDetailDrawerProps.card).toMatchObject({ id: 'card-new' }));

    act(() => {
      ref.current.createStage({ name: 'Negotiation' });
    });
    await waitFor(() => expect(columnDrawerProps.open).toBe(true));

    act(() => {
      ref.current.createClient({ name: 'Globex' });
    });
    await waitFor(() => expect(clientEditorDrawerProps.open).toBe(true));
  });

  it('handles board interactions for cards, columns, and clients', async () => {
    render(<ClientKanbanBoard data={boardData} loading={false} error={null} actions={actions} />);

    await waitFor(() => expect(kanbanColumnsProps.length).toBeGreaterThan(0));

    const columnProps = kanbanColumnsProps[0];
    act(() => {
      columnProps.onOpenCard(boardData.columns[0].cards[0]);
    });
    await waitFor(() => expect(cardDetailDrawerProps.open).toBe(true));

    await act(async () => {
      await cardDetailDrawerProps.onAddChecklist({ title: 'Schedule call' });
    });
    expect(actions.addChecklistItem).toHaveBeenCalledWith('card-1', {
      title: 'Schedule call',
      completed: false,
      dueDate: null,
    });

    await act(async () => {
      await cardDetailDrawerProps.onToggleChecklist({ id: 'item-1' }, true);
    });
    expect(actions.updateChecklistItem).toHaveBeenCalledWith('card-1', 'item-1', { completed: true });

    window.confirm.mockReturnValueOnce(true);
    await act(async () => {
      await cardDetailDrawerProps.onDeleteChecklist({ id: 'item-1' });
    });
    expect(actions.deleteChecklistItem).toHaveBeenCalledWith('card-1', 'item-1');

    window.prompt
      .mockReturnValueOnce('Updated task')
      .mockReturnValueOnce('2024-10-01');
    await act(async () => {
      await cardDetailDrawerProps.onUpdateChecklist({ id: 'item-1', title: 'Old task' });
    });
    expect(actions.updateChecklistItem).toHaveBeenLastCalledWith('card-1', 'item-1', {
      title: 'Updated task',
      dueDate: '2024-10-01',
    });

    await act(async () => {
      await cardDetailDrawerProps.onSaveNotes('Next steps');
    });
    expect(actions.updateCard).toHaveBeenLastCalledWith('card-1', { notes: 'Next steps' });

    window.confirm.mockReturnValueOnce(true);
    await act(async () => {
      await columnProps.onDeleteCard(boardData.columns[0].cards[0]);
    });
    expect(actions.deleteCard).toHaveBeenCalledWith('card-1');

    window.confirm.mockReturnValueOnce(true);
    await act(async () => {
      await columnProps.onDeleteColumn(boardData.columns[0]);
    });
    expect(actions.deleteColumn).toHaveBeenCalledWith('col-1');

    await act(async () => {
      await columnProps.onAddCard(boardData.columns[0]);
    });
    expect(cardWizardProps.open).toBe(true);

    act(() => {
      clientPanelProps.onCreate();
    });
    await waitFor(() => expect(clientEditorDrawerProps.open).toBe(true));

    act(() => {
      clientPanelProps.onSelect({ id: 'client-1' });
    });
    await waitFor(() => expect(clientPanelProps.activeClientId).toBe('client-1'));
  });
});
