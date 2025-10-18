import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';
import BoardToolbar from './BoardToolbar.jsx';
import KanbanColumn from './KanbanColumn.jsx';
import CardDetailDrawer from './CardDetailDrawer.jsx';
import CardWizard from './CardWizard.jsx';
import ColumnDrawer from './ColumnDrawer.jsx';
import ClientPanel from './ClientPanel.jsx';
import ClientEditorDrawer from './ClientEditorDrawer.jsx';

function mapChecklistPayload(item) {
  return {
    title: item.title,
    completed: Boolean(item.completed),
    dueDate: item.dueDate || null,
  };
}

export default function ClientKanbanBoard({ data, loading, error, actions }) {
  const columns = useMemo(() => data?.columns ?? [], [data?.columns]);
  const clients = useMemo(() => data?.clients ?? [], [data?.clients]);
  const metrics = data?.metrics ?? {};
  const columnSummary = data?.columnSummary ?? [];
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [wizardState, setWizardState] = useState({ open: false, mode: 'create', card: null });
  const [columnState, setColumnState] = useState({ open: false, mode: 'create', column: null });
  const [clientState, setClientState] = useState({ open: false, mode: 'create', client: null });
  const [selectedClientId, setSelectedClientId] = useState(null);

  const activeCardData = useMemo(() => {
    if (!activeCard) {
      return null;
    }
    const column = columns.find((candidate) => candidate.cards?.some((card) => card.id === activeCard.id));
    if (!column) {
      return activeCard;
    }
    return column.cards.find((card) => card.id === activeCard.id) ?? activeCard;
  }, [activeCard, columns]);

  const openCreateCard = (column) => {
    setWizardState({ open: true, mode: 'create', card: { columnId: column?.id } });
  };

  const openEditCard = (card) => {
    setWizardState({ open: true, mode: 'edit', card });
  };

  const handleCardSubmit = async (payload) => {
    if (wizardState.mode === 'edit' && wizardState.card?.id) {
      await actions.updateCard(wizardState.card.id, payload);
      setActiveCard({ id: wizardState.card.id });
    } else {
      const created = await actions.createCard(payload);
      if (created?.id) {
        setActiveCard({ id: created.id });
      }
    }
    setWizardState({ open: false, mode: 'create', card: null });
  };

  const handleDeleteCard = async (card) => {
    if (!card?.id) {
      return;
    }
    if (window.confirm('Remove this engagement?')) {
      await actions.deleteCard(card.id);
      if (activeCard?.id === card.id) {
        setActiveCard(null);
      }
    }
  };

  const handleMoveCard = async (event, column) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/json');
    if (!payload) {
      return;
    }
    try {
      const parsed = JSON.parse(payload);
      if (!parsed.cardId) {
        return;
      }
      await actions.moveCard(parsed.cardId, { columnId: column.id, position: column.cards?.length ?? 0 });
    } catch (err) {
      console.warn('Failed to drop card', err);
    }
  };

  const handleDragStart = (event, card) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({ cardId: card.id }));
  };

  const handleDragEnd = () => {
  };

  const handleChecklistAdd = async (cardId, item) => {
    await actions.addChecklistItem(cardId, mapChecklistPayload(item));
  };

  const handleChecklistToggle = async (item, completed) => {
    if (!activeCardData?.id) {
      return;
    }
    await actions.updateChecklistItem(activeCardData.id, item.id, { completed });
  };

  const handleChecklistDelete = async (item) => {
    if (!activeCardData?.id) {
      return;
    }
    if (window.confirm('Remove this task?')) {
      await actions.deleteChecklistItem(activeCardData.id, item.id);
    }
  };

  const handleChecklistEdit = async (item) => {
    if (!activeCardData?.id) {
      return;
    }
    const title = window.prompt('Update task title', item.title);
    if (title == null) {
      return;
    }
    const dueDate = window.prompt('Due date (YYYY-MM-DD)', item.dueDate ?? '');
    await actions.updateChecklistItem(activeCardData.id, item.id, {
      title,
      dueDate: dueDate || null,
    });
  };

  const handleSaveNotes = async (notes) => {
    if (!activeCardData?.id) {
      return;
    }
    await actions.updateCard(activeCardData.id, { notes });
  };

  const handleColumnSubmit = async (payload) => {
    if (columnState.mode === 'edit' && columnState.column?.id) {
      await actions.updateColumn(columnState.column.id, payload);
    } else {
      await actions.createColumn(payload);
    }
    setColumnState({ open: false, mode: 'create', column: null });
  };

  const handleDeleteColumn = async (column) => {
    if (!column?.id) {
      return;
    }
    if (window.confirm('Delete this column? Move any cards first.')) {
      await actions.deleteColumn(column.id);
    }
  };

  const handleClientSubmit = async (payload) => {
    if (clientState.mode === 'edit' && clientState.client?.id) {
      await actions.updateClient(clientState.client.id, payload);
      setSelectedClientId(clientState.client.id);
    } else {
      const client = await actions.createClient(payload);
      if (client?.id) {
        setSelectedClientId(client.id);
      }
    }
    setClientState({ open: false, mode: 'create', client: null });
  };

  const resolvedSelectedClient = useMemo(() => {
    return clients.find((client) => client.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-rose-200 bg-rose-50/80 p-8 text-center text-sm text-rose-600">
        <ExclamationTriangleIcon className="h-8 w-8" />
        <p>We couldn&apos;t load your board. Try refreshing.</p>
      </div>
    );
  }

  return (
    <Fragment>
      <div className="flex flex-col gap-6">
        <BoardToolbar
          metrics={metrics}
          columnSummary={columnSummary}
          onCreateColumn={() => setColumnState({ open: true, mode: 'create', column: null })}
          onCreateCard={() => setWizardState({ open: true, mode: 'create', card: { columnId: columns?.[0]?.id } })}
          onTogglePanel={() => setPanelOpen((prev) => !prev)}
          panelOpen={panelOpen}
        />

        <DataStatus loading={loading} onRefresh={actions.refresh} statusLabel="Live board" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-50/80">
            <div className="overflow-x-auto">
              <div className="flex min-h-[520px] gap-4 p-5">
                {columns.length ? (
                  columns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      onAddCard={openCreateCard}
                      onEditColumn={(candidate) =>
                        setColumnState({ open: true, mode: 'edit', column: candidate })
                      }
                      onDeleteColumn={handleDeleteColumn}
                      onOpenCard={(card) => setActiveCard({ id: card.id })}
                      onEditCard={openEditCard}
                      onDeleteCard={handleDeleteCard}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onCardDrop={handleMoveCard}
                    />
                  ))
                ) : (
                  <div className="flex w-full flex-col items-center justify-center gap-3 rounded-4xl border border-dashed border-slate-300 bg-white/70 text-center text-sm text-slate-500">
                    <p>Add your first column to get started.</p>
                    <button
                      type="button"
                      onClick={() => setColumnState({ open: true, mode: 'create', column: null })}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      New column
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ClientPanel
            open={panelOpen}
            clients={clients}
            onCreate={() => setClientState({ open: true, mode: 'create', client: null })}
            onEdit={(client) => setClientState({ open: true, mode: 'edit', client })}
            onSelect={(client) => {
              setSelectedClientId(client.id);
            }}
            activeClientId={resolvedSelectedClient?.id}
          />
        </div>
      </div>

      <CardDetailDrawer
        card={activeCardData}
        open={Boolean(activeCardData)}
        onClose={() => setActiveCard(null)}
        onEdit={() => {
          if (activeCardData) {
            openEditCard(activeCardData);
          }
        }}
        onDelete={() => handleDeleteCard(activeCardData)}
        onAddChecklist={(item) => handleChecklistAdd(activeCardData.id, item)}
        onToggleChecklist={handleChecklistToggle}
        onDeleteChecklist={handleChecklistDelete}
        onUpdateChecklist={handleChecklistEdit}
        onSaveNotes={handleSaveNotes}
      />

      <CardWizard
        open={wizardState.open}
        mode={wizardState.mode}
        initialCard={wizardState.card}
        columns={columns}
        clients={clients}
        onClose={() => setWizardState({ open: false, mode: 'create', card: null })}
        onSubmit={handleCardSubmit}
      />

      <ColumnDrawer
        open={columnState.open}
        mode={columnState.mode}
        initialValue={columnState.column}
        onClose={() => setColumnState({ open: false, mode: 'create', column: null })}
        onSubmit={handleColumnSubmit}
      />

      <ClientEditorDrawer
        open={clientState.open}
        mode={clientState.mode}
        initialClient={clientState.client}
        onClose={() => setClientState({ open: false, mode: 'create', client: null })}
        onSubmit={handleClientSubmit}
      />
    </Fragment>
  );
}

ClientKanbanBoard.propTypes = {
  data: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.object),
    clients: PropTypes.arrayOf(PropTypes.object),
    metrics: PropTypes.object,
    columnSummary: PropTypes.arrayOf(PropTypes.object),
  }),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.bool]),
  actions: PropTypes.shape({
    refresh: PropTypes.func,
    createColumn: PropTypes.func.isRequired,
    updateColumn: PropTypes.func.isRequired,
    deleteColumn: PropTypes.func.isRequired,
    createCard: PropTypes.func.isRequired,
    updateCard: PropTypes.func.isRequired,
    moveCard: PropTypes.func.isRequired,
    deleteCard: PropTypes.func.isRequired,
    addChecklistItem: PropTypes.func.isRequired,
    updateChecklistItem: PropTypes.func.isRequired,
    deleteChecklistItem: PropTypes.func.isRequired,
    createClient: PropTypes.func.isRequired,
    updateClient: PropTypes.func.isRequired,
  }).isRequired,
};

ClientKanbanBoard.defaultProps = {
  data: null,
  loading: false,
  error: null,
};
