import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  fetchAgencyClientKanban,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  createKanbanCard,
  updateKanbanCard,
  deleteKanbanCard,
  moveKanbanCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClientAccount,
  updateClientAccount,
} from '../../../../services/agencyClientKanban.js';
import ClientKanbanBoard from '../../../../components/agency/clientKanban/ClientKanbanBoard.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';

export default function AgencyCrmLeadPipelineSection({ workspaceId }) {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const boardRef = useRef(null);

  const loadBoard = useCallback(
    async ({ force } = {}) => {
      setLoading(true);
      if (force) {
        setStatusMessage('Refreshing pipeline…');
      }
      setError(null);
      try {
        const response = await fetchAgencyClientKanban({ workspaceId });
        setBoard(response ?? {});
        if (force) {
          setStatusMessage('Pipeline refreshed.');
        }
      } catch (err) {
        console.error('Failed to load client kanban', err);
        setError(err instanceof Error ? err.message : 'Unable to load CRM pipeline.');
      } finally {
        setLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const runAction = useCallback(
    async (message, handler) => {
      setStatusMessage('');
      setError(null);
      try {
        const result = await handler();
        setStatusMessage(message);
        await loadBoard({ force: false });
        return result;
      } catch (err) {
        console.error('CRM pipeline action failed', err);
        const friendly = err instanceof Error ? err.message : 'Unable to update CRM pipeline.';
        setError(friendly);
        throw err;
      }
    },
    [loadBoard],
  );

  const applyWorkspace = useCallback(
    (payload = {}) => {
      if (workspaceId == null || workspaceId === '') {
        return payload;
      }
      if (Object.keys(payload).length === 0) {
        return { workspaceId };
      }
      return { ...payload, workspaceId };
    },
    [workspaceId],
  );

  const actions = useMemo(
    () => ({
      refresh: () => loadBoard({ force: true }),
      createColumn: (payload) => runAction('Stage created.', () => createKanbanColumn(applyWorkspace(payload))),
      updateColumn: (columnId, payload) =>
        runAction('Stage updated.', () => updateKanbanColumn(columnId, applyWorkspace(payload))),
      deleteColumn: (columnId) => runAction('Stage deleted.', () => deleteKanbanColumn(columnId, applyWorkspace())),
      createCard: (payload) => runAction('Lead created.', () => createKanbanCard(applyWorkspace(payload))),
      updateCard: (cardId, payload) => runAction('Lead updated.', () => updateKanbanCard(cardId, applyWorkspace(payload))),
      deleteCard: (cardId) => runAction('Lead archived.', () => deleteKanbanCard(cardId, applyWorkspace())),
      moveCard: (cardId, payload) => runAction('Lead moved.', () => moveKanbanCard(cardId, applyWorkspace(payload))),
      addChecklistItem: (cardId, payload) =>
        runAction('Task added.', () => createChecklistItem(cardId, applyWorkspace(payload))),
      updateChecklistItem: (cardId, itemId, payload) =>
        runAction('Task updated.', () => updateChecklistItem(cardId, itemId, applyWorkspace(payload))),
      deleteChecklistItem: (cardId, itemId) =>
        runAction('Task removed.', () => deleteChecklistItem(cardId, itemId, applyWorkspace())),
      createClient: (payload) => runAction('Client saved.', () => createClientAccount(applyWorkspace(payload))),
      updateClient: (clientId, payload) =>
        runAction('Client updated.', () => updateClientAccount(clientId, applyWorkspace(payload))),
    }),
    [applyWorkspace, loadBoard, runAction],
  );

  const columnSummary = board?.columnSummary ?? [];
  const boardMetrics = board?.metrics ?? {};

  const formatNumber = useCallback((value) => {
    if (value == null) {
      return '—';
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '—';
    }
    if (Math.abs(numeric) >= 1000) {
      return numeric.toLocaleString();
    }
    return `${numeric}`;
  }, []);

  const formatCurrency = useCallback((amount, currencyCode = 'USD') => {
    if (amount == null) {
      return '—';
    }
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) {
      return '—';
    }
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: numeric % 1 === 0 ? 0 : 1,
      }).format(numeric);
    } catch (currencyError) {
      console.warn('Unable to format currency value', currencyError);
      return `${currencyCode} ${numeric.toFixed(0)}`;
    }
  }, []);

  const derivedLeadCount = useMemo(
    () =>
      columnSummary.reduce((total, column) => {
        const count = column?.active ?? column?.count ?? column?.cardsCount ?? column?.cards?.length ?? 0;
        const numeric = Number(count);
        return total + (Number.isFinite(numeric) ? numeric : 0);
      }, 0),
    [columnSummary],
  );

  const derivedPipelineValue = useMemo(
    () =>
      columnSummary.reduce((total, column) => {
        const value = column?.weightedValue ?? column?.totalValue ?? column?.value ?? 0;
        const numeric = Number(value);
        return total + (Number.isFinite(numeric) ? numeric : 0);
      }, 0),
    [columnSummary],
  );

  const summaryCards = useMemo(() => {
    const currency = board?.currency || board?.workspace?.currency || 'USD';
    return [
      {
        id: 'active-opportunities',
        title: 'Active opportunities',
        value: formatNumber(
          boardMetrics.activeOpportunities ?? boardMetrics.activeLeads ?? boardMetrics.activeDeals ?? derivedLeadCount,
        ),
        helper: 'Live deals across the pipeline.',
        icon: UsersIcon,
      },
      {
        id: 'won-last-30-days',
        title: 'Won last 30 days',
        value: formatNumber(boardMetrics.wonLast30Days ?? boardMetrics.wonDeals ?? boardMetrics.closedWon ?? 0),
        helper: 'Recently signed retainers.',
        icon: ArrowTrendingUpIcon,
      },
      {
        id: 'cycle-time',
        title: 'Average cycle',
        value:
          boardMetrics.averageCycleDays != null
            ? `${boardMetrics.averageCycleDays} days`
            : boardMetrics.velocityDays != null
            ? `${boardMetrics.velocityDays} days`
            : '—',
        helper: 'Qualification to close.',
        icon: CalendarDaysIcon,
      },
      {
        id: 'pipeline-value',
        title: 'Weighted pipeline',
        value: formatCurrency(
          boardMetrics.weightedPipeline ?? boardMetrics.forecastValue ?? derivedPipelineValue,
          currency,
        ),
        helper: 'Forecasted revenue at today’s weights.',
        icon: BoltIcon,
      },
    ];
  }, [board?.currency, board?.workspace?.currency, boardMetrics, derivedLeadCount, derivedPipelineValue, formatCurrency, formatNumber]);

  const handleCreateLead = useCallback(() => {
    const defaultColumnId = board?.columns?.[0]?.id ?? null;
    boardRef.current?.createLead({ columnId: defaultColumnId });
  }, [board?.columns]);

  const handleCreateColumn = useCallback(() => {
    boardRef.current?.createStage();
  }, []);

  const handleCreateClient = useCallback(() => {
    boardRef.current?.createClient();
  }, []);

  return (
    <section id="agency-crm" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Growth</p>
          <h2 className="text-3xl font-semibold text-slate-900">CRM pipeline & lead kanban</h2>
          <p className="mt-2 text-sm text-slate-500">
            Track marketing qualified leads through to signed retainers. Drag cards across stages, capture follow ups, and keep
            every opportunity visible.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreateLead}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
              New lead
            </button>
            <button
              type="button"
              onClick={handleCreateColumn}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <BoltIcon className="h-5 w-5" aria-hidden="true" />
              New stage
            </button>
            <button
              type="button"
              onClick={handleCreateClient}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <UsersIcon className="h-5 w-5" aria-hidden="true" />
              Add client
            </button>
          </div>
          <DataStatus loading={loading} error={error} statusLabel="CRM" onRefresh={() => loadBoard({ force: true })} />
        </div>
      </header>

      {summaryCards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-inner"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.title}</p>
                    <p className="text-xl font-semibold text-slate-900">{card.value}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{card.helper}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">{statusMessage}</div>
      ) : null}

      {error && !loading ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-4xl border border-slate-100 bg-slate-50/70 p-4 shadow-inner">
        <ClientKanbanBoard ref={boardRef} data={board} loading={loading} error={error} actions={actions} />
      </div>
    </section>
  );
}

AgencyCrmLeadPipelineSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

AgencyCrmLeadPipelineSection.defaultProps = {
  workspaceId: null,
};
