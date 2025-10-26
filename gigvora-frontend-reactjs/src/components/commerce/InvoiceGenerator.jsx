import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  SparklesIcon,
  PaintBrushIcon,
  ShareIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import { formatCurrency, formatDate, formatStatus } from '../wallet/walletFormatting.js';

const defaultInvoice = Object.freeze({
  invoiceNumber: '',
  issueDate: '',
  dueDate: '',
  currency: 'USD',
  client: {
    name: '',
    email: '',
    company: '',
    address: '',
  },
  project: {
    name: '',
    reference: '',
  },
  lineItems: [],
  tax: {
    type: 'percentage',
    value: 0,
    label: 'Tax',
  },
  discount: {
    type: 'percentage',
    value: 0,
    label: 'Discount',
  },
  adjustments: 0,
  paymentsReceived: 0,
  notes: '',
  terms: '',
  templateId: 'classic',
});

const defaultHandlers = Object.freeze({
  onInvoiceChange: () => {},
  onGenerateInvoice: () => {},
  onSaveDraft: () => {},
  onPreview: () => {},
  onShare: () => {},
  onTemplateChange: () => {},
  onDownloadPdf: () => {},
});

function resolveInvoice(invoice) {
  return {
    ...defaultInvoice,
    ...invoice,
    client: { ...defaultInvoice.client, ...(invoice?.client ?? {}) },
    project: { ...defaultInvoice.project, ...(invoice?.project ?? {}) },
    tax: { ...defaultInvoice.tax, ...(invoice?.tax ?? {}) },
    discount: { ...defaultInvoice.discount, ...(invoice?.discount ?? {}) },
    lineItems: Array.isArray(invoice?.lineItems) ? invoice.lineItems : [],
  };
}

function calculateTotals(invoice) {
  const subtotal = invoice.lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 0);
    const unit = Number(item.unitPrice ?? 0);
    const itemTotal = qty * unit;
    return sum + (Number.isFinite(itemTotal) ? itemTotal : 0);
  }, 0);

  const discountValue = invoice.discount.type === 'fixed'
    ? Number(invoice.discount.value ?? 0)
    : subtotal * (Number(invoice.discount.value ?? 0) / 100);
  const taxableBase = Math.max(subtotal - discountValue, 0);
  const taxValue = invoice.tax.type === 'fixed'
    ? Number(invoice.tax.value ?? 0)
    : taxableBase * (Number(invoice.tax.value ?? 0) / 100);
  const adjustments = Number(invoice.adjustments ?? 0);
  const total = Math.max(taxableBase + taxValue + adjustments, 0);
  const payments = Number(invoice.paymentsReceived ?? 0);
  const balanceDue = Math.max(total - payments, 0);

  return {
    subtotal,
    discountValue,
    taxableBase,
    taxValue,
    adjustments,
    total,
    payments,
    balanceDue,
  };
}

const TEMPLATE_META = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless typography and subtle separators ideal for enterprise finance.',
    accent: 'from-blue-500 via-indigo-500 to-purple-500',
  },
  {
    id: 'modern',
    name: 'Modern Gradient',
    description: 'Bold hero, glassmorphic totals, and crisp contrast to match premium brands.',
    accent: 'from-emerald-500 via-teal-500 to-sky-500',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean layout with monochrome palette for invoice automation workflows.',
    accent: 'from-slate-500 via-slate-400 to-slate-300',
  },
];

export default function InvoiceGenerator({
  invoice,
  loading,
  lastUpdated,
  fromCache,
  error,
  statusLabel,
  templates,
  onInvoiceChange,
  onGenerateInvoice,
  onSaveDraft,
  onPreview,
  onShare,
  onTemplateChange,
  onDownloadPdf,
}) {
  const resolvedInvoice = resolveInvoice(invoice);
  const handlers = {
    onInvoiceChange: onInvoiceChange ?? defaultHandlers.onInvoiceChange,
    onGenerateInvoice: onGenerateInvoice ?? defaultHandlers.onGenerateInvoice,
    onSaveDraft: onSaveDraft ?? defaultHandlers.onSaveDraft,
    onPreview: onPreview ?? defaultHandlers.onPreview,
    onShare: onShare ?? defaultHandlers.onShare,
    onTemplateChange: onTemplateChange ?? defaultHandlers.onTemplateChange,
    onDownloadPdf: onDownloadPdf ?? defaultHandlers.onDownloadPdf,
  };

  const totals = useMemo(
    () => calculateTotals(resolvedInvoice),
    [
      resolvedInvoice.lineItems,
      resolvedInvoice.tax.type,
      resolvedInvoice.tax.value,
      resolvedInvoice.discount.type,
      resolvedInvoice.discount.value,
      resolvedInvoice.adjustments,
      resolvedInvoice.paymentsReceived,
    ],
  );
  const templateLibrary = templates?.length ? templates : TEMPLATE_META;

  const updateInvoice = (patch) => {
    handlers.onInvoiceChange({
      ...resolvedInvoice,
      ...patch,
    });
  };

  const updateNested = (key, patch) => {
    updateInvoice({
      [key]: {
        ...resolvedInvoice[key],
        ...patch,
      },
    });
  };

  const updateLineItem = (index, patch) => {
    const items = [...resolvedInvoice.lineItems];
    items[index] = {
      ...items[index],
      ...patch,
    };
    updateInvoice({ lineItems: items });
  };

  const addLineItem = () => {
    const identifier =
      typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `item-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const items = [
      ...resolvedInvoice.lineItems,
      {
        id: identifier,
        description: '',
        quantity: 1,
        unitPrice: 0,
        category: 'Service',
        status: 'billable',
      },
    ];
    updateInvoice({ lineItems: items });
  };

  const removeLineItem = (index) => {
    const items = resolvedInvoice.lineItems.filter((_, idx) => idx !== index);
    updateInvoice({ lineItems: items });
  };

  const selectedTemplate = templateLibrary.find((tpl) => tpl.id === resolvedInvoice.templateId) ?? templateLibrary[0];

  return (
    <DataStatus
      loading={loading}
      lastUpdated={lastUpdated}
      fromCache={fromCache}
      error={error}
      statusLabel={statusLabel ?? 'Invoice designer'}
    >
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template</p>
            <h2 className="text-2xl font-semibold text-slate-900">Craft premium invoices</h2>
            <p className="text-sm text-slate-500">
              Personalize layouts, automate calculations, and deliver polished invoices that match your brand.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={() => handlers.onPreview(resolvedInvoice)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              Live preview
            </button>
            <button
              type="button"
              onClick={() => handlers.onSaveDraft(resolvedInvoice)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
            >
              <ArrowUpTrayIcon className="h-5 w-5" aria-hidden="true" />
              Save draft
            </button>
            <button
              type="button"
              onClick={() => handlers.onGenerateInvoice(resolvedInvoice)}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
              Generate invoice
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <TemplateSelector
              templates={templateLibrary}
              selectedId={selectedTemplate.id}
              onSelect={(templateId) => {
                updateInvoice({ templateId });
                handlers.onTemplateChange(templateId, resolvedInvoice);
              }}
            />

            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-inner shadow-slate-200/40">
              <FieldGroup title="Invoice details" description="Set billing cadence, references, and due dates with timezone awareness.">
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledInput label="Invoice number" value={resolvedInvoice.invoiceNumber} onChange={(value) => updateInvoice({ invoiceNumber: value })} placeholder="INV-2041" />
                  <LabeledInput label="Project" value={resolvedInvoice.project.name} onChange={(value) => updateNested('project', { name: value })} placeholder="Launch campaign retainer" />
                  <LabeledInput label="Issue date" type="date" value={resolvedInvoice.issueDate} onChange={(value) => updateInvoice({ issueDate: value })} />
                  <LabeledInput label="Due date" type="date" value={resolvedInvoice.dueDate} onChange={(value) => updateInvoice({ dueDate: value })} />
                  <LabeledInput label="Client reference" value={resolvedInvoice.project.reference} onChange={(value) => updateNested('project', { reference: value })} placeholder="PO-44" />
                  <LabeledInput label="Currency" value={resolvedInvoice.currency} onChange={(value) => updateInvoice({ currency: value })} placeholder="USD" maxLength={3} />
                </div>
              </FieldGroup>

              <FieldGroup title="Client" description="Ensure the billing contact, address, and compliance identifiers are accurate.">
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledInput label="Client name" value={resolvedInvoice.client.name} onChange={(value) => updateNested('client', { name: value })} placeholder="Alex Morgan" />
                  <LabeledInput label="Client email" type="email" value={resolvedInvoice.client.email} onChange={(value) => updateNested('client', { email: value })} placeholder="finance@client.com" />
                  <LabeledInput label="Company" value={resolvedInvoice.client.company} onChange={(value) => updateNested('client', { company: value })} placeholder="Client Co." />
                  <LabeledInput label="Billing address" value={resolvedInvoice.client.address} onChange={(value) => updateNested('client', { address: value })} placeholder="221B Market Street, London" />
                </div>
              </FieldGroup>

              <FieldGroup title="Line items" description="Categorize billable work, track status, and surface client-facing notes.">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Unit price</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white/70">
                      {resolvedInvoice.lineItems.length ? (
                        resolvedInvoice.lineItems.map((item, index) => {
                          const itemTotal = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
                          return (
                            <tr key={item.id ?? index} className="hover:bg-blue-50/40">
                              <td className="px-4 py-3">
                                <textarea
                                  value={item.description ?? ''}
                                  onChange={(event) => updateLineItem(index, { description: event.target.value })}
                                  placeholder="Design sprint deliverables"
                                  rows={2}
                                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={item.category ?? ''}
                                  onChange={(event) => updateLineItem(index, { category: event.target.value })}
                                  placeholder="Service"
                                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantity ?? 0}
                                  onChange={(event) => updateLineItem(index, { quantity: event.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice ?? 0}
                                  onChange={(event) => updateLineItem(index, { unitPrice: event.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={item.status ?? 'billable'}
                                  onChange={(event) => updateLineItem(index, { status: event.target.value })}
                                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                >
                                  <option value="billable">Billable</option>
                                  <option value="completed">Completed</option>
                                  <option value="in_review">In review</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                                {formatCurrency(itemTotal, resolvedInvoice.currency)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(index)}
                                  className="rounded-xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                            Start by adding your first deliverable. We&apos;ll handle totals, taxes, and status tracking automatically.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      <PaintBrushIcon className="h-5 w-5" aria-hidden="true" />
                      Add line item
                    </button>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{resolvedInvoice.lineItems.length} items</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
                        <CurrencyDollarIcon className="h-4 w-4" aria-hidden="true" />
                        {formatCurrency(totals.subtotal, resolvedInvoice.currency)} subtotal
                      </span>
                    </div>
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup title="Adjustments" description="Configure taxes, discounts, and manual adjustments with full transparency.">
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledSelect
                    label={`${resolvedInvoice.tax.label} type`}
                    value={resolvedInvoice.tax.type}
                    onChange={(value) => updateNested('tax', { type: value })}
                    options={[
                      { label: 'Percentage', value: 'percentage' },
                      { label: 'Fixed amount', value: 'fixed' },
                    ]}
                  />
                  <LabeledInput
                    label={`${resolvedInvoice.tax.label} value`}
                    type="number"
                    step="0.01"
                    value={resolvedInvoice.tax.value}
                    onChange={(value) => updateNested('tax', { value })}
                  />
                  <LabeledSelect
                    label={`${resolvedInvoice.discount.label} type`}
                    value={resolvedInvoice.discount.type}
                    onChange={(value) => updateNested('discount', { type: value })}
                    options={[
                      { label: 'Percentage', value: 'percentage' },
                      { label: 'Fixed amount', value: 'fixed' },
                    ]}
                  />
                  <LabeledInput
                    label={`${resolvedInvoice.discount.label} value`}
                    type="number"
                    step="0.01"
                    value={resolvedInvoice.discount.value}
                    onChange={(value) => updateNested('discount', { value })}
                  />
                  <LabeledInput
                    label="Additional adjustments"
                    type="number"
                    step="0.01"
                    value={resolvedInvoice.adjustments}
                    onChange={(value) => updateInvoice({ adjustments: value })}
                  />
                  <LabeledInput
                    label="Payments received"
                    type="number"
                    step="0.01"
                    value={resolvedInvoice.paymentsReceived}
                    onChange={(value) => updateInvoice({ paymentsReceived: value })}
                  />
                </div>
              </FieldGroup>

              <FieldGroup title="Messaging" description="Humanize your invoice with guidance, gratitude, and compliance notes.">
                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledTextarea
                    label="Client message"
                    value={resolvedInvoice.notes}
                    onChange={(value) => updateInvoice({ notes: value })}
                    placeholder="Thank you for trusting us with your launch. Payment is due within 14 days via ACH or card."
                  />
                  <LabeledTextarea
                    label="Terms"
                    value={resolvedInvoice.terms}
                    onChange={(value) => updateInvoice({ terms: value })}
                    placeholder="Late payments accrue 1.5% interest monthly. Escrow release requires milestone approval."
                  />
                </div>
              </FieldGroup>
            </div>
          </div>

          <aside className="space-y-6">
            <InvoicePreview invoice={resolvedInvoice} totals={totals} template={selectedTemplate} onDownload={() => handlers.onDownloadPdf(resolvedInvoice)} onShare={() => handlers.onShare(resolvedInvoice)} />
            <TimelineDigest invoice={resolvedInvoice} totals={totals} />
          </aside>
        </section>
      </div>
    </DataStatus>
  );
}

InvoiceGenerator.propTypes = {
  invoice: PropTypes.shape({}),
  loading: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  statusLabel: PropTypes.string,
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      accent: PropTypes.string,
    }),
  ),
  onInvoiceChange: PropTypes.func,
  onGenerateInvoice: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onPreview: PropTypes.func,
  onShare: PropTypes.func,
  onTemplateChange: PropTypes.func,
  onDownloadPdf: PropTypes.func,
};

InvoiceGenerator.defaultProps = {
  invoice: defaultInvoice,
  loading: false,
  lastUpdated: null,
  fromCache: false,
  error: undefined,
  statusLabel: undefined,
  templates: undefined,
  onInvoiceChange: undefined,
  onGenerateInvoice: undefined,
  onSaveDraft: undefined,
  onPreview: undefined,
  onShare: undefined,
  onTemplateChange: undefined,
  onDownloadPdf: undefined,
};

function TemplateSelector({ templates, selectedId, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Template gallery</h3>
          <p className="text-xs text-slate-500">Choose a layout crafted with LinkedIn-grade polish and Instagram-level shine.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{templates.length} options</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={clsx(
              'group relative overflow-hidden rounded-3xl border px-4 py-5 text-left transition',
              selectedId === template.id
                ? 'border-blue-400 bg-gradient-to-br from-blue-50 via-white to-white shadow-lg shadow-blue-200/60'
                : 'border-slate-200 bg-white/80 hover:border-blue-200 hover:shadow-md',
            )}
          >
            <span className={clsx('absolute inset-0 opacity-30', `bg-gradient-to-br ${template.accent}`)} aria-hidden="true" />
            <div className="relative space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{template.name}</p>
              <p className="text-sm text-slate-600">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

TemplateSelector.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      accent: PropTypes.string,
    }),
  ).isRequired,
  selectedId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function FieldGroup({ title, description, children }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

FieldGroup.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
};

FieldGroup.defaultProps = {
  description: '',
};

function LabeledInput({ label, type = 'text', value, onChange, placeholder, maxLength }) {
  return (
    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

LabeledInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
};

LabeledInput.defaultProps = {
  type: 'text',
  value: '',
  placeholder: '',
  maxLength: undefined,
};

function LabeledTextarea({ label, value, onChange, placeholder }) {
  return (
    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

LabeledTextarea.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

LabeledTextarea.defaultProps = {
  value: '',
  placeholder: '',
};

function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

LabeledSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ).isRequired,
};

function InvoicePreview({ invoice, totals, template, onDownload, onShare }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
          <h3 className="text-lg font-semibold text-slate-900">{invoice.client.name || 'Client name'}</h3>
          <p className="text-xs text-slate-500">Invoice {invoice.invoiceNumber || 'INV-0001'} • Due {formatDate(invoice.dueDate)}</p>
        </div>
        <span className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm', `bg-gradient-to-r ${template.accent}`)}>
          {template.name}
        </span>
      </header>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{invoice.discount.label}</span>
          <span className="font-semibold text-rose-600">-{formatCurrency(totals.discountValue, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{invoice.tax.label}</span>
          <span className="font-semibold text-slate-900">{formatCurrency(totals.taxValue, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Adjustments</span>
          <span className="font-semibold text-slate-900">{formatCurrency(totals.adjustments, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-white">
          <span>Total due</span>
          <span className="text-xl font-semibold">{formatCurrency(totals.total, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Payments recorded</span>
          <span>{formatCurrency(totals.payments, invoice.currency)}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <span>Balance due</span>
          <span>{formatCurrency(totals.balanceDue, invoice.currency)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
          Download PDF
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <ShareIcon className="h-5 w-5" aria-hidden="true" />
          Share with client
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Your preview mirrors the generated invoice, including gradient headers, brand typography, and compliance footer copy.
      </p>
    </div>
  );
}

InvoicePreview.propTypes = {
  invoice: PropTypes.shape({
    client: PropTypes.shape({
      name: PropTypes.string,
    }),
    invoiceNumber: PropTypes.string,
    dueDate: PropTypes.string,
    currency: PropTypes.string,
    discount: PropTypes.shape({
      label: PropTypes.string,
    }),
    tax: PropTypes.shape({
      label: PropTypes.string,
    }),
  }).isRequired,
  totals: PropTypes.shape({
    subtotal: PropTypes.number,
    discountValue: PropTypes.number,
    taxValue: PropTypes.number,
    adjustments: PropTypes.number,
    total: PropTypes.number,
    payments: PropTypes.number,
    balanceDue: PropTypes.number,
  }).isRequired,
  template: PropTypes.shape({
    accent: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  onDownload: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
};

function TimelineDigest({ invoice, totals }) {
  const milestones = [
    {
      id: 'issued',
      label: 'Issued',
      date: invoice.issueDate,
      status: invoice.issueDate ? 'completed' : 'pending',
      description: invoice.issueDate ? `Sent ${formatDate(invoice.issueDate)}` : 'Set an issue date to trigger delivery.',
    },
    {
      id: 'due',
      label: 'Due',
      date: invoice.dueDate,
      status: invoice.dueDate ? 'info' : 'pending',
      description: invoice.dueDate
        ? `Due ${formatDate(invoice.dueDate)} • ${formatCurrency(totals.balanceDue, invoice.currency)} outstanding`
        : 'Due date pending. Clients respond faster when expectations are clear.',
    },
    {
      id: 'paid',
      label: 'Balance',
      status: totals.balanceDue === 0 ? 'positive' : 'warning',
      description:
        totals.balanceDue === 0
          ? 'Paid in full. Celebrate the win and archive.'
          : `${formatCurrency(totals.balanceDue, invoice.currency)} remaining. Consider scheduling reminders.`,
    },
  ];

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Billing cadence</h3>
      <ol className="space-y-3">
        {milestones.map((milestone) => (
          <li key={milestone.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{milestone.label}</span>
              <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', badgeTone(milestone.status))}>
                {formatStatus(milestone.status)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{milestone.description}</p>
            {milestone.date ? <p className="mt-1 text-xs text-slate-400">{formatDate(milestone.date)}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

TimelineDigest.propTypes = {
  invoice: PropTypes.shape({
    issueDate: PropTypes.string,
    dueDate: PropTypes.string,
    currency: PropTypes.string,
  }).isRequired,
  totals: PropTypes.shape({
    balanceDue: PropTypes.number,
  }).isRequired,
};

function badgeTone(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'completed' || normalized === 'positive') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (normalized === 'warning') {
    return 'bg-amber-50 text-amber-700';
  }
  if (normalized === 'info') {
    return 'bg-blue-50 text-blue-700';
  }
  return 'bg-slate-100 text-slate-600';
}
