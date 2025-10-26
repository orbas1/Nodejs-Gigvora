import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

const TEMPLATE_OPTIONS = [
  { id: 'signature', name: 'Signature', accent: 'from-sky-500 to-indigo-500' },
  { id: 'minimal', name: 'Minimalist', accent: 'from-slate-900 to-slate-600' },
  { id: 'sunrise', name: 'Sunrise', accent: 'from-amber-400 to-rose-500' },
];

export default function InvoiceGenerator({
  invoiceNumber,
  issueDate,
  dueDate,
  currency,
  company,
  client,
  initialItems,
  paymentTerms,
  taxRates,
  defaultTaxRate,
  defaultDiscount,
  onItemsChange,
  onPreview,
  onSaveDraft,
  onSend,
}) {
  const [lineItems, setLineItems] = useState(() =>
    (initialItems ?? []).map((item, index) => ({
      id: item.id ?? `item-${index}`,
      description: item.description ?? '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      taxRate: item.taxRate ?? defaultTaxRate ?? 0,
    })),
  );
  const [template, setTemplate] = useState(TEMPLATE_OPTIONS[0]);
  const [discount, setDiscount] = useState(defaultDiscount ?? 0);
  const [memo, setMemo] = useState('');

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const taxTotal = lineItems.reduce((acc, item) => {
      const rate = Number(item.taxRate) || 0;
      if (!rate) return acc;
      return acc + (item.quantity * item.unitPrice * rate) / 100;
    }, 0);
    const discountValue = discount > 0 ? (subtotal * discount) / 100 : 0;
    const total = subtotal + taxTotal - discountValue;

    return {
      subtotal,
      taxTotal,
      discountValue,
      total,
      outstanding: total,
    };
  }, [lineItems, discount]);

  function updateItems(nextItems) {
    setLineItems(nextItems);
    onItemsChange?.(nextItems);
  }

  function handleLineItemChange(id, field, value) {
    const nextItems = lineItems.map((item) => {
      if (item.id !== id) {
        return item;
      }
      if (field === 'description') {
        return { ...item, description: value };
      }
      const numeric = Number(value);
      return {
        ...item,
        [field]: Number.isNaN(numeric) ? item[field] : numeric,
      };
    });
    updateItems(nextItems);
  }

  function handleAddItem() {
    const nextItems = [
      ...lineItems,
      {
        id: `item-${Date.now()}`,
        description: 'New service',
        quantity: 1,
        unitPrice: 0,
        taxRate: defaultTaxRate ?? 0,
      },
    ];
    updateItems(nextItems);
  }

  function handleRemoveItem(id) {
    const nextItems = lineItems.filter((item) => item.id !== id);
    updateItems(nextItems);
  }

  function handleSaveDraft() {
    onSaveDraft?.({
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      memo,
      template: template.id,
      items: lineItems,
      discount,
    });
  }

  function handlePreview() {
    onPreview?.({
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      memo,
      template: template.id,
      items: lineItems,
      discount,
    });
  }

  function handleSend() {
    onSend?.({
      invoiceNumber,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      memo,
      template: template.id,
      items: lineItems,
      discount,
      totals,
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Invoice studio</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Generate polished invoices</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Craft branded invoices with live totals, tax automation, and executive-grade previews. Tailored for agencies and
            operators managing recurring billing cycles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Live preview
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50/70 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-600 hover:to-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Send invoice
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.8fr_1.2fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Template</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{template.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setTemplate(option)}
                    className={`h-12 w-12 rounded-2xl border-2 border-transparent bg-gradient-to-br ${
                      option.accent
                    } opacity-80 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${
                      template.id === option.id ? 'ring-2 ring-offset-2 ring-slate-900/80 ring-offset-white' : ''
                    }`}
                    aria-label={`Use ${option.name} template`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Billing details</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Line items</h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                + Add item
              </button>
            </header>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Tax</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/60">
                  {lineItems.map((item) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    const taxAmount = lineTotal * ((Number(item.taxRate) || 0) / 100);
                    return (
                      <tr key={item.id} className="align-top text-sm text-slate-700">
                        <td className="px-4 py-3">
                          <textarea
                            className="min-h-[60px] w-full rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            value={item.description}
                            onChange={(event) => handleLineItemChange(item.id, 'description', event.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-20 rounded-xl border border-slate-200 bg-white/90 p-2 text-right text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            value={item.quantity}
                            onChange={(event) => handleLineItemChange(item.id, 'quantity', event.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            className="w-28 rounded-xl border border-slate-200 bg-white/90 p-2 text-right text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            value={item.unitPrice}
                            onChange={(event) => handleLineItemChange(item.id, 'unitPrice', event.target.value)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            className="w-28 rounded-xl border border-slate-200 bg-white/90 p-2 text-right text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            value={item.taxRate}
                            onChange={(event) => handleLineItemChange(item.id, 'taxRate', event.target.value)}
                          >
                            <option value={0}>0%</option>
                            {(taxRates ?? []).map((rate) => (
                              <option key={rate} value={rate}>
                                {rate}%
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          <div>{formatCurrency(lineTotal, currency)}</div>
                          {taxAmount ? (
                            <p className="text-xs text-slate-500">+ {formatCurrency(taxAmount, currency)} tax</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                        No line items yet. Add services or deliverables to generate totals.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Global discount</span>
                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(event) => setDiscount(Number(event.target.value) || 0)}
                    className="w-24 rounded-xl border border-slate-200 bg-white/90 p-2 text-right text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <span className="text-sm font-semibold text-slate-600">%</span>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Internal memo</span>
                <textarea
                  rows={2}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Visible to your finance team for audits and compliance."
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Invoice summary</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{company?.name ?? 'Your company'}</h3>
                <p className="text-sm text-slate-500">Invoice #{invoiceNumber}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {currency}
              </span>
            </header>

            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt className="font-semibold text-slate-500">Issue date</dt>
                <dd>{formatAbsolute(issueDate, { dateStyle: 'medium', timeStyle: undefined })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-slate-500">Due date</dt>
                <dd className="font-semibold text-rose-600">
                  {formatAbsolute(dueDate, { dateStyle: 'medium', timeStyle: undefined })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-slate-500">Payment terms</dt>
                <dd>{paymentTerms ?? 'Net 30'}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Client</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{client?.name ?? 'Client name'}</p>
              {client?.email ? <p className="text-sm text-slate-500">{client.email}</p> : null}
              {client?.company ? (
                <p className="text-sm text-slate-500">{client.company}</p>
              ) : null}
              {client?.address ? (
                <p className="mt-1 text-xs text-slate-500">{client.address}</p>
              ) : null}
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.taxTotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Discount</span>
                <span className="font-semibold text-emerald-600">- {formatCurrency(totals.discountValue, currency)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-base font-semibold text-white">
                <span>Total due</span>
                <span>{formatCurrency(totals.total, currency)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Upcoming automations</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                <div>
                  <p className="font-semibold text-slate-700">Reminder email</p>
                  <p className="text-xs text-slate-500">72 hours before due date with outstanding balance snapshot.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-700">Auto reconciliation</p>
                  <p className="text-xs text-slate-500">Matches bank payout reference IDs with this invoice once paid.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                <div>
                  <p className="font-semibold text-slate-700">Escalation to finance</p>
                  <p className="text-xs text-slate-500">Creates a case if payment is 7 days overdue with recommended actions.</p>
                </div>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}

InvoiceGenerator.propTypes = {
  invoiceNumber: PropTypes.string,
  issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  currency: PropTypes.string,
  company: PropTypes.shape({
    name: PropTypes.string,
  }),
  client: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    company: PropTypes.string,
    address: PropTypes.string,
  }),
  initialItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      unitPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      taxRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  paymentTerms: PropTypes.string,
  taxRates: PropTypes.arrayOf(PropTypes.number),
  defaultTaxRate: PropTypes.number,
  defaultDiscount: PropTypes.number,
  onItemsChange: PropTypes.func,
  onPreview: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onSend: PropTypes.func,
};

InvoiceGenerator.defaultProps = {
  invoiceNumber: '0001',
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  currency: 'USD',
  company: null,
  client: null,
  initialItems: [],
  paymentTerms: 'Net 30',
  taxRates: [5, 10, 20],
  defaultTaxRate: 0,
  defaultDiscount: 0,
  onItemsChange: undefined,
  onPreview: undefined,
  onSaveDraft: undefined,
  onSend: undefined,
};

