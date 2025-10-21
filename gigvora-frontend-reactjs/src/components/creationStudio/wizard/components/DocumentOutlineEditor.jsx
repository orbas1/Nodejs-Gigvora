import PropTypes from 'prop-types';

function normaliseSections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }
  return sections.map((section, index) => ({
    id: section.id ?? `section-${index + 1}`,
    heading: section.heading ?? section.title ?? '',
    summary: section.summary ?? section.body ?? '',
  }));
}

export default function DocumentOutlineEditor({ sections, onChange }) {
  const handleAddSection = () => {
    const next = [
      ...normaliseSections(sections),
      { id: `section-${Date.now()}`, heading: '', summary: '' },
    ];
    onChange(next);
  };

  const handleUpdate = (id, patch) => {
    const next = normaliseSections(sections).map((section) =>
      section.id === id ? { ...section, ...patch } : section,
    );
    onChange(next);
  };

  const handleRemove = (id) => {
    const next = normaliseSections(sections).filter((section) => section.id !== id);
    onChange(next);
  };

  const data = normaliseSections(sections);

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Map out the headline sections for this document. Add achievements, experience tracks, and proof points.
        </div>
      ) : null}
      {data.map((section, index) => (
        <div key={section.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Section {index + 1}
            </p>
            <button
              type="button"
              onClick={() => handleRemove(section.id)}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
            >
              Remove
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`${section.id}-heading`}>
              Heading
            </label>
            <input
              id={`${section.id}-heading`}
              type="text"
              value={section.heading}
              onChange={(event) => handleUpdate(section.id, { heading: event.target.value })}
              placeholder="Impactful heading"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`${section.id}-summary`}>
              Talking points
            </label>
            <textarea
              id={`${section.id}-summary`}
              rows={4}
              value={section.summary}
              onChange={(event) => handleUpdate(section.id, { summary: event.target.value })}
              placeholder="Quantified achievements, responsibilities, or context"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddSection}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add section
      </button>
    </div>
  );
}

DocumentOutlineEditor.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      heading: PropTypes.string,
      summary: PropTypes.string,
    }),
  ),
  onChange: PropTypes.func.isRequired,
};

DocumentOutlineEditor.defaultProps = {
  sections: [],
};
