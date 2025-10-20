import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import {
  createAgencyEscrowAccount,
  createAgencyEscrowTransaction,
  fetchAgencyEscrowAccounts,
  fetchAgencyEscrowOverview,
  fetchAgencyEscrowTransactions,
  refundAgencyEscrowTransaction,
  releaseAgencyEscrowTransaction,
  updateAgencyEscrowAccount,
  updateAgencyEscrowSettings,
  updateAgencyEscrowTransaction,
} from '../../../../services/agencyEscrow.js';
import useSession from '../../../../hooks/useSession.js';

const EscrowContext = createContext(null);

const DEFAULT_ACCOUNT_DRAFT = Object.freeze({
  provider: 'stripe',
  currencyCode: 'USD',
  label: '',
  bankReference: '',
  metadata: '',
});

const DEFAULT_TRANSACTION_DRAFT = Object.freeze({
  accountId: '',
  amount: '',
  currencyCode: 'USD',
  feeAmount: 0,
  type: 'project',
  reference: '',
  milestoneLabel: '',
  scheduledReleaseAt: '',
  metadata: '',
});

function parseMetadataInput(value) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    return { note: String(value) };
  }
}

function formatMetadataForEditor(value) {
  if (!value) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'OVERVIEW_REQUEST':
      return { ...state, overview: { ...state.overview, loading: true, error: null } };
    case 'OVERVIEW_SUCCESS':
      return { ...state, overview: { data: action.payload, loading: false, error: null } };
    case 'OVERVIEW_FAILURE':
      return { ...state, overview: { data: null, loading: false, error: action.error } };
    case 'ACCOUNTS_REQUEST':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          loading: true,
        },
      };
    case 'ACCOUNTS_SUCCESS':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          list: action.payload.accounts ?? [],
          pagination: {
            ...state.accounts.pagination,
            total: action.payload.pagination?.total ?? action.payload.accounts?.length ?? 0,
          },
          loading: false,
        },
      };
    case 'ACCOUNTS_FAILURE':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          loading: false,
        },
      };
    case 'TRANSACTIONS_REQUEST':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          loading: true,
        },
      };
    case 'TRANSACTIONS_SUCCESS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          list: action.payload.transactions ?? [],
          pagination: {
            ...state.transactions.pagination,
            total: action.payload.pagination?.total ?? action.payload.transactions?.length ?? 0,
          },
          loading: false,
        },
      };
    case 'TRANSACTIONS_FAILURE':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          loading: false,
        },
      };
    case 'TOAST':
      return { ...state, toast: action.payload };
    case 'ACCOUNT_DRAWER':
      return { ...state, accountDrawer: action.payload };
    case 'TRANSACTION_WIZARD':
      return { ...state, transactionWizard: action.payload };
    case 'ACTIVITY_DRAWER':
      return { ...state, activityDrawer: action.payload };
    case 'SETTINGS_DRAFT':
      return { ...state, settingsDraft: { ...state.settingsDraft, ...action.payload } };
    case 'RESET_SETTINGS':
      return { ...state, settingsDraft: action.payload };
    case 'ACCOUNT_FILTERS':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          filters: { ...state.accounts.filters, ...action.payload },
          pagination: { ...state.accounts.pagination, offset: 0 },
        },
      };
    case 'ACCOUNT_PAGINATION':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          pagination: { ...state.accounts.pagination, ...action.payload },
        },
      };
    case 'TRANSACTION_FILTERS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          filters: { ...state.transactions.filters, ...action.payload },
          pagination: { ...state.transactions.pagination, offset: 0 },
        },
      };
    case 'TRANSACTION_PAGINATION':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          pagination: { ...state.transactions.pagination, ...action.payload },
        },
      };
    default:
      return state;
  }
}

const initialState = Object.freeze({
  overview: { data: null, loading: false, error: null },
  accounts: {
    list: [],
    loading: false,
    filters: { status: '', search: '' },
    pagination: { limit: 10, offset: 0, total: 0 },
  },
  transactions: {
    list: [],
    loading: false,
    filters: { status: '', type: '', search: '' },
    pagination: { limit: 20, offset: 0, total: 0 },
  },
  settingsDraft: null,
  toast: null,
  accountDrawer: { open: false, account: null },
  transactionWizard: { open: false, transaction: null },
  activityDrawer: { open: false, title: '', payload: null },
});

export function EscrowProvider({ children, workspaceId, workspaceSlug }) {
  const { session } = useSession();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [refreshKeys, setRefreshKeys] = useState({ overview: 0, accounts: 0, transactions: 0 });

  const workspaceParams = useMemo(() => {
    const params = {};
    if (workspaceId != null && workspaceId !== '') {
      params.workspaceId = workspaceId;
    }
    if (workspaceSlug) {
      params.workspaceSlug = workspaceSlug;
    }
    return params;
  }, [workspaceId, workspaceSlug]);

  const triggerToast = useCallback((message, tone = 'success') => {
    if (!message) {
      dispatch({ type: 'TOAST', payload: null });
      return;
    }
    dispatch({ type: 'TOAST', payload: { message, tone, at: Date.now() } });
  }, []);

  const openAccountDrawer = useCallback((account = null) => {
    dispatch({
      type: 'ACCOUNT_DRAWER',
      payload: {
        open: true,
        account: account
          ? {
              ...account,
              metadata: formatMetadataForEditor(account.metadata),
            }
          : null,
      },
    });
  }, []);

  const closeAccountDrawer = useCallback(() => {
    dispatch({ type: 'ACCOUNT_DRAWER', payload: { open: false, account: null } });
  }, []);

  const openTransactionWizard = useCallback((transaction = null) => {
    dispatch({
      type: 'TRANSACTION_WIZARD',
      payload: {
        open: true,
        transaction: transaction
          ? {
              ...transaction,
              metadata: formatMetadataForEditor(transaction.metadata),
              accountId: transaction.accountId ?? transaction.account?.id ?? '',
              scheduledReleaseAt: transaction.scheduledReleaseAt
                ? transaction.scheduledReleaseAt.slice(0, 16)
                : '',
            }
          : null,
      },
    });
  }, []);

  const closeTransactionWizard = useCallback(() => {
    dispatch({ type: 'TRANSACTION_WIZARD', payload: { open: false, transaction: null } });
  }, []);

  const openActivityDrawer = useCallback((title, payload) => {
    dispatch({ type: 'ACTIVITY_DRAWER', payload: { open: true, title, payload } });
  }, []);

  const closeActivityDrawer = useCallback(() => {
    dispatch({ type: 'ACTIVITY_DRAWER', payload: { open: false, title: '', payload: null } });
  }, []);

  const refreshOverview = useCallback(() => {
    setRefreshKeys((current) => ({ ...current, overview: current.overview + 1 }));
  }, []);

  const refreshAccounts = useCallback(() => {
    setRefreshKeys((current) => ({ ...current, accounts: current.accounts + 1 }));
  }, []);

  const refreshTransactions = useCallback(() => {
    setRefreshKeys((current) => ({ ...current, transactions: current.transactions + 1 }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'OVERVIEW_REQUEST' });
    fetchAgencyEscrowOverview(workspaceParams, { signal: controller.signal })
      .then((payload) => {
        dispatch({ type: 'OVERVIEW_SUCCESS', payload });
        dispatch({
          type: 'RESET_SETTINGS',
          payload: {
            autoReleaseEnabled: payload.settings?.autoReleaseEnabled ?? true,
            autoReleaseAfterDays: payload.settings?.autoReleaseAfterDays ?? 7,
            requireDualApproval: payload.settings?.requireDualApproval ?? true,
            notifyHoursBeforeRelease: payload.settings?.notifyHoursBeforeRelease ?? 24,
            holdLargePaymentsThreshold: payload.settings?.holdLargePaymentsThreshold ?? 25000,
          },
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'OVERVIEW_FAILURE', error });
      });

    return () => controller.abort();
  }, [refreshKeys.overview, workspaceParams]);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'ACCOUNTS_REQUEST' });
    fetchAgencyEscrowAccounts(
      {
        ...workspaceParams,
        status: state.accounts.filters.status || undefined,
        search: state.accounts.filters.search || undefined,
        limit: state.accounts.pagination.limit,
        offset: state.accounts.pagination.offset,
      },
      { signal: controller.signal },
    )
      .then((payload) => dispatch({ type: 'ACCOUNTS_SUCCESS', payload }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'ACCOUNTS_FAILURE', error });
        triggerToast(error.message || 'Unable to load accounts', 'error');
      });

    return () => controller.abort();
  }, [
    refreshKeys.accounts,
    state.accounts.filters.search,
    state.accounts.filters.status,
    state.accounts.pagination.limit,
    state.accounts.pagination.offset,
    triggerToast,
    workspaceParams,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'TRANSACTIONS_REQUEST' });
    fetchAgencyEscrowTransactions(
      {
        ...workspaceParams,
        status: state.transactions.filters.status || undefined,
        type: state.transactions.filters.type || undefined,
        search: state.transactions.filters.search || undefined,
        limit: state.transactions.pagination.limit,
        offset: state.transactions.pagination.offset,
      },
      { signal: controller.signal },
    )
      .then((payload) => dispatch({ type: 'TRANSACTIONS_SUCCESS', payload }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'TRANSACTIONS_FAILURE', error });
        triggerToast(error.message || 'Unable to load moves', 'error');
      });

    return () => controller.abort();
  }, [
    refreshKeys.transactions,
    state.transactions.filters.search,
    state.transactions.filters.status,
    state.transactions.filters.type,
    state.transactions.pagination.limit,
    state.transactions.pagination.offset,
    triggerToast,
    workspaceParams,
  ]);

  const saveAccount = useCallback(
    async (draft) => {
      const payload = {
        provider: draft.provider,
        currencyCode: draft.currencyCode,
        label: draft.label || undefined,
        bankReference: draft.bankReference || undefined,
        metadata: parseMetadataInput(draft.metadata),
      };

      if (draft.id) {
        await updateAgencyEscrowAccount(draft.id, payload, workspaceParams);
        triggerToast('Account updated');
      } else {
        await createAgencyEscrowAccount(payload, workspaceParams);
        triggerToast('Account created');
      }
      refreshAccounts();
    },
    [refreshAccounts, triggerToast, workspaceParams],
  );

  const reconcileAccount = useCallback(
    async (accountId) => {
      await updateAgencyEscrowAccount(accountId, { lastReconciledAt: new Date().toISOString() }, workspaceParams);
      triggerToast('Reconciled');
      refreshAccounts();
    },
    [refreshAccounts, triggerToast, workspaceParams],
  );

  const saveTransaction = useCallback(
    async (draft) => {
      const payload = {
        accountId: Number(draft.accountId),
        amount: Number(draft.amount),
        currencyCode: draft.currencyCode,
        feeAmount: Number(draft.feeAmount ?? 0),
        type: draft.type,
        reference: draft.reference,
        milestoneLabel: draft.milestoneLabel || undefined,
        scheduledReleaseAt: draft.scheduledReleaseAt
          ? new Date(draft.scheduledReleaseAt).toISOString()
          : undefined,
        metadata: parseMetadataInput(draft.metadata),
      };

      if (!payload.accountId || Number.isNaN(payload.amount)) {
        throw new Error('Account and amount are required');
      }

      if (draft.id) {
        await updateAgencyEscrowTransaction(draft.id, payload, workspaceParams);
        triggerToast('Move updated');
      } else {
        await createAgencyEscrowTransaction(payload, workspaceParams);
        triggerToast('Move logged');
      }
      refreshTransactions();
      refreshOverview();
    },
    [refreshOverview, refreshTransactions, triggerToast, workspaceParams],
  );

  const releaseTransaction = useCallback(
    async (transactionId) => {
      await releaseAgencyEscrowTransaction(transactionId, { actorId: session?.id }, workspaceParams);
      triggerToast('Released');
      refreshTransactions();
      refreshOverview();
    },
    [refreshTransactions, refreshOverview, session?.id, triggerToast, workspaceParams],
  );

  const refundTransaction = useCallback(
    async (transactionId) => {
      await refundAgencyEscrowTransaction(transactionId, { actorId: session?.id }, workspaceParams);
      triggerToast('Refunded');
      refreshTransactions();
      refreshOverview();
    },
    [refreshTransactions, refreshOverview, session?.id, triggerToast, workspaceParams],
  );

  const saveSettings = useCallback(
    async (draft) => {
      await updateAgencyEscrowSettings(
        {
          autoReleaseEnabled: Boolean(draft.autoReleaseEnabled),
          autoReleaseAfterDays: Number(draft.autoReleaseAfterDays ?? 0),
          requireDualApproval: Boolean(draft.requireDualApproval),
          notifyHoursBeforeRelease: Number(draft.notifyHoursBeforeRelease ?? 0),
          holdLargePaymentsThreshold: Number(draft.holdLargePaymentsThreshold ?? 0),
        },
        workspaceParams,
      );
      triggerToast('Rules saved');
      refreshOverview();
    },
    [refreshOverview, triggerToast, workspaceParams],
  );

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      refreshOverview,
      refreshAccounts,
      refreshTransactions,
      triggerToast,
      openAccountDrawer,
      closeAccountDrawer,
      openTransactionWizard,
      closeTransactionWizard,
      openActivityDrawer,
      closeActivityDrawer,
      saveAccount,
      reconcileAccount,
      saveTransaction,
      releaseTransaction,
      refundTransaction,
      saveSettings,
      DEFAULT_ACCOUNT_DRAFT,
      DEFAULT_TRANSACTION_DRAFT,
    }),
    [
      state,
      refreshOverview,
      refreshAccounts,
      refreshTransactions,
      triggerToast,
      openAccountDrawer,
      closeAccountDrawer,
      openTransactionWizard,
      closeTransactionWizard,
      openActivityDrawer,
      closeActivityDrawer,
      saveAccount,
      reconcileAccount,
      saveTransaction,
      releaseTransaction,
      refundTransaction,
      saveSettings,
    ],
  );

  return <EscrowContext.Provider value={contextValue}>{children}</EscrowContext.Provider>;
}

EscrowProvider.propTypes = {
  children: PropTypes.node,
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
};

EscrowProvider.defaultProps = {
  children: null,
  workspaceId: undefined,
  workspaceSlug: undefined,
};

export function useEscrow() {
  const context = useContext(EscrowContext);
  if (!context) {
    throw new Error('useEscrow must be used inside EscrowProvider');
  }
  return context;
}

export default EscrowContext;
