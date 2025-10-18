function createFaq() {
  return {
    id: `homepage-faq-${Math.random().toString(36).slice(2, 8)}`,
    question: '',
    answer: '',
  };
}

export default function HomepageFaqForm({ value, onChange, disabled }) {
  const faqs = Array.isArray(value) ? value : [];

  const updateFaqs = (nextFaqs) => {
    if (typeof onChange !== 'function') return;
    onChange(nextFaqs);
  };

  const handleFieldChange = (index, field) => (event) => {
    const nextFaqs = faqs.map((faq, faqIndex) => {
      if (faqIndex !== index) return faq;
      return {
        ...faq,
        [field]: event.target.value,
      };
    });
    updateFaqs(nextFaqs);
  };

  const handleAdd = () => {
    updateFaqs([...faqs, createFaq()]);
  };

  const handleRemove = (index) => () => {
    updateFaqs(faqs.filter((_, faqIndex) => faqIndex !== index));
  };

  return (
    <section id="admin-homepage-faqs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-slate-600">
            Anticipate procurement and compliance questions to reduce sales friction.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || faqs.length >= 8}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add FAQ
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">FAQ {index + 1}</p>
              <button
                type="button"
                onClick={handleRemove(index)}
                disabled={disabled}
                className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Question</label>
                <input
                  type="text"
                  value={faq.question ?? ''}
                  onChange={handleFieldChange(index, 'question')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Answer</label>
                <textarea
                  rows={2}
                  value={faq.answer ?? ''}
                  onChange={handleFieldChange(index, 'answer')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
        {!faqs.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
            Add FAQs that address onboarding speed, data security, pricing, and vendor governance.
          </div>
        ) : null}
      </div>
    </section>
  );
}
