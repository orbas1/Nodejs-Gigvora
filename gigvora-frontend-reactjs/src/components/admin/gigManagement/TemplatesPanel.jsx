import PropTypes from 'prop-types';

export default function TemplatesPanel({ templates, onUse }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
          <p className="text-lg font-semibold text-slate-900">{templates.length} playbooks</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{template.name}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{template.category}</p>
            </div>
            <p className="text-xs text-slate-600">{template.summary}</p>
            <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
              <span>{template.durationWeeks} weeks</span>
              <span>
                {template.recommendedBudgetMin && template.recommendedBudgetMax
                  ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                      template.recommendedBudgetMin,
                    )} – ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                      template.recommendedBudgetMax,
                    )}`
                  : null}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUse(template)}
              className="mt-3 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Use
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

TemplatesPanel.propTypes = {
  templates: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUse: PropTypes.func.isRequired,
};
