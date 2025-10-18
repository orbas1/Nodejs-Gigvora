import PropTypes from 'prop-types';

export default function FaqList({ faqs, onChange }) {
  const handleFieldChange = (index, field, value) => {
    const next = faqs.map((faq, faqIndex) =>
      faqIndex === index
        ? {
            ...faq,
            [field]: value,
          }
        : faq,
    );
    onChange(next);
  };

  const handleAdd = () => {
    onChange([
      ...faqs,
      { id: `faq-${faqs.length + 1}`, question: '', answer: '' },
    ]);
  };

  const handleRemove = (index) => {
    onChange(faqs.filter((_, faqIndex) => faqIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">FAQs</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Add FAQ
        </button>
      </div>
      {faqs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Answer the questions you hear most.
        </p>
      ) : null}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.id ?? index} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`faq-question-${faq.id}`}>
                Question
              </label>
              <input
                id={`faq-question-${faq.id}`}
                type="text"
                value={faq.question}
                onChange={(event) => handleFieldChange(index, 'question', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`faq-answer-${faq.id}`}>
                Answer
              </label>
              <textarea
                id={`faq-answer-${faq.id}`}
                rows={3}
                value={faq.answer}
                onChange={(event) => handleFieldChange(index, 'answer', event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

FaqList.propTypes = {
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      question: PropTypes.string,
      answer: PropTypes.string,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};
