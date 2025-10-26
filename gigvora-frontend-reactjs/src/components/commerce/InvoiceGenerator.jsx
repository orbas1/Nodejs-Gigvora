import { useMemo, useReducer, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  formatCurrency,
  formatDate,
} from '../wallet/walletFormatting.js';

function createLineItem(overrides = {}) {
  return {
    id: overrides.id ?? `item-${Math.random().toString(36).slice(2, 9)}`,
    description: overrides.description ?? '',
    quantity: Number.isFinite(Number(overrides.quantity)) ? Number(overrides.quantity) : 1,
    unitCost: Number.isFinite(Number(overrides.unitCost)) ? Number(overrides.unitCost) : 0,
    taxRateId: overrides.taxRateId ?? null,
    metadata: overrides.metadata ?? {},
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...action.payload,
        items: action.payload.items?.length ? action.payload.items.map((item) => createLineItem(item)) : state.items,
      };
    case 'update-field':
      return {
        ...state,
        [action.payload.field]: action.payload.value,
      };
    case 'add-item':
      return {
        ...state,
        items: [...state.items, createLineItem(action.payload)],
      };
    case 'update-item':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, [action.payload.field]: action.payload.field === 'description' ? action.payload.value : Number(action.payload.value) }
            : item,
        ),
      };
    case 'remove-item':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    case 'set-item':
      return {
        ...state,
        items: state.items.map((item) => (item.id === action.payload.id ? { ...item, ...action.payload.value } : item)),
      };
    default:
      return state;
  }
}

const initialState = {
  invoiceNumber: '',
  clientId: '',
  issueDate: new Date().toISOString(),
  dueDate: '',
  notes: '',
  paymentTermsId: '',
  discountType: 'flat',
  discountValue: 0,
  shipping: 0,
  items: [createLineItem()],
};

function buildSummary({ items, discountType, discountValue, shipping, taxRates, currency }) {
  const breakdown = items.reduce(
    (acc, item) => {
      const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
      const unitCost = Number.isFinite(Number(item.unitCost)) ? Number(item.unitCost) : 0;
      const lineSubtotal = quantity * unitCost;
      acc.subtotal += lineSubtotal;

      const taxRate = taxRates.find((rate) => rate.id === item.taxRateId);
      if (taxRate) {
        const taxAmount = (lineSubtotal * taxRate.percentage) / 100;
        acc.tax += taxAmount;
        if (!acc.taxByRate[taxRate.id]) {
          acc.taxByRate[taxRate.id] = { label: taxRate.label, amount: 0 };
        }
        acc.taxByRate[taxRate.id].amount += taxAmount;
      }

      return acc;
    },
    { subtotal: 0, tax: 0, taxByRate: {} },
  );

  const discountValueNumber = Number.isFinite(Number(discountValue)) ? Number(discountValue) : 0;
  const discount =
    discountType === 'percent' ? Math.min(breakdown.subtotal, (breakdown.subtotal * discountValueNumber) / 100) : discountValueNumber;
  const shippingValue = Number.isFinite(Number(shipping)) ? Number(shipping) : 0;
  const total = breakdown.subtotal - discount + breakdown.tax + shippingValue;

  return {
    subtotal: formatCurrency(breakdown.subtotal, currency),
    discount: formatCurrency(discount, currency),
    tax: formatCurrency(breakdown.tax, currency),
    shipping: formatCurrency(shippingValue, currency),
    total: formatCurrency(total, currency),
    taxByRate: Object.values(breakdown.taxByRate).map((entry) => ({
      label: entry.label,
      amount: formatCurrency(entry.amount, currency),
    })),
  };
}

export default function InvoiceGenerator({
  draft,
  contacts,
  currency,
  taxRates,
  paymentTerms,
  onPreview,
  onGenerate,
  onSaveTemplate,
  onTrackEvent,
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (draft) {
      dispatch({ type: 'hydrate', payload: draft });
    }
  }, [draft]);

  const selectedTerm = paymentTerms.find((term) => term.id === state.paymentTermsId);
  const computedDueDate = useMemo(() => {
    if (state.dueDate) {
      return state.dueDate;
    }
    if (!state.issueDate || !selectedTerm?.days) {
      return '';
    }
    const issue = new Date(state.issueDate);
    const due = new Date(issue.getTime() + selectedTerm.days * 24 * 60 * 60 * 1000);
    return due.toISOString();
  }, [state.dueDate, state.issueDate, selectedTerm]);

  const summary = useMemo(
    () =>
      buildSummary({
        items: state.items,
        discountType: state.discountType,
        discountValue: state.discountValue,
        shipping: state.shipping,
        taxRates,
        currency,
      }),
    [state.items, state.discountType, state.discountValue, state.shipping, taxRates, currency],
  );

  const updateField = useCallback((field, value) => {
    dispatch({ type: 'update-field', payload: { field, value } });
    onTrackEvent?.('invoice_field_updated', { field });
  }, [onTrackEvent]);

  const updateItem = useCallback((id, field, value) => {
    dispatch({ type: 'update-item', payload: { id, field, value } });
    onTrackEvent?.('invoice_line_updated', { lineId: id, field });
  }, [onTrackEvent]);

  const changeItemTax = useCallback((id, taxRateId) => {
    dispatch({ type: 'set-item', payload: { id, value: { taxRateId } } });
    onTrackEvent?.('invoice_line_tax_updated', { lineId: id, taxRateId });
  }, [onTrackEvent]);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'remove-item', payload: { id } });
    onTrackEvent?.('invoice_line_removed', { lineId: id });
  }, [onTrackEvent]);

  const addItem = useCallback(() => {
    dispatch({ type: 'add-item', payload: {} });
    onTrackEvent?.('invoice_line_added');
  }, [onTrackEvent]);

  const handlePreview = useCallback(() => {
    const payload = { ...state, dueDate: computedDueDate || state.dueDate };
    onTrackEvent?.('invoice_preview_requested', { invoiceNumber: state.invoiceNumber });
    onPreview?.(payload);
  }, [state, computedDueDate, onPreview, onTrackEvent]);

  const handleGenerate = useCallback(() => {
    const payload = { ...state, dueDate: computedDueDate || state.dueDate };
    onTrackEvent?.('invoice_generation_requested', { invoiceNumber: state.invoiceNumber });
    onGenerate?.(payload);
  }, [state, computedDueDate, onGenerate, onTrackEvent]);

  const handleSaveTemplate = useCallback(() => {
    const payload = { ...state, dueDate: computedDueDate || state.dueDate };
    onTrackEvent?.('invoice_template_saved', { invoiceNumber: state.invoiceNumber });
    onSaveTemplate?.(payload);
  }, [state, computedDueDate, onSaveTemplate, onTrackEvent]);

  return (
    <section className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Invoice generator</h2>
          <p className="mt-1 text-sm text-slate-500">
            Assemble compliant billing packets with live totals, tax breakdowns, and delivery-ready metadata.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-right text-xs uppercase tracking-wide text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
            Last refreshed {formatDate(new Date().toISOString())}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Secure draft mode</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-900/5 p-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Invoice number</span>
              <input
                value={state.invoiceNumber}
                onChange={(event) => updateField('invoiceNumber', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="INV-2024-001"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Client</span>
              <select
                value={state.clientId}
                onChange={(event) => updateField('clientId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select a client</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Issue date</span>
              <input
                type="date"
                value={state.issueDate ? new Date(state.issueDate).toISOString().slice(0, 10) : ''}
                onChange={(event) => updateField('issueDate', event.target.value ? new Date(event.target.value).toISOString() : '')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Due date</span>
              <input
                type="date"
                value={computedDueDate ? new Date(computedDueDate).toISOString().slice(0, 10) : ''}
                onChange={(event) => updateField('dueDate', event.target.value ? new Date(event.target.value).toISOString() : '')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Payment terms</span>
              <select
                value={state.paymentTermsId}
                onChange={(event) => updateField('paymentTermsId', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select terms</option>
                {paymentTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-600">Notes</span>
              <textarea
                value={state.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Payment is due within 14 days. Thank you for your partnership."
              />
            </label>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Line items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                Add item
              </button>
            </div>
            <div className="space-y-4">
              {state.items.map((item, index) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-600">Item {index + 1}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                      {item.metadata?.lastUpdated ? `Updated ${formatDate(item.metadata.lastUpdated)}` : 'Realtime totals'}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-1 text-xs">
                      <span className="font-semibold uppercase tracking-wide text-slate-500">Description</span>
                      <textarea
                        value={item.description}
                        onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Discovery workshop"
                      />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="font-semibold uppercase tracking-wide text-slate-500">Quantity</span>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="font-semibold uppercase tracking-wide text-slate-500">Unit cost</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(event) => updateItem(item.id, 'unitCost', event.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </label>
                    <label className="space-y-1 text-xs">
                      <span className="font-semibold uppercase tracking-wide text-slate-500">Tax rate</span>
                      <select
                        value={item.taxRateId ?? ''}
                        onChange={(event) => changeItemTax(item.id, event.target.value || null)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">No tax</option>
                        {taxRates.map((rate) => (
                          <option key={rate.id} value={rate.id}>
                            {rate.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <BanknotesIcon className="h-4 w-4" aria-hidden="true" />
                      <span>{formatCurrency(item.quantity * item.unitCost || 0, currency)} line total</span>
                    </div>
                    {state.items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-900/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Adjustments</h3>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Discount type</span>
                <select
                  value={state.discountType}
                  onChange={(event) => updateField('discountType', event.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="flat">Flat amount</option>
                  <option value="percent">Percentage</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Discount value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.discountValue}
                  onChange={(event) => updateField('discountValue', event.target.value)}
                  className="w-32 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Shipping</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.shipping}
                  onChange={(event) => updateField('shipping', event.target.value)}
                  className="w-32 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-slate-900">{summary.subtotal}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Discount</dt>
                <dd className="font-semibold text-emerald-600">{summary.discount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Shipping</dt>
                <dd className="font-semibold text-slate-900">{summary.shipping}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tax</dt>
                <dd className="font-semibold text-slate-900">{summary.tax}</dd>
              </div>
            </dl>
            {summary.taxByRate.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-wide text-slate-400">Tax breakdown</p>
                <ul className="mt-2 space-y-2">
                  {summary.taxByRate.map((entry) => (
                    <li key={entry.label} className="flex items-center justify-between">
                      <span>{entry.label}</span>
                      <span className="font-semibold text-slate-700">{entry.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-3xl bg-slate-900/5 px-4 py-3 text-base font-semibold text-slate-900">
              <span>Total due</span>
              <span>{summary.total}</span>
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {computedDueDate ? `Due ${formatDate(computedDueDate)}` : 'Select payment terms to calculate due date'}
            </p>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-900/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h3>
            <button
              type="button"
              onClick={handlePreview}
              className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              <DocumentCheckIcon className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Preview invoice
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <CheckCircleIcon className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Generate & send
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="w-full rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <ArrowDownCircleIcon className="mr-2 inline h-5 w-5" aria-hidden="true" />
              Save as template
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

InvoiceGenerator.propTypes = {
  draft: PropTypes.shape({
    invoiceNumber: PropTypes.string,
    clientId: PropTypes.string,
    issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    notes: PropTypes.string,
    paymentTermsId: PropTypes.string,
    discountType: PropTypes.oneOf(['flat', 'percent']),
    discountValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    shipping: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        description: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unitCost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        taxRateId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        metadata: PropTypes.object,
      }),
    ),
  }),
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  currency: PropTypes.string,
  taxRates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      percentage: PropTypes.number.isRequired,
    }),
  ),
  paymentTerms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      days: PropTypes.number,
    }),
  ),
  onPreview: PropTypes.func,
  onGenerate: PropTypes.func,
  onSaveTemplate: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

InvoiceGenerator.defaultProps = {
  draft: null,
  contacts: [],
  currency: 'USD',
  taxRates: [],
  paymentTerms: [],
  onPreview: undefined,
  onGenerate: undefined,
  onSaveTemplate: undefined,
  onTrackEvent: undefined,
};
