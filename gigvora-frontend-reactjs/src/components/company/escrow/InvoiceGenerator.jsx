import { useReducer, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  Squares2X2Icon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDateTime } from '../../wallet/walletFormatting.js';

function normalizeDraft(draft, currency, templates) {
  const template = templates.find((item) => item.id === draft?.templateId) ?? templates[0] ?? null;
  const issueDate = draft?.issueDate ?? new Date().toISOString();
  const dueDate = draft?.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    invoiceNumber:
      draft?.invoiceNumber ?? `INV-${new Date(issueDate).getFullYear()}-${String(Math.random()).slice(2, 6)}`,
    issueDate,
    dueDate,
    currency: draft?.currency ?? currency ?? 'USD',
    purchaseOrder: draft?.purchaseOrder ?? '',
    notes: draft?.notes ?? 'Thank you for your business. Funds are released automatically when milestones close.',
    footer:
      draft?.footer ??
      'Wire instructions: Gigvora Escrow • Account ending 2299 • ABA 121000358 • Include invoice number in memo.',
    brandPalette:
      draft?.brandPalette ?? template?.brandPalette ?? {
        accent: '#0f172a',
        highlight: '#2563eb',
        surface: '#f8fafc',
      },
    templateId: draft?.templateId ?? template?.id ?? 'modern',
    clientId: draft?.clientId ?? '',
    sender:
      draft?.sender ?? template?.sender ?? {
        name: 'Gigvora Agency',
        email: 'finance@gigvora.com',
        address: '500 Mission St, Suite 1400, San Francisco, CA',
      },
    recipient:
      draft?.recipient ?? {
        name: '',
        email: '',
        address: '',
      },
    taxRate: Number.isFinite(Number(draft?.taxRate)) ? Number(draft.taxRate) : 0,
    discountRate: Number.isFinite(Number(draft?.discountRate)) ? Number(draft.discountRate) : 0,
    shipping: Number.isFinite(Number(draft?.shipping)) ? Number(draft.shipping) : 0,
    lineItems:
      Array.isArray(draft?.lineItems) && draft.lineItems.length
        ? draft.lineItems.map((item, index) => ({
            id: item.id ?? `line-${index + 1}`,
            description: item.description ?? 'Milestone payment',
            quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
            unitPrice: Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0,
            category: item.category ?? 'Milestone',
            taxExempt: Boolean(item.taxExempt),
          }))
        : [
            {
              id: 'line-1',
              description: 'Milestone release',
              quantity: 1,
              unitPrice: 0,
              category: 'Milestone',
              taxExempt: false,
            },
          ],
    attachments: Array.isArray(draft?.attachments) ? draft.attachments : [],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'set-field':
      return { ...state, [action.field]: action.value };
    case 'set-sender':
      return { ...state, sender: { ...state.sender, [action.field]: action.value } };
    case 'set-recipient':
      return { ...state, recipient: { ...state.recipient, [action.field]: action.value } };
    case 'set-brand':
      return {
        ...state,
        brandPalette: { ...state.brandPalette, [action.field]: action.value },
      };
    case 'add-line-item':
      return {
        ...state,
        lineItems: [
          ...state.lineItems,
          {
            id: `line-${state.lineItems.length + 1}`,
            description: 'Additional service',
            quantity: 1,
            unitPrice: 0,
            category: 'Service',
            taxExempt: false,
          },
        ],
      };
    case 'remove-line-item':
      return {
        ...state,
        lineItems: state.lineItems.filter((item) => item.id !== action.id),
      };
    case 'update-line-item':
      return {
        ...state,
        lineItems: state.lineItems.map((item) =>
          item.id === action.id
            ? {
                ...item,
                [action.field]: action.field === 'description'
                  ? action.value
                  : action.field === 'taxExempt'
                  ? Boolean(action.value)
                  : Number.isFinite(Number(action.value))
                  ? Number(action.value)
                  : item[action.field],
              }
            : item,
        ),
      };
    case 'import-item':
      return {
        ...state,
        lineItems: [
          ...state.lineItems,
          {
            id: `line-${state.lineItems.length + 1}`,
            description: action.item.description,
            quantity: action.item.quantity ?? 1,
            unitPrice: action.item.unitPrice ?? 0,
            category: action.item.category ?? 'Service',
            taxExempt: Boolean(action.item.taxExempt),
          },
        ],
      };
    case 'set-template':
      return {
        ...state,
        templateId: action.template.id,
        brandPalette: action.template.brandPalette ?? state.brandPalette,
        sender: action.template.sender ?? state.sender,
      };
    default:
      return state;
  }
}

function TotalsPanel({ totals, currencyCode }) {
  return (
    <dl className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <dt>Subtotal</dt>
        <dd className="font-semibold text-slate-800">{formatCurrency(totals.subtotal, currencyCode)}</dd>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <dt>Discount</dt>
        <dd className="font-semibold text-rose-600">-{formatCurrency(totals.discount, currencyCode)}</dd>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <dt>Tax</dt>
        <dd className="font-semibold text-slate-800">{formatCurrency(totals.tax, currencyCode)}</dd>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <dt>Shipping</dt>
        <dd className="font-semibold text-slate-800">{formatCurrency(totals.shipping, currencyCode)}</dd>
      </div>
      <div className="flex items-center justify-between text-base font-semibold text-slate-900">
        <dt>Total due</dt>
        <dd>{formatCurrency(totals.total, currencyCode)}</dd>
      </div>
    </dl>
  );
}

TotalsPanel.propTypes = {
  totals: PropTypes.shape({
    subtotal: PropTypes.number.isRequired,
    discount: PropTypes.number.isRequired,
    tax: PropTypes.number.isRequired,
    shipping: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  currencyCode: PropTypes.string.isRequired,
};

function TemplateCarousel({ templates, activeId, onSelect }) {
  if (!templates.length) {
    return null;
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {templates.map((template) => {
        const isActive = template.id === activeId;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`min-w-[160px] rounded-3xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              isActive
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
            }`}
          >
            <Squares2X2Icon className="mb-2 h-5 w-5" aria-hidden="true" />
            {template.name}
            <p className="mt-1 text-xs font-normal text-slate-500">{template.tagline}</p>
          </button>
        );
      })}
    </div>
  );
}

TemplateCarousel.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      tagline: PropTypes.string,
      brandPalette: PropTypes.object,
      sender: PropTypes.object,
    }),
  ),
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

TemplateCarousel.defaultProps = {
  templates: [],
  activeId: null,
};

export default function InvoiceGenerator({
  draft,
  currency,
  clients,
  templates,
  itemLibrary,
  onPreview,
  onSaveDraft,
  onGenerate,
  onSend,
}) {
  const normalizedTemplates = Array.isArray(templates) && templates.length
    ? templates
    : [
        {
          id: 'modern',
          name: 'Modern gradient',
          tagline: 'Glassmorphism with gradient accents',
          brandPalette: { accent: '#0f172a', highlight: '#2563eb', surface: '#f8fafc' },
          sender: {
            name: 'Gigvora Agency',
            email: 'finance@gigvora.com',
            address: '500 Mission St, Suite 1400, San Francisco, CA',
          },
        },
      ];

  const [state, dispatch] = useReducer(
    reducer,
    normalizeDraft(draft, currency, normalizedTemplates),
  );

  const totals = useMemo(() => {
    const subtotal = state.lineItems.reduce(
      (acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0),
      0,
    );
    const discount = subtotal * (state.discountRate / 100);
    const taxable = state.lineItems
      .filter((item) => !item.taxExempt)
      .reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const tax = taxable * (state.taxRate / 100);
    const shipping = state.shipping || 0;
    const total = subtotal - discount + tax + shipping;
    return { subtotal, discount, tax, shipping, total };
  }, [state.lineItems, state.discountRate, state.taxRate, state.shipping]);

  const activeTemplate = normalizedTemplates.find((template) => template.id === state.templateId) ?? normalizedTemplates[0];

  const callHandler = (handler) => {
    if (!handler) {
      return;
    }
    const payload = {
      ...state,
      totals,
      issuedAt: state.issueDate,
      dueAt: state.dueDate,
      recipient: state.recipient,
      sender: state.sender,
    };
    const result = handler(payload);
    if (result && typeof result.then === 'function') {
      return result;
    }
    return undefined;
  };

  return (
    <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Invoice studio</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Generate escrow-backed invoices</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Draft branded invoices with live totals, template theming, and escrow-aware automation. Collaborators preview
            changes instantly while finance teams control taxes, discounts, and evidence attachments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => callHandler(onPreview)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" /> Live preview
          </button>
          <button
            type="button"
            onClick={() => callHandler(onSaveDraft)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Save draft
          </button>
          <button
            type="button"
            onClick={() => callHandler(onGenerate)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-blue-500"
          >
            <SparklesIcon className="h-4 w-4" aria-hidden="true" /> Generate PDF
          </button>
          <button
            type="button"
            onClick={() => callHandler(onSend)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-500"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" /> Send to client
          </button>
        </div>
      </header>

      <TemplateCarousel
        templates={normalizedTemplates}
        activeId={state.templateId}
        onSelect={(template) => dispatch({ type: 'set-template', template })}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Invoice number
                <input
                  value={state.invoiceNumber}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'invoiceNumber', value: event.target.value })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Purchase order
                <input
                  value={state.purchaseOrder}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'purchaseOrder', value: event.target.value })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Issue date
                <input
                  type="date"
                  value={state.issueDate.slice(0, 10)}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'issueDate', value: new Date(event.target.value).toISOString() })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Due date
                <input
                  type="date"
                  value={state.dueDate.slice(0, 10)}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'dueDate', value: new Date(event.target.value).toISOString() })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Client
                <select
                  value={state.clientId}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'clientId', value: event.target.value })}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id ?? client.email ?? client.name} value={client.id ?? client.email ?? client.name}>
                      {client.name ?? client.company ?? client.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Currency
                <input
                  value={state.currency}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'currency', value: event.target.value })}
                  className="uppercase rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender</p>
                <label className="mt-2 flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Name
                  <input
                    value={state.sender.name}
                    onChange={(event) => dispatch({ type: 'set-sender', field: 'name', value: event.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Email
                  <input
                    value={state.sender.email}
                    onChange={(event) => dispatch({ type: 'set-sender', field: 'email', value: event.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Address
                  <textarea
                    value={state.sender.address}
                    onChange={(event) => dispatch({ type: 'set-sender', field: 'address', value: event.target.value })}
                    className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipient</p>
                <label className="mt-2 flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Name
                  <input
                    value={state.recipient.name}
                    onChange={(event) => dispatch({ type: 'set-recipient', field: 'name', value: event.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Email
                  <input
                    value={state.recipient.email}
                    onChange={(event) => dispatch({ type: 'set-recipient', field: 'email', value: event.target.value })}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Address
                  <textarea
                    value={state.recipient.address}
                    onChange={(event) => dispatch({ type: 'set-recipient', field: 'address', value: event.target.value })}
                    className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm font-semibold text-slate-700">Line items</p>
              <div className="flex flex-wrap items-center gap-2">
                {itemLibrary.map((item) => (
                  <button
                    key={item.id ?? item.description}
                    type="button"
                    onClick={() => dispatch({ type: 'import-item', item })}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <ArrowDownTrayIcon className="h-3 w-3" aria-hidden="true" /> {item.label ?? item.description}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'add-line-item' })}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-500"
                >
                  Add item
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {state.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
                >
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                    Description
                    <textarea
                      value={item.description}
                      onChange={(event) => dispatch({ type: 'update-line-item', id: item.id, field: 'description', value: event.target.value })}
                      className="min-h-[72px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Qty
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) => dispatch({ type: 'update-line-item', id: item.id, field: 'quantity', value: event.target.value })}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Unit price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) => dispatch({ type: 'update-line-item', id: item.id, field: 'unitPrice', value: event.target.value })}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                    <input
                      value={item.category}
                      onChange={(event) => dispatch({ type: 'update-line-item', id: item.id, field: 'category', value: event.target.value })}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <input
                      type="checkbox"
                      checked={item.taxExempt}
                      onChange={(event) => dispatch({ type: 'update-line-item', id: item.id, field: 'taxExempt', value: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    Tax exempt
                  </label>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'remove-line-item', id: item.id })}
                    className="justify-self-end rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Discount (%)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={state.discountRate}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'discountRate', value: Number(event.target.value) })}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax (%)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={state.taxRate}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'taxRate', value: Number(event.target.value) })}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Shipping
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.shipping}
                  onChange={(event) => dispatch({ type: 'set-field', field: 'shipping', value: Number(event.target.value) })}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Totals
                <TotalsPanel totals={totals} currencyCode={state.currency} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Notes to client
              <textarea
                value={state.notes}
                onChange={(event) => dispatch({ type: 'set-field', field: 'notes', value: event.target.value })}
                className="min-h-[120px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Footer
              <textarea
                value={state.footer}
                onChange={(event) => dispatch({ type: 'set-field', field: 'footer', value: event.target.value })}
                className="min-h-[88px] rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <SwatchIcon className="h-4 w-4" aria-hidden="true" /> Brand palette
            </p>
            <div className="mt-4 grid gap-3">
              {['accent', 'highlight', 'surface'].map((token) => (
                <label key={token} className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span className="capitalize">{token}</span>
                  <input
                    type="color"
                    value={state.brandPalette[token]}
                    onChange={(event) => dispatch({ type: 'set-brand', field: token, value: event.target.value })}
                    className="h-10 w-20 rounded-2xl border border-slate-200"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
            <div
              className="mt-4 space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50 p-4 shadow-inner"
              style={{
                borderColor: state.brandPalette.highlight,
                background:
                  activeTemplate.id === 'modern'
                    ? `linear-gradient(135deg, ${state.brandPalette.surface}, #ffffff)`
                    : state.brandPalette.surface,
              }}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{state.sender.name}</p>
                <p className="text-xs text-slate-500">{state.sender.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-xs text-slate-600">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>Invoice #{state.invoiceNumber}</span>
                  <span>{formatCurrency(totals.total, state.currency)}</span>
                </div>
                <dl className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between">
                    <dt>Issued</dt>
                    <dd>{formatDateTime(state.issueDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Due</dt>
                    <dd>{formatDateTime(state.dueDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>Client</dt>
                    <dd>{state.recipient.name || 'Pending assignment'}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>• {state.lineItems.length} service lines</li>
                  <li>• {state.taxRate}% tax applied to non-exempt items</li>
                  <li>• Escrow auto-release on payment receipt</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
            {state.attachments.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {state.attachments.map((attachment) => (
                  <li key={attachment.id ?? attachment.name} className="flex items-center justify-between">
                    <span>{attachment.name ?? attachment.label ?? 'Attachment'}</span>
                    <span className="text-xs text-slate-400">{attachment.size ?? ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Drop signed SOWs, milestone evidence, or compliance certificates to keep the audit trail ready.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automation</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Auto-sync to escrow release queue on payment.</li>
              <li>• Reminders send 3, 7, and 14 days before due date.</li>
              <li>• Finance dashboard ingests PDF and telemetry for compliance.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

InvoiceGenerator.propTypes = {
  draft: PropTypes.object,
  currency: PropTypes.string,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      email: PropTypes.string,
      company: PropTypes.string,
    }),
  ),
  templates: PropTypes.arrayOf(PropTypes.object),
  itemLibrary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      description: PropTypes.string,
      quantity: PropTypes.number,
      unitPrice: PropTypes.number,
      category: PropTypes.string,
      taxExempt: PropTypes.bool,
    }),
  ),
  onPreview: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onGenerate: PropTypes.func,
  onSend: PropTypes.func,
};

InvoiceGenerator.defaultProps = {
  draft: null,
  currency: 'USD',
  clients: [],
  templates: [],
  itemLibrary: [],
  onPreview: null,
  onSaveDraft: null,
  onGenerate: null,
  onSend: null,
};
