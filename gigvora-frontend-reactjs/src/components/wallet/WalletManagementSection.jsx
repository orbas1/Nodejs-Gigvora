import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useWalletManagement from '../../hooks/useWalletManagement.js';
import DataStatus from '../DataStatus.jsx';
import WalletDrawer from './WalletDrawer.jsx';
import WalletSummaryPanel from './panels/WalletSummaryPanel.jsx';
import FundingSourcesPanel from './panels/FundingSourcesPanel.jsx';
import TransferRulesPanel from './panels/TransferRulesPanel.jsx';
import TransferMovesPanel from './panels/TransferMovesPanel.jsx';
import EscrowPanel from './panels/EscrowPanel.jsx';
import LedgerPanel from './panels/LedgerPanel.jsx';
import WalletAlertsPanel from './panels/WalletAlertsPanel.jsx';
import WalletStatusPill from './WalletStatusPill.jsx';
import { formatCurrency, formatDate, formatDateTime, formatStatus } from './walletFormatting.js';

const PANELS = [
  { key: 'summary', label: 'Summary' },
  { key: 'sources', label: 'Sources' },
  { key: 'rules', label: 'Rules' },
  { key: 'moves', label: 'Moves' },
  { key: 'escrow', label: 'Escrow' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'alerts', label: 'Alerts' },
];

const FUNDING_SOURCE_TYPES = [
  { value: 'bank_account', label: 'Bank' },
  { value: 'card', label: 'Card' },
  { value: 'manual_bank_transfer', label: 'Manual' },
  { value: 'digital_wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
];

const TRANSFER_TYPES = [
  { value: 'payout', label: 'Payout' },
  { value: 'top_up', label: 'Top up' },
  { value: 'escrow_reserve', label: 'Reserve' },
  { value: 'escrow_release', label: 'Release' },
  { value: 'refund', label: 'Refund' },
];

const TRANSFER_CADENCES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

function parseNumber(value) {
  if (value === '' || value == null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  try {
    const date = new Date(value);
    const tzOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - tzOffset * 60000);
    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
}

function WalletManagementSection({ userId }) {
  const { data, loading, error, actions } = useWalletManagement(userId);
  const [activePanel, setActivePanel] = useState('summary');
  const [drawer, setDrawer] = useState({ view: null, mode: null, data: null });

  const summary = data?.summary ?? {};
  const access = data?.access ?? { canManage: false };
  const accounts = data?.accounts ?? [];
  const fundingSources = data?.fundingSources?.items ?? [];
  const primaryFundingSourceId = data?.fundingSources?.primaryId ?? null;
  const transferRules = data?.transferRules ?? [];
  const transfers = data?.transfers?.recent ?? [];
  const pendingTransfers = transfers.filter((item) => ['pending', 'scheduled', 'processing'].includes(item.status));
  const escrowAccounts = data?.escrow?.accounts ?? [];
  const ledgerEntries = data?.ledger?.entries ?? [];
  const alerts = data?.alerts ?? [];

  const defaultCurrency = summary.currency ?? accounts[0]?.currencyCode ?? 'USD';
  const defaultAccountId = accounts[0]?.id != null ? String(accounts[0].id) : '';

  const fundingOptions = useMemo(
    () => fundingSources.map((source) => ({ value: String(source.id), label: source.label })),
    [fundingSources],
  );

  const accountOptions = useMemo(
    () => accounts.map((account) => ({ value: String(account.id), label: account.label ?? formatStatus(account.accountType) })),
    [accounts],
  );

  const buildFundingDefaults = () => ({
    label: '',
    type: FUNDING_SOURCE_TYPES[0].value,
    provider: '',
    lastFour: '',
    makePrimary: fundingSources.length === 0,
    walletAccountId: defaultAccountId,
    currencyCode: defaultCurrency,
  });

  const buildRuleDefaults = () => ({
    name: '',
    transferType: TRANSFER_TYPES[0].value,
    cadence: TRANSFER_CADENCES[3].value,
    thresholdAmount: '',
    executionDay: '',
    fundingSourceId: '',
    walletAccountId: defaultAccountId,
  });

  const buildTransferDefaults = () => ({
    amount: '',
    transferType: TRANSFER_TYPES[0].value,
    fundingSourceId: '',
    walletAccountId: defaultAccountId,
    notes: '',
    scheduledAt: '',
  });

  const [fundingForm, setFundingForm] = useState(buildFundingDefaults);
  const [fundingErrors, setFundingErrors] = useState({});
  const [fundingSubmitting, setFundingSubmitting] = useState(false);
  const [fundingFeedback, setFundingFeedback] = useState(null);

  const [ruleForm, setRuleForm] = useState(buildRuleDefaults);
  const [ruleErrors, setRuleErrors] = useState({});
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [ruleFeedback, setRuleFeedback] = useState(null);

  const [transferForm, setTransferForm] = useState(buildTransferDefaults);
  const [transferErrors, setTransferErrors] = useState({});
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState(null);
  const [globalFeedback, setGlobalFeedback] = useState(null);

  const inputClassName = (hasError) =>
    `w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 ${
      hasError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-accent'
    }`;

  const showGlobalFeedback = (type, message) => {
    setGlobalFeedback({ type, message });
  };

  const closeDrawer = () => {
    setDrawer({ view: null, mode: null, data: null });
    setFundingErrors({});
    setFundingFeedback(null);
    setFundingSubmitting(false);
    setRuleErrors({});
    setRuleFeedback(null);
    setRuleSubmitting(false);
    setTransferErrors({});
    setTransferFeedback(null);
    setTransferSubmitting(false);
  };

  const openFundingDrawer = (mode, source = null) => {
    if (mode === 'edit' && source) {
      setFundingForm({
        label: source.label ?? '',
        type: source.type ?? FUNDING_SOURCE_TYPES[0].value,
        provider: source.provider ?? '',
        lastFour: source.lastFour ?? '',
        makePrimary: Boolean(source.isPrimary),
        walletAccountId: source.walletAccountId != null ? String(source.walletAccountId) : defaultAccountId,
        currencyCode: source.currencyCode ?? defaultCurrency,
      });
    } else {
      setFundingForm(buildFundingDefaults());
    }
    setFundingErrors({});
    setFundingFeedback(null);
    setDrawer({ view: 'funding', mode, data: source });
  };

  const openRuleDrawer = (mode, rule = null) => {
    if (mode === 'edit' && rule) {
      setRuleForm({
        name: rule.name ?? '',
        transferType: rule.transferType ?? TRANSFER_TYPES[0].value,
        cadence: rule.cadence ?? TRANSFER_CADENCES[3].value,
        thresholdAmount: rule.thresholdAmount != null ? String(rule.thresholdAmount) : '',
        executionDay: rule.executionDay != null ? String(rule.executionDay) : '',
        fundingSourceId: rule.fundingSourceId != null ? String(rule.fundingSourceId) : '',
        walletAccountId: rule.walletAccountId != null ? String(rule.walletAccountId) : defaultAccountId,
      });
    } else {
      setRuleForm(buildRuleDefaults());
    }
    setRuleErrors({});
    setRuleFeedback(null);
    setDrawer({ view: 'rule', mode, data: rule });
  };

  const openTransferDrawer = (mode, transfer = null) => {
    if (mode === 'edit' && transfer) {
      setTransferForm({
        amount: transfer.amount != null ? String(transfer.amount) : '',
        transferType: transfer.transferType ?? TRANSFER_TYPES[0].value,
        fundingSourceId: transfer.fundingSourceId != null ? String(transfer.fundingSourceId) : '',
        walletAccountId: transfer.walletAccountId != null ? String(transfer.walletAccountId) : defaultAccountId,
        notes: transfer.notes ?? '',
        scheduledAt: toDateTimeLocal(transfer.scheduledAt),
      });
    } else {
      setTransferForm(buildTransferDefaults());
    }
    setTransferErrors({});
    setTransferFeedback(null);
    setDrawer({ view: 'transfer', mode, data: transfer });
  };

  const openAccountDetail = (account) => {
    setDrawer({ view: 'accountDetail', mode: 'view', data: account });
  };

  const openEscrowDetail = (account) => {
    setDrawer({ view: 'escrowDetail', mode: 'view', data: account });
  };

  const openTransferDetail = (transfer) => {
    setDrawer({ view: 'transferDetail', mode: 'view', data: transfer });
  };

  const openLedgerEntryDetail = (entry) => {
    setDrawer({ view: 'ledgerEntry', mode: 'view', data: entry });
  };

  const validateFundingForm = () => {
    const errors = {};
    if (!fundingForm.label?.trim()) {
      errors.label = 'Name is required.';
    }
    if (!fundingForm.type) {
      errors.type = 'Choose a type.';
    }
    if (fundingForm.lastFour && !/^[0-9]{2,8}$/.test(fundingForm.lastFour.trim())) {
      errors.lastFour = 'Digits only.';
    }
    return errors;
  };

  const validateRuleForm = () => {
    const errors = {};
    if (!ruleForm.name?.trim()) {
      errors.name = 'Name is required.';
    }
    const threshold = parseNumber(ruleForm.thresholdAmount);
    if (ruleForm.thresholdAmount !== '' && (threshold == null || threshold < 0)) {
      errors.thresholdAmount = 'Enter a valid amount.';
    }
    if (ruleForm.executionDay) {
      const day = Number(ruleForm.executionDay);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        errors.executionDay = '1 to 31 only.';
      }
    }
    return errors;
  };

  const validateTransferForm = () => {
    const errors = {};
    const amount = parseNumber(transferForm.amount);
    if (amount == null || amount <= 0) {
      errors.amount = 'Enter an amount.';
    }
    return errors;
  };

  const handleFundingSubmit = async (event) => {
    event.preventDefault();
    const validation = validateFundingForm();
    setFundingErrors(validation);
    if (Object.keys(validation).length) {
      setFundingFeedback({ type: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setFundingSubmitting(true);
    setFundingFeedback(null);
    try {
      const payload = {
        walletAccountId: fundingForm.walletAccountId || undefined,
        type: fundingForm.type,
        label: fundingForm.label.trim(),
        provider: fundingForm.provider?.trim() || undefined,
        lastFour: fundingForm.lastFour?.trim() || undefined,
        makePrimary: Boolean(fundingForm.makePrimary),
        currencyCode: fundingForm.currencyCode || undefined,
      };
      if (drawer.mode === 'edit' && drawer.data) {
        await actions.updateFundingSource(drawer.data.id, payload);
      } else {
        await actions.createFundingSource(payload);
      }
      closeDrawer();
      showGlobalFeedback('success', 'Funding source saved.');
    } catch (err) {
      setFundingFeedback({ type: 'error', message: err?.message ?? 'Could not save source.' });
    } finally {
      setFundingSubmitting(false);
    }
  };

  const handleRuleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateRuleForm();
    setRuleErrors(validation);
    if (Object.keys(validation).length) {
      setRuleFeedback({ type: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setRuleSubmitting(true);
    setRuleFeedback(null);
    try {
      const payload = {
        walletAccountId: ruleForm.walletAccountId || undefined,
        fundingSourceId: ruleForm.fundingSourceId || undefined,
        name: ruleForm.name.trim(),
        transferType: ruleForm.transferType,
        cadence: ruleForm.cadence,
        thresholdAmount: parseNumber(ruleForm.thresholdAmount) ?? 0,
        executionDay: ruleForm.executionDay ? Number(ruleForm.executionDay) : undefined,
      };
      if (drawer.mode === 'edit' && drawer.data) {
        await actions.updateTransferRule(drawer.data.id, payload);
      } else {
        await actions.createTransferRule(payload);
      }
      closeDrawer();
      showGlobalFeedback('success', 'Transfer rule saved.');
    } catch (err) {
      setRuleFeedback({ type: 'error', message: err?.message ?? 'Could not save rule.' });
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleTransferSubmit = async (event) => {
    event.preventDefault();
    const validation = validateTransferForm();
    setTransferErrors(validation);
    if (Object.keys(validation).length) {
      setTransferFeedback({ type: 'error', message: 'Fix the highlighted fields.' });
      return;
    }
    setTransferSubmitting(true);
    setTransferFeedback(null);
    try {
      const payload = {
        walletAccountId: transferForm.walletAccountId || undefined,
        fundingSourceId: transferForm.fundingSourceId || undefined,
        amount: parseNumber(transferForm.amount),
        transferType: transferForm.transferType,
        notes: transferForm.notes?.trim() || undefined,
        scheduledAt: transferForm.scheduledAt ? new Date(transferForm.scheduledAt).toISOString() : undefined,
      };
      if (drawer.mode === 'edit' && drawer.data) {
        await actions.updateTransferRequest(drawer.data.id, payload);
      } else {
        await actions.createTransferRequest(payload);
      }
      closeDrawer();
      showGlobalFeedback('success', 'Transfer move saved.');
    } catch (err) {
      setTransferFeedback({ type: 'error', message: err?.message ?? 'Could not save transfer.' });
    } finally {
      setTransferSubmitting(false);
    }
  };

  const handleMakePrimary = async (source) => {
    try {
      await actions.updateFundingSource(source.id, { makePrimary: true });
      showGlobalFeedback('success', `${source.label ?? 'Funding source'} set as primary.`);
    } catch (err) {
      showGlobalFeedback('error', err?.message ?? 'Could not update primary funding source.');
    }
  };

  const handlePauseRule = async (rule) => {
    try {
      await actions.updateTransferRule(rule.id, { status: 'paused' });
      showGlobalFeedback('success', 'Transfer rule paused.');
    } catch (err) {
      showGlobalFeedback('error', err?.message ?? 'Could not pause rule.');
    }
  };

  const handleResumeRule = async (rule) => {
    try {
      await actions.updateTransferRule(rule.id, { status: 'active' });
      showGlobalFeedback('success', 'Transfer rule resumed.');
    } catch (err) {
      showGlobalFeedback('error', err?.message ?? 'Could not resume rule.');
    }
  };

  const handleRemoveRule = async (rule) => {
    try {
      await actions.deleteTransferRule(rule.id);
      showGlobalFeedback('success', 'Transfer rule removed.');
    } catch (err) {
      showGlobalFeedback('error', err?.message ?? 'Could not remove rule.');
    }
  };

  const renderFeedback = (feedback) => {
    if (!feedback) {
      return null;
    }
    const { type, message, onClose } = feedback;
    const tone = type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600';
    return (
      <div
        className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${tone}`}
        role={type === 'error' ? 'alert' : undefined}
      >
        <span className="flex-1">{message}</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-wide text-current transition hover:opacity-80"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    );
  };

  const renderDrawer = () => {
    const open = Boolean(drawer.view);
    if (!open) {
      return null;
    }

    if (drawer.view === 'funding') {
      const formId = 'wallet-funding-form';
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={drawer.mode === 'edit' ? 'Edit source' : 'Add source'}
          subtitle="Connect secure payout methods"
          footer={
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                form={formId}
                disabled={fundingSubmitting}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {fundingSubmitting ? 'Saving…' : 'Save source'}
              </button>
            </div>
          }
        >
          <form id={formId} onSubmit={handleFundingSubmit} className="flex flex-col gap-4">
            {renderFeedback(fundingFeedback)}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-label">
                Name
              </label>
              <input
                id="funding-label"
                type="text"
                value={fundingForm.label}
                onChange={(event) => setFundingForm((prev) => ({ ...prev, label: event.target.value }))}
                className={inputClassName(Boolean(fundingErrors.label))}
                placeholder="Primary bank"
              />
              {fundingErrors.label ? <p className="text-xs text-rose-500">{fundingErrors.label}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-type">
                  Type
                </label>
                <select
                  id="funding-type"
                  value={fundingForm.type}
                  onChange={(event) => setFundingForm((prev) => ({ ...prev, type: event.target.value }))}
                  className={inputClassName(Boolean(fundingErrors.type))}
                >
                  {FUNDING_SOURCE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fundingErrors.type ? <p className="text-xs text-rose-500">{fundingErrors.type}</p> : null}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-provider">
                  Provider
                </label>
                <input
                  id="funding-provider"
                  type="text"
                  value={fundingForm.provider}
                  onChange={(event) => setFundingForm((prev) => ({ ...prev, provider: event.target.value }))}
                  className={inputClassName(false)}
                  placeholder="Bank name"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-lastFour">
                  Last digits
                </label>
                <input
                  id="funding-lastFour"
                  type="text"
                  value={fundingForm.lastFour}
                  onChange={(event) => setFundingForm((prev) => ({ ...prev, lastFour: event.target.value }))}
                  className={inputClassName(Boolean(fundingErrors.lastFour))}
                  placeholder="1234"
                />
                {fundingErrors.lastFour ? <p className="text-xs text-rose-500">{fundingErrors.lastFour}</p> : null}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-currency">
                  Currency
                </label>
                <input
                  id="funding-currency"
                  type="text"
                  value={fundingForm.currencyCode}
                  onChange={(event) =>
                    setFundingForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase().slice(0, 3) }))
                  }
                  className={inputClassName(false)}
                  placeholder="USD"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="funding-account">
                Wallet account
              </label>
              <select
                id="funding-account"
                value={fundingForm.walletAccountId}
                onChange={(event) => setFundingForm((prev) => ({ ...prev, walletAccountId: event.target.value }))}
                className={inputClassName(false)}
              >
                <option value="">Default</option>
                {accountOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(fundingForm.makePrimary)}
                onChange={(event) => setFundingForm((prev) => ({ ...prev, makePrimary: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Make this the primary source
            </label>
          </form>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'rule') {
      const formId = 'wallet-rule-form';
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={drawer.mode === 'edit' ? 'Edit rule' : 'New rule'}
          subtitle="Automate payouts and reserves"
          footer={
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                form={formId}
                disabled={ruleSubmitting}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ruleSubmitting ? 'Saving…' : 'Save rule'}
              </button>
            </div>
          }
        >
          <form id={formId} onSubmit={handleRuleSubmit} className="flex flex-col gap-4">
            {renderFeedback(ruleFeedback)}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-name">
                Name
              </label>
              <input
                id="rule-name"
                type="text"
                value={ruleForm.name}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClassName(Boolean(ruleErrors.name))}
                placeholder="Monthly payout"
              />
              {ruleErrors.name ? <p className="text-xs text-rose-500">{ruleErrors.name}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-transferType">
                  Transfer
                </label>
                <select
                  id="rule-transferType"
                  value={ruleForm.transferType}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, transferType: event.target.value }))}
                  className={inputClassName(false)}
                >
                  {TRANSFER_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-cadence">
                  Every
                </label>
                <select
                  id="rule-cadence"
                  value={ruleForm.cadence}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, cadence: event.target.value }))}
                  className={inputClassName(false)}
                >
                  {TRANSFER_CADENCES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-threshold">
                  Threshold
                </label>
                <input
                  id="rule-threshold"
                  type="number"
                  value={ruleForm.thresholdAmount}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, thresholdAmount: event.target.value }))}
                  className={inputClassName(Boolean(ruleErrors.thresholdAmount))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {ruleErrors.thresholdAmount ? <p className="text-xs text-rose-500">{ruleErrors.thresholdAmount}</p> : null}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-day">
                  Day
                </label>
                <input
                  id="rule-day"
                  type="number"
                  value={ruleForm.executionDay}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, executionDay: event.target.value }))}
                  className={inputClassName(Boolean(ruleErrors.executionDay))}
                  placeholder="15"
                  min="1"
                  max="31"
                />
                {ruleErrors.executionDay ? <p className="text-xs text-rose-500">{ruleErrors.executionDay}</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-source">
                Source
              </label>
              <select
                id="rule-source"
                value={ruleForm.fundingSourceId}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, fundingSourceId: event.target.value }))}
                className={inputClassName(false)}
              >
                <option value="">Any primary</option>
                {fundingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="rule-account">
                Wallet account
              </label>
              <select
                id="rule-account"
                value={ruleForm.walletAccountId}
                onChange={(event) => setRuleForm((prev) => ({ ...prev, walletAccountId: event.target.value }))}
                className={inputClassName(false)}
              >
                <option value="">Default</option>
                {accountOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'transfer') {
      const formId = 'wallet-transfer-form';
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={drawer.mode === 'edit' ? 'Edit move' : 'Schedule move'}
          subtitle="Send and receive wallet funds"
          footer={
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                form={formId}
                disabled={transferSubmitting}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {transferSubmitting ? 'Saving…' : 'Save move'}
              </button>
            </div>
          }
        >
          <form id={formId} onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
            {renderFeedback(transferFeedback)}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-amount">
                Amount
              </label>
              <input
                id="transfer-amount"
                type="number"
                value={transferForm.amount}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, amount: event.target.value }))}
                className={inputClassName(Boolean(transferErrors.amount))}
                placeholder="1000"
                min="0"
                step="0.01"
              />
              {transferErrors.amount ? <p className="text-xs text-rose-500">{transferErrors.amount}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-type">
                  Transfer
                </label>
                <select
                  id="transfer-type"
                  value={transferForm.transferType}
                  onChange={(event) => setTransferForm((prev) => ({ ...prev, transferType: event.target.value }))}
                  className={inputClassName(false)}
                >
                  {TRANSFER_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-source">
                  Source
                </label>
                <select
                  id="transfer-source"
                  value={transferForm.fundingSourceId}
                  onChange={(event) => setTransferForm((prev) => ({ ...prev, fundingSourceId: event.target.value }))}
                  className={inputClassName(false)}
                >
                  <option value="">Primary</option>
                  {fundingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-account">
                Wallet account
              </label>
              <select
                id="transfer-account"
                value={transferForm.walletAccountId}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, walletAccountId: event.target.value }))}
                className={inputClassName(false)}
              >
                <option value="">Default</option>
                {accountOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-scheduledAt">
                Schedule
              </label>
              <input
                id="transfer-scheduledAt"
                type="datetime-local"
                value={transferForm.scheduledAt}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                className={inputClassName(false)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="transfer-notes">
                Notes
              </label>
              <textarea
                id="transfer-notes"
                value={transferForm.notes}
                onChange={(event) => setTransferForm((prev) => ({ ...prev, notes: event.target.value }))}
                className={`${inputClassName(false)} min-h-[120px]`}
                placeholder="Optional reference"
              />
            </div>
          </form>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'accountDetail') {
      const account = drawer.data ?? {};
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={account.label ?? formatStatus(account.accountType)}
          subtitle="Live wallet balances"
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Balance</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatCurrency(account.currentBalance, account.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Available</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatCurrency(account.availableBalance, account.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">On hold</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatCurrency(account.pendingHoldBalance, account.currencyCode)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Last entry</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(account.lastEntryAt)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Recent ledger</h4>
                <WalletStatusPill value={account.complianceStatus} />
              </div>
              {account.ledger?.length ? (
                <div className="flex flex-col gap-2">
                  {account.ledger.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => openLedgerEntryDetail(entry)}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-accent hover:text-accent"
                    >
                      <span className="truncate">{entry.reference ?? formatStatus(entry.entryType)}</span>
                      <span className="font-semibold">{formatCurrency(entry.amount, account.currencyCode)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No ledger entries yet.</p>
              )}
            </div>
          </div>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'transferDetail') {
      const transfer = drawer.data ?? {};
      const walletLabel = transfer.walletAccountId
        ? accounts.find((account) => account.id === transfer.walletAccountId)?.label ?? 'Wallet'
        : 'Wallet';
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={formatStatus(transfer.transferType)}
          subtitle="Transfer details"
          footer={
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => openTransferDrawer('edit', transfer)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 text-sm text-slate-600">
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>{formatCurrency(transfer.amount, transfer.currencyCode ?? defaultCurrency)}</span>
              <WalletStatusPill value={transfer.status} />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Source</span>
                <span>{transfer.fundingSource?.label ?? 'Primary'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Scheduled</span>
                <span>{formatDateTime(transfer.scheduledAt ?? transfer.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Wallet</span>
                <span>{walletLabel}</span>
              </div>
            </div>
            {transfer.notes ? <p className="rounded-2xl bg-slate-50 p-3 text-slate-500">{transfer.notes}</p> : null}
          </div>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'ledgerEntry') {
      const entry = drawer.data ?? {};
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={entry.reference ?? formatStatus(entry.entryType)}
          subtitle="Ledger entry"
        >
          <div className="flex flex-col gap-4 text-sm text-slate-600">
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>{formatCurrency(entry.amount, entry.currencyCode ?? defaultCurrency)}</span>
              <span>{formatDateTime(entry.occurredAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Balance after</span>
              <span>{formatCurrency(entry.balanceAfter, entry.currencyCode ?? defaultCurrency)}</span>
            </div>
            {entry.metadata && Object.keys(entry.metadata).length ? (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-900">Metadata</span>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(entry.metadata, null, 2)}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </WalletDrawer>
      );
    }

    if (drawer.view === 'escrowDetail') {
      const escrow = drawer.data ?? {};
      return (
        <WalletDrawer
          open
          onClose={closeDrawer}
          title={escrow.name ?? escrow.label ?? 'Escrow'}
          subtitle="Escrow reserve overview"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Balance</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatCurrency(escrow.currentBalance, escrow.currencyCode ?? defaultCurrency)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Held</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatCurrency(escrow.heldBalance, escrow.currencyCode ?? defaultCurrency)}
                </p>
              </div>
            </div>
            {escrow.transactions?.length ? (
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Recent transactions</h4>
                {escrow.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <span>{formatDate(transaction.createdAt)}</span>
                    <span className="font-semibold">{formatCurrency(transaction.amount, escrow.currencyCode ?? defaultCurrency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No escrow transactions yet.</p>
            )}
          </div>
        </WalletDrawer>
      );
    }

    return null;
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'sources':
        return (
          <FundingSourcesPanel
            sources={fundingSources}
            primaryId={primaryFundingSourceId}
            onCreate={() => openFundingDrawer('create')}
            onEdit={(source) => openFundingDrawer('edit', source)}
            onMakePrimary={handleMakePrimary}
          />
        );
      case 'rules':
        return (
          <TransferRulesPanel
            rules={transferRules}
            onCreate={() => openRuleDrawer('create')}
            onEdit={(rule) => openRuleDrawer('edit', rule)}
            onArchive={handlePauseRule}
            onRestore={handleResumeRule}
            onRemove={handleRemoveRule}
          />
        );
      case 'moves':
        return (
          <TransferMovesPanel
            transfers={transfers}
            onCreate={() => openTransferDrawer('create')}
            onSelectTransfer={openTransferDetail}
          />
        );
      case 'escrow':
        return <EscrowPanel accounts={escrowAccounts} onSelectAccount={openEscrowDetail} />;
      case 'ledger':
        return <LedgerPanel entries={ledgerEntries} summary={summary} onSelectEntry={openLedgerEntryDetail} />;
      case 'alerts':
        return <WalletAlertsPanel alerts={alerts} />;
      case 'summary':
      default:
        return (
          <WalletSummaryPanel
            summary={summary}
            accounts={accounts}
            pendingTransfers={pendingTransfers}
            onSelectAccount={openAccountDetail}
            onOpenTransfers={() => setActivePanel('moves')}
          />
        );
    }
  };

  return (
    <section
      id="wallet-section"
      className="relative flex min-h-[840px] flex-col rounded-[32px] border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex flex-col gap-6 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-white">
            W
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold text-slate-900">Wallet</h2>
            <p className="text-sm text-slate-500">Balances, rules, and escrow in one canvas</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <div className="flex items-center gap-2">
            <WalletStatusPill value={summary.complianceStatus} />
            <WalletStatusPill value={summary.ledgerIntegrity} />
          </div>
          <DataStatus
            loading={loading}
            error={error}
            onRefresh={actions.refresh}
            lastUpdated={data?.metadata?.generatedAt}
          />
        </div>
      </header>
      <nav className="grid gap-2 px-6 pb-4 pt-4 sm:grid-cols-4 lg:grid-cols-7">
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            type="button"
            onClick={() => setActivePanel(panel.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activePanel === panel.key
                ? 'bg-accent text-white shadow'
                : 'border border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {panel.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
        {globalFeedback ? (
          <div className="mb-4">
            {renderFeedback({ ...globalFeedback, onClose: () => setGlobalFeedback(null) })}
          </div>
        ) : null}
        {renderPanel()}
      </div>
      {renderDrawer()}
      {!access.canManage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[32px] bg-white/80 p-6 text-center text-sm font-semibold text-slate-500">
          Wallet access is restricted for this role.
        </div>
      ) : null}
    </section>
  );
}

WalletManagementSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default WalletManagementSection;
