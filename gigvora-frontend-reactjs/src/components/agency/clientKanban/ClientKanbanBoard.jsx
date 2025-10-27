import { Fragment, forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
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
import { buildCollaboratorAvatar, formatRelative } from './utils.js';

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

function resolvePresenceMeta(activity, now = Date.now()) {
  if (!activity) {
    return { state: 'offline', label: 'Offline' };
  }
  const timestamp = activity instanceof Date ? activity : new Date(activity);
  if (Number.isNaN(timestamp.getTime())) {
    return { state: 'offline', label: 'Offline' };
  }
  const diff = now - timestamp.getTime();
  if (diff <= FIVE_MINUTES) {
    return { state: 'active', label: 'Active now' };
  }
  if (diff <= ONE_HOUR) {
    return { state: 'recent', label: `Active ${formatRelative(timestamp)}` };
  }
  if (diff <= ONE_DAY) {
    return { state: 'idle', label: `Active ${formatRelative(timestamp)}` };
  }
  return { state: 'offline', label: `Last seen ${formatRelative(timestamp)}` };
}

function mapChecklistPayload(item) {
  return {
    title: item.title,
    completed: Boolean(item.completed),
    dueDate: item.dueDate || null,
  };
}

const ClientKanbanBoard = forwardRef(function ClientKanbanBoard({ data, loading, error, actions }, ref) {
  const rawColumns = useMemo(() => data?.columns ?? [], [data?.columns]);
  const clients = useMemo(() => data?.clients ?? [], [data?.clients]);
  const clientLookup = useMemo(() => {
    return new Map(
      clients
        .filter((client) => client?.id != null || client?.clientId != null)
        .map((client) => [String(client.id ?? client.clientId), client]),
    );
  }, [clients]);
  const columns = useMemo(() => {
    return rawColumns.map((column) => {
      const cards = Array.isArray(column.cards)
        ? column.cards.map((card) => {
            if (card?.client?.id != null) {
              return card;
            }
            const clientId = card?.clientId ?? card?.client?.id;
            if (clientId == null) {
              return card;
            }
            const matchedClient = clientLookup.get(String(clientId));
            if (!matchedClient) {
              return card;
            }
            return { ...card, client: card.client ?? matchedClient };
          })
        : [];
      return { ...column, cards };
    });
  }, [rawColumns, clientLookup]);
  const metrics = data?.metrics ?? {};
  const columnSummary = data?.columnSummary ?? [];
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeCard, setActiveCard] = useState(null);
  const [wizardState, setWizardState] = useState({ open: false, mode: 'create', card: null });
  const [columnState, setColumnState] = useState({ open: false, mode: 'create', column: null });
  const [clientState, setClientState] = useState({ open: false, mode: 'create', client: null });
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [focusClientOnly, setFocusClientOnly] = useState(false);

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
    setWizardState({
      open: true,
      mode: 'create',
      card: {
        columnId: column?.id,
        ...(focusDefaults ?? {}),
      },
    });
  };

  const openEditCard = (card) => {
    setWizardState({ open: true, mode: 'edit', card });
  };

  const handleCardSubmit = async (payload) => {
    const finalPayload = { ...payload };
    if (focusClientOnly && focusClientKey && !finalPayload.clientId) {
      finalPayload.clientId = focusClientKey;
    }
    if (focusDefaults?.client && !finalPayload.client) {
      finalPayload.client = focusDefaults.client;
    }
    if (wizardState.mode === 'edit' && wizardState.card?.id) {
      await actions.updateCard(wizardState.card.id, finalPayload);
      setActiveCard({ id: wizardState.card.id });
    } else {
      const created = await actions.createCard(finalPayload);
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
      const targetColumn =
        columns.find((candidate) => String(candidate.id) === String(column.id)) ?? column;
      const position = targetColumn?.cards?.length ?? column.cards?.length ?? 0;
      await actions.moveCard(parsed.cardId, { columnId: column.id, position });
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
      setSelectedClientId(String(clientState.client.id));
    } else {
      const client = await actions.createClient(payload);
      if (client?.id) {
        setSelectedClientId(String(client.id));
      }
    }
    setClientState({ open: false, mode: 'create', client: null });
  };

  const resolvedSelectedClient = useMemo(() => {
    if (selectedClientId == null) {
      return null;
    }
    const needle = String(selectedClientId);
    return clients.find((client) => String(client.id ?? client.clientId) === needle) ?? null;
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (!resolvedSelectedClient && focusClientOnly) {
      setFocusClientOnly(false);
    }
  }, [resolvedSelectedClient, focusClientOnly]);

  const focusClientKey = resolvedSelectedClient?.id != null ? String(resolvedSelectedClient.id) : null;

  const focusDefaults = useMemo(() => {
    if (!focusClientOnly || !focusClientKey) {
      return null;
    }
    if (!resolvedSelectedClient) {
      return { clientId: focusClientKey };
    }
    return {
      clientId: focusClientKey,
      client: resolvedSelectedClient,
    };
  }, [focusClientOnly, focusClientKey, resolvedSelectedClient]);

  const preparedColumns = useMemo(() => {
    return columns.map((column) => {
      const cards = column.cards ?? [];
      const originalCardCount = column.originalCardCount ?? cards.length;
      const columnActivity = cards.reduce((latest, card) => {
        const timestamp = card?.lastActivityAt ?? card?.updatedAt ?? card?.createdAt ?? null;
        if (!timestamp) {
          return latest;
        }
        const value = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (Number.isNaN(value.getTime())) {
          return latest;
        }
        if (!latest || value.getTime() > latest.getTime()) {
          return value;
        }
        return latest;
      }, null);

      if (!focusClientOnly || !focusClientKey) {
        return {
          ...column,
          originalCardCount,
          lastActivity: columnActivity,
          lastActivityLabel: columnActivity ? formatRelative(columnActivity) : null,
        };
      }

      const filteredCards = cards.filter((card) => {
        const cardClientId = card?.clientId ?? card?.client?.id;
        if (cardClientId == null) {
          return false;
        }
        return String(cardClientId) === focusClientKey;
      });

      return {
        ...column,
        cards: filteredCards,
        originalCardCount,
        focusCount: filteredCards.length,
        lastActivity: columnActivity,
        lastActivityLabel: columnActivity ? formatRelative(columnActivity) : null,
      };
    });
  }, [columns, focusClientOnly, focusClientKey]);

  const collaborationSummary = useMemo(() => {
    const members = new Map();
    let lastActivity = null;

    columns.forEach((column) => {
      (column.cards ?? []).forEach((card) => {
        const collaborators = Array.isArray(card?.collaborators) ? card.collaborators : [];
        const avatarEntries = collaborators.map((collaborator, index) => ({
          data: buildCollaboratorAvatar(collaborator, `${column.id}-${card.id}-${index}`),
          activity: card?.lastActivityAt ?? card?.updatedAt ?? card?.createdAt ?? null,
        }));

        if (card?.ownerName || card?.ownerEmail) {
          avatarEntries.push({
            data: buildCollaboratorAvatar(
              {
                id: card.ownerId ?? `${column.id}-${card.id}-owner`,
                name: card.ownerName ?? card.ownerEmail,
                email: card.ownerEmail,
                role: card.ownerRole ?? 'Owner',
              },
              `${column.id}-${card.id}-owner`,
            ),
            activity: card?.lastActivityAt ?? card?.updatedAt ?? card?.createdAt ?? null,
          });
        }

        avatarEntries.forEach((entry) => {
          const existing = members.get(entry.data.key);
          const timestamp = entry.activity;
          if (!existing) {
            members.set(entry.data.key, {
              ...entry.data,
              lastActivity: timestamp ? new Date(timestamp) : null,
            });
            return;
          }
          if (!timestamp) {
            return;
          }
          const candidate = timestamp instanceof Date ? timestamp : new Date(timestamp);
          if (Number.isNaN(candidate.getTime())) {
            return;
          }
          if (!existing.lastActivity || candidate.getTime() > existing.lastActivity.getTime()) {
            members.set(entry.data.key, {
              ...existing,
              ...entry.data,
              lastActivity: candidate,
            });
          }
        });

        const timestamp = card?.lastActivityAt ?? card?.updatedAt ?? card?.createdAt ?? null;
        if (timestamp) {
          const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
          if (!Number.isNaN(date.getTime())) {
            if (!lastActivity || date.getTime() > lastActivity.getTime()) {
              lastActivity = date;
            }
          }
        }
      });
    });

    if (!members.size && !lastActivity) {
      return null;
    }

    const now = Date.now();
    const presenceRank = { active: 0, recent: 1, idle: 2, offline: 3 };

    const memberList = Array.from(members.values())
      .map((member) => {
        const presence = resolvePresenceMeta(member.lastActivity, now);
        return {
          ...member,
          presence: presence.state,
          presenceLabel: presence.label,
        };
      })
      .sort((a, b) => {
        const rankA = presenceRank[a.presence] ?? 3;
        const rankB = presenceRank[b.presence] ?? 3;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      members: memberList,
      total: memberList.length,
      activeMembers: memberList.filter((member) => member.presence === 'active').length,
      lastActivity,
      lastActivityLabel: lastActivity ? formatRelative(lastActivity) : 'Just now',
    };
  }, [columns]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-4xl border border-rose-200 bg-rose-50/80 p-8 text-center text-sm text-rose-600">
        <ExclamationTriangleIcon className="h-8 w-8" />
        <p>We couldn&apos;t load your board. Try refreshing.</p>
      </div>
    );
  }

  useImperativeHandle(
    ref,
    () => ({
      createLead(defaults = {}) {
        const initialColumn = defaults.columnId || columns?.[0]?.id || null;
        setWizardState({
          open: true,
          mode: 'create',
          card: {
            columnId: initialColumn,
            ...defaults,
            ...(focusDefaults ?? {}),
          },
        });
      },
      createStage(initialValues = {}) {
        setColumnState({ open: true, mode: 'create', column: Object.keys(initialValues).length ? initialValues : null });
      },
      createClient(initialValues = {}) {
        setClientState({ open: true, mode: 'create', client: Object.keys(initialValues).length ? initialValues : null });
      },
      focusLead(cardId) {
        if (!cardId) {
          return;
        }
        setActiveCard({ id: cardId });
      },
    }),
    [columns, focusDefaults],
  );

  return (
    <Fragment>
      <div className="flex flex-col gap-6">
        <BoardToolbar
          metrics={metrics}
          columnSummary={columnSummary}
          onCreateColumn={() => setColumnState({ open: true, mode: 'create', column: null })}
          onCreateCard={() =>
            setWizardState({
              open: true,
              mode: 'create',
              card: {
                columnId: columns?.[0]?.id,
                ...(focusDefaults ?? {}),
              },
            })
          }
          onTogglePanel={() => setPanelOpen((prev) => !prev)}
          panelOpen={panelOpen}
          collaborationSummary={collaborationSummary}
          onToggleFocusClient={() => {
            if (!resolvedSelectedClient) {
              return;
            }
            setFocusClientOnly((prev) => !prev);
          }}
          focusClientMode={focusClientOnly && Boolean(resolvedSelectedClient)}
          activeClient={resolvedSelectedClient}
          canFocusClient={Boolean(resolvedSelectedClient)}
        />

        <DataStatus loading={loading} onRefresh={actions.refresh} statusLabel="Live board" />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-50/80">
            <div className="overflow-x-auto">
              <div className="flex min-h-[520px] gap-4 p-5">
                {preparedColumns.length ? (
                  preparedColumns.map((column) => (
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
                      highlightClientId={focusClientKey}
                      focusClientName={resolvedSelectedClient?.name ?? ''}
                      focusMode={focusClientOnly && Boolean(focusClientKey)}
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
              if (!client) {
                setSelectedClientId(null);
                return;
              }
              const value = client.id ?? client.clientId ?? null;
              setSelectedClientId(value != null ? String(value) : null);
              setFocusClientOnly(true);
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
});

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

ClientKanbanBoard.displayName = 'ClientKanbanBoard';

export default ClientKanbanBoard;
