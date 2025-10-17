import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const STEP_TITLES = ['Basics', 'Packages', 'Extras'];

const INITIAL_FORM = {
  vendorName: '',
  serviceName: '',
  amount: '',
  currency: 'USD',
  kickoffAt: '',
  dueAt: '',
};

function parseAmount(value) {
  if (value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createDefaultClasses(currency) {
  return [
    {
      key: 'starter',
      name: 'Starter',
      summary: 'Core deliverables for fast launch.',
      priceAmount: 2500,
      priceCurrency: currency,
      deliveryDays: 10,
      inclusions: ['Kickoff call', 'Weekly update'],
    },
    {
      key: 'growth',
      name: 'Growth',
      summary: 'Adds reporting and QA coverage.',
      priceAmount: 4500,
      priceCurrency: currency,
      deliveryDays: 15,
      inclusions: ['Campaign assets', 'QA checklist', 'Client review'],
    },
    {
      key: 'elite',
      name: 'Elite',
      summary: 'Full concierge delivery with strategy.',
      priceAmount: 7200,
      priceCurrency: currency,
      deliveryDays: 21,
      inclusions: ['Strategy sprint', 'Live workshops', 'Analytics handoff'],
    },
  ];
}

function createEmptyClass(currency, index) {
  return {
    key: `class-${Date.now()}-${index}`,
    name: '',
    summary: '',
    priceAmount: 0,
    priceCurrency: currency,
    deliveryDays: '',
    inclusions: [],
  };
}

function createEmptyAddon(currency, index) {
  return {
    key: `addon-${Date.now()}-${index}`,
    name: '',
    description: '',
    priceAmount: 0,
    priceCurrency: currency,
    deliveryDays: '',
    isPopular: false,
  };
}

function ClassEditor({ open, onClose, onSave, value, currency }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft({
        ...value,
        priceAmount: value.priceAmount?.toString() ?? '',
        deliveryDays: value.deliveryDays?.toString() ?? '',
        inclusions: Array.isArray(value.inclusions) ? value.inclusions : [],
      });
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  const updateInclusion = (index, text) => {
    setDraft((current) => {
      const next = [...(current.inclusions ?? [])];
      next[index] = text;
      return { ...current, inclusions: next };
    });
  };

  const addInclusion = () => {
    setDraft((current) => ({ ...current, inclusions: [...(current.inclusions ?? []), ''] }));
  };

  const removeInclusion = (index) => {
    setDraft((current) => ({
      ...current,
      inclusions: (current.inclusions ?? []).filter((_, inclusionIndex) => inclusionIndex !== index),
    }));
  };

  const handleSave = () => {
    onSave({
      ...value,
      ...draft,
      priceAmount: Number(draft.priceAmount ?? 0),
      priceCurrency: currency,
      deliveryDays: draft.deliveryDays ? Number(draft.deliveryDays) : null,
      inclusions: (draft.inclusions ?? []).map((item) => item.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Close
        </button>
        <h3 className="text-xl font-semibold text-slate-900">Edit class</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-600">
          <label className="flex flex-col gap-2">
            Name
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Premium"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            Summary
            <textarea
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="What makes this class unique?"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              Price
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                <span className="text-sm font-semibold text-slate-600">{currency}</span>
                <input
                  value={draft.priceAmount}
                  onChange={(event) => setDraft((current) => ({ ...current, priceAmount: event.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 focus:outline-none"
                  required
                />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              Delivery days
              <input
                value={draft.deliveryDays}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryDays: event.target.value }))}
                type="number"
                min="1"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="10"
              />
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Inclusions</p>
              <button
                type="button"
                onClick={addInclusion}
                className="text-xs font-semibold text-accent hover:text-accentDark"
              >
                Add line
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {(draft.inclusions ?? []).map((item, index) => (
                <div key={`inclusion-${index}`} className="flex items-center gap-2">
                  <input
                    value={item}
                    onChange={(event) => updateInclusion(index, event.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Deliverable"
                  />
                  <button
                    type="button"
                    onClick={() => removeInclusion(index)}
                    className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

ClassEditor.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  value: PropTypes.object,
  currency: PropTypes.string.isRequired,
};

ClassEditor.defaultProps = {
  open: false,
  value: createEmptyClass('USD', 0),
};

function AddonEditor({ open, onClose, onSave, value, currency }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) {
      setDraft({
        ...value,
        priceAmount: value.priceAmount?.toString() ?? '',
        deliveryDays: value.deliveryDays?.toString() ?? '',
      });
    }
  }, [open, value]);

  if (!open) {
    return null;
  }

  const handleSave = () => {
    onSave({
      ...value,
      ...draft,
      priceAmount: Number(draft.priceAmount ?? 0),
      priceCurrency: currency,
      deliveryDays: draft.deliveryDays ? Number(draft.deliveryDays) : null,
      description: draft.description ?? '',
      isPopular: Boolean(draft.isPopular),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-10">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Close
        </button>
        <h3 className="text-xl font-semibold text-slate-900">Edit add-on</h3>
        <div className="mt-4 space-y-4 text-sm text-slate-600">
          <label className="flex flex-col gap-2">
            Name
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Rush delivery"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            Description
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="What is included?"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              Price
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                <span className="text-sm font-semibold text-slate-600">{currency}</span>
                <input
                  value={draft.priceAmount}
                  onChange={(event) => setDraft((current) => ({ ...current, priceAmount: event.target.value }))}
                  type="number"
                  min="0"
                  step="0.01"
                  className="flex-1 border-none bg-transparent text-sm text-slate-900 focus:outline-none"
                  required
                />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              Delivery days
              <input
                value={draft.deliveryDays}
                onChange={(event) => setDraft((current) => ({ ...current, deliveryDays: event.target.value }))}
                type="number"
                min="1"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="5"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(draft.isPopular)}
              onChange={(event) => setDraft((current) => ({ ...current, isPopular: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
            />
            Mark as popular
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

AddonEditor.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  value: PropTypes.object,
  currency: PropTypes.string.isRequired,
};

AddonEditor.defaultProps = {
  open: false,
  value: createEmptyAddon('USD', 0),
};

export default function GigCreationSection({ onCreate, creating, defaultCurrency, onCreated }) {
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, currency: defaultCurrency || 'USD' }));
  const [step, setStep] = useState(0);
  const [classes, setClasses] = useState(() => createDefaultClasses(defaultCurrency || 'USD'));
  const [addons, setAddons] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaDraft, setMediaDraft] = useState({ type: 'image', url: '', caption: '', thumbnailUrl: '' });
  const [faqs, setFaqs] = useState([]);
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '' });
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [editingClassIndex, setEditingClassIndex] = useState(null);
  const [editingAddonIndex, setEditingAddonIndex] = useState(null);

  const currencyOptions = useMemo(() => {
    if (!defaultCurrency || CURRENCY_OPTIONS.includes(defaultCurrency)) {
      return CURRENCY_OPTIONS;
    }
    return [defaultCurrency, ...CURRENCY_OPTIONS];
  }, [defaultCurrency]);

  useEffect(() => {
    setClasses((current) => current.map((gigClass) => ({ ...gigClass, priceCurrency: form.currency })));
    setAddons((current) => current.map((addon) => ({ ...addon, priceCurrency: form.currency })));
  }, [form.currency]);

  const openClassEditor = (index) => {
    setEditingClassIndex(index);
  };

  const openAddonEditor = (index) => {
    setEditingAddonIndex(index);
  };

  const closeEditors = () => {
    setEditingClassIndex(null);
    setEditingAddonIndex(null);
  };

  const handleClassSave = (index, value) => {
    if (index == null) {
      return;
    }
    setClasses((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const handleAddonSave = (index, value) => {
    if (index == null) {
      return;
    }
    setAddons((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const addClass = () => {
    setClasses((current) => [...current, createEmptyClass(form.currency, current.length)]);
    setTimeout(() => setEditingClassIndex(classes.length), 0);
  };

  const removeClass = (index) => {
    setClasses((current) => {
      if (current.length <= 3) {
        return current;
      }
      return current.filter((_, classIndex) => classIndex !== index);
    });
  };

  const addAddon = () => {
    setAddons((current) => [...current, createEmptyAddon(form.currency, current.length)]);
    setTimeout(() => setEditingAddonIndex(addons.length), 0);
  };

  const removeAddon = (index) => {
    setAddons((current) => current.filter((_, addonIndex) => addonIndex !== index));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) {
      return;
    }
    setTags((current) => {
      if (current.includes(trimmed) || current.length >= 8) {
        return current;
      }
      return [...current, trimmed];
    });
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const addMediaItem = () => {
    if (!mediaDraft.url.trim()) {
      return;
    }
    setMedia((current) => [
      ...current,
      {
        key: `media-${Date.now()}`,
        type: mediaDraft.type,
        url: mediaDraft.url.trim(),
        caption: mediaDraft.caption.trim() || null,
        thumbnailUrl: mediaDraft.thumbnailUrl.trim() || null,
      },
    ]);
    setMediaDraft({ type: mediaDraft.type, url: '', caption: '', thumbnailUrl: '' });
  };

  const removeMediaItem = (key) => {
    setMedia((current) => current.filter((item) => item.key !== key));
  };

  const addFaq = () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      return;
    }
    setFaqs((current) => [
      ...current,
      {
        key: `faq-${Date.now()}`,
        question: faqDraft.question.trim(),
        answer: faqDraft.answer.trim(),
      },
    ]);
    setFaqDraft({ question: '', answer: '' });
  };

  const removeFaq = (key) => {
    setFaqs((current) => current.filter((faq) => faq.key !== key));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.vendorName.trim()) {
      nextErrors.vendorName = 'Vendor required';
    }
    if (!form.serviceName.trim()) {
      nextErrors.serviceName = 'Service required';
    }
    const amount = parseAmount(form.amount);
    if (amount == null || amount <= 0) {
      nextErrors.amount = 'Set budget';
    }
    if (form.dueAt) {
      const kickoff = form.kickoffAt ? new Date(form.kickoffAt).getTime() : null;
      const due = new Date(form.dueAt).getTime();
      if (Number.isNaN(due)) {
        nextErrors.dueAt = 'Invalid date';
      } else if (kickoff && due < kickoff) {
        nextErrors.dueAt = 'After kickoff';
      }
    }
    if (!classes.length || classes.length < 3) {
      nextErrors.classes = 'Need three classes';
    }
    classes.forEach((gigClass, index) => {
      if (!gigClass.name.trim()) {
        nextErrors[`class-name-${index}`] = 'Name required';
      }
      if (!gigClass.priceAmount || Number(gigClass.priceAmount) <= 0) {
        nextErrors[`class-price-${index}`] = 'Price required';
      }
    });
    addons.forEach((addon, index) => {
      if (!addon.name.trim()) {
        nextErrors[`addon-name-${index}`] = 'Name required';
      }
      if (!addon.priceAmount || Number(addon.priceAmount) <= 0) {
        nextErrors[`addon-price-${index}`] = 'Price required';
      }
    });
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setFeedback({ status: 'error', message: 'Check highlighted fields.' });
      setStep(0);
      return;
    }

    const normalizedClasses = classes.map((gigClass, index) => ({
      key: gigClass.key ?? `class-${index + 1}`,
      name: gigClass.name.trim(),
      summary: gigClass.summary?.trim() || null,
      priceAmount: Number(gigClass.priceAmount),
      priceCurrency: form.currency,
      deliveryDays: gigClass.deliveryDays ? Number(gigClass.deliveryDays) : null,
      inclusions: (gigClass.inclusions ?? []).map((item) => item.trim()).filter(Boolean),
    }));

    const normalizedAddons = addons.map((addon, index) => ({
      key: addon.key ?? `addon-${index + 1}`,
      name: addon.name.trim(),
      description: addon.description?.trim() || null,
      priceAmount: Number(addon.priceAmount),
      priceCurrency: form.currency,
      deliveryDays: addon.deliveryDays ? Number(addon.deliveryDays) : null,
      isPopular: Boolean(addon.isPopular),
    }));

    const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const normalizedMedia = media.map((item) => ({
      key: item.key,
      type: item.type,
      url: item.url,
      caption: item.caption,
      thumbnailUrl: item.thumbnailUrl,
    }));
    const normalizedFaqs = faqs.map((faq) => ({ key: faq.key, question: faq.question, answer: faq.answer }));

    try {
      await onCreate?.({
        vendorName: form.vendorName.trim(),
        serviceName: form.serviceName.trim(),
        amount: parseAmount(form.amount) ?? 0,
        currency: form.currency,
        kickoffAt: form.kickoffAt || undefined,
        dueAt: form.dueAt || undefined,
        metadata: notes ? { notes } : undefined,
        classes: normalizedClasses,
        addons: normalizedAddons,
        tags: normalizedTags,
        media: normalizedMedia,
        faqs: normalizedFaqs,
      });
      setFeedback({ status: 'success', message: 'Gig created.' });
      setForm({ ...INITIAL_FORM, currency: form.currency });
      setClasses(createDefaultClasses(form.currency));
      setAddons([]);
      setTags([]);
      setMedia([]);
      setFaqs([]);
      setNotes('');
      onCreated?.();
      setStep(0);
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to create gig.' });
    }
  };

  const renderBasics = () => (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        Vendor
        <input
          name="vendorName"
          value={form.vendorName}
          onChange={handleChange}
          placeholder="Acme Studio"
          className={`rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            errors.vendorName ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200'
          }`}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        Service
        <input
          name="serviceName"
          value={form.serviceName}
          onChange={handleChange}
          placeholder="Launch operations"
          className={`rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            errors.serviceName ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200'
          }`}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        Budget
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
          errors.amount ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100' : 'border-slate-200'
        }`}>
          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            className="border-none bg-transparent text-sm text-slate-900 focus:outline-none"
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <input
            name="amount"
            value={form.amount}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            placeholder="4500"
            className="flex-1 border-none bg-transparent text-sm text-slate-900 focus:outline-none"
            required
          />
        </div>
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        Kickoff
        <input
          type="date"
          name="kickoffAt"
          value={form.kickoffAt}
          onChange={handleChange}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        Delivery date
        <input
          type="date"
          name="dueAt"
          value={form.dueAt}
          onChange={handleChange}
          className={`rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
            errors.dueAt ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200'
          }`}
        />
      </label>
      <label className="lg:col-span-2 flex flex-col gap-2 text-sm text-slate-600">
        Internal note
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Owner, cadence, or resource links"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </label>
    </div>
  );

  const renderPackages = () => (
    <div className="mt-6 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Classes</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addClass}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Add class
            </button>
            <span className="text-xs text-slate-400">Min 3</span>
          </div>
        </div>
        {errors.classes ? <p className="mt-2 text-xs text-rose-500">{errors.classes}</p> : null}
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {classes.map((gigClass, index) => (
            <div
              key={gigClass.key}
              className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{gigClass.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500">{gigClass.summary || 'Tap edit to define'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeClass(index)}
                    disabled={classes.length <= 3}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-200"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {gigClass.priceAmount ? `${gigClass.priceCurrency} ${gigClass.priceAmount}` : 'Set price'}
                </p>
                {gigClass.deliveryDays ? (
                  <p className="text-xs uppercase tracking-wide text-slate-500">{gigClass.deliveryDays} days</p>
                ) : null}
                {gigClass.inclusions?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate-500">
                    {gigClass.inclusions.slice(0, 4).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => openClassEditor(index)}
                className="mt-4 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Add-ons</p>
          <button
            type="button"
            onClick={addAddon}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Add add-on
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {addons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No add-ons yet.
            </div>
          ) : (
            addons.map((addon, index) => (
              <div key={addon.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{addon.name || 'Unnamed add-on'}</p>
                    <p className="text-xs text-slate-500">{addon.description || 'Tap edit to define'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAddon(index)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {addon.priceAmount ? `${addon.priceCurrency} ${addon.priceAmount}` : 'Set price'}
                </p>
                {addon.deliveryDays ? (
                  <p className="text-xs uppercase tracking-wide text-slate-500">{addon.deliveryDays} days</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{addon.isPopular ? 'Popular' : 'Optional'}</span>
                  <button
                    type="button"
                    onClick={() => openAddonEditor(index)}
                    className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderExtras = () => (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">Tags</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-600">
                ×
              </button>
            </span>
          ))}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add tag"
              className="w-24 border-none bg-transparent text-xs focus:outline-none"
            />
            <button type="button" onClick={addTag} className="text-xs font-semibold text-accent hover:text-accentDark">
              Add
            </button>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">Gallery</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {media.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>{item.type}</span>
                <button
                  type="button"
                  onClick={() => removeMediaItem(item.key)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
              <p className="mt-2 truncate text-sm text-slate-600">{item.url}</p>
              {item.caption ? <p className="mt-1 text-xs text-slate-500">{item.caption}</p> : null}
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <div className="grid gap-3">
              <select
                value={mediaDraft.type}
                onChange={(event) => setMediaDraft((current) => ({ ...current, type: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <input
                value={mediaDraft.url}
                onChange={(event) => setMediaDraft((current) => ({ ...current, url: event.target.value }))}
                placeholder="https://media"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <input
                value={mediaDraft.thumbnailUrl}
                onChange={(event) => setMediaDraft((current) => ({ ...current, thumbnailUrl: event.target.value }))}
                placeholder="Thumbnail (optional)"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <input
                value={mediaDraft.caption}
                onChange={(event) => setMediaDraft((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Caption"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={addMediaItem}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                Add media
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">FAQ</p>
        <div className="mt-3 space-y-3">
          {faqs.map((faq) => (
            <div key={faq.key} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-1 text-xs text-slate-500">{faq.answer}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFaq(faq.key)}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <input
              value={faqDraft.question}
              onChange={(event) => setFaqDraft((current) => ({ ...current, question: event.target.value }))}
              placeholder="Question"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <textarea
              value={faqDraft.answer}
              onChange={(event) => setFaqDraft((current) => ({ ...current, answer: event.target.value }))}
              rows={2}
              placeholder="Answer"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={addFaq}
              className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700"
            >
              Add FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="agency-gig-creation" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Build</p>
          <h2 className="text-3xl font-semibold text-slate-900">Create gig</h2>
        </div>
        <div className="flex gap-2">
          {STEP_TITLES.map((title, index) => (
            <button
              key={title}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                step === index
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        {step === 0 ? renderBasics() : null}
        {step === 1 ? renderPackages() : null}
        {step === 2 ? renderExtras() : null}

        {feedback ? (
          <div
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              feedback.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(current - 1, 0))}
            disabled={step === 0}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back
          </button>
          <div className="flex gap-3">
            {step < STEP_TITLES.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1))}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create gig'}
              </button>
            )}
          </div>
        </div>
      </form>

      <ClassEditor
        open={editingClassIndex != null}
        onClose={closeEditors}
        onSave={(value) => handleClassSave(editingClassIndex, value)}
        value={classes[editingClassIndex ?? 0]}
        currency={form.currency}
      />
      <AddonEditor
        open={editingAddonIndex != null}
        onClose={closeEditors}
        onSave={(value) => handleAddonSave(editingAddonIndex, value)}
        value={addons[editingAddonIndex ?? 0] ?? createEmptyAddon(form.currency, 0)}
        currency={form.currency}
      />
    </section>
  );
}

GigCreationSection.propTypes = {
  onCreate: PropTypes.func,
  creating: PropTypes.bool,
  defaultCurrency: PropTypes.string,
  onCreated: PropTypes.func,
};

GigCreationSection.defaultProps = {
  onCreate: undefined,
  creating: false,
  defaultCurrency: 'USD',
  onCreated: undefined,
};
