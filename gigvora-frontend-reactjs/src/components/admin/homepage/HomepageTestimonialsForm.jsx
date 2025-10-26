function createTestimonial() {
  return {
    id: `homepage-testimonial-${Math.random().toString(36).slice(2, 8)}`,
    quote: '',
    authorName: '',
    authorRole: '',
    authorCompany: '',
    avatarUrl: '',
    avatarAlt: '',
    highlight: '',
    badge: '',
  };
}

export default function HomepageTestimonialsForm({ value, onChange, disabled }) {
  const testimonials = Array.isArray(value) ? value : [];

  const updateTestimonials = (nextTestimonials) => {
    if (typeof onChange !== 'function') return;
    onChange(nextTestimonials);
  };

  const handleFieldChange = (index, field) => (event) => {
    const nextTestimonials = testimonials.map((testimonial, testimonialIndex) => {
      if (testimonialIndex !== index) return testimonial;
      const nextValue = event.target.value;
      return {
        ...testimonial,
        [field]: nextValue,
      };
    });
    updateTestimonials(nextTestimonials);
  };

  const handleAdd = () => {
    updateTestimonials([...testimonials, createTestimonial()]);
  };

  const handleRemove = (index) => () => {
    updateTestimonials(testimonials.filter((_, testimonialIndex) => testimonialIndex !== index));
  };

  return (
    <section id="admin-homepage-testimonials" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Testimonials</h2>
          <p className="mt-1 text-sm text-slate-600">
            Capture concise proof points from verified customers or internal champions. Mark a highlight to emphasise a key quote.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || testimonials.length >= 6}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add testimonial
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {testimonials.map((testimonial, index) => (
          <div key={testimonial.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Testimonial {index + 1}</p>
                <p className="text-sm text-slate-600">Quotes should be under 140 characters for best readability.</p>
              </div>
              <button
                type="button"
                onClick={handleRemove(index)}
                disabled={disabled}
                className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quote</label>
                <textarea
                  rows={2}
                  value={testimonial.quote ?? ''}
                  onChange={handleFieldChange(index, 'quote')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author name</label>
                  <input
                    type="text"
                    value={testimonial.authorName ?? ''}
                    onChange={handleFieldChange(index, 'authorName')}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author role</label>
                  <input
                    type="text"
                    value={testimonial.authorRole ?? ''}
                    onChange={handleFieldChange(index, 'authorRole')}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Author company</label>
                  <input
                    type="text"
                    value={testimonial.authorCompany ?? ''}
                    onChange={handleFieldChange(index, 'authorCompany')}
                    disabled={disabled}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Badge</label>
                  <input
                    type="text"
                    value={testimonial.badge ?? ''}
                    onChange={handleFieldChange(index, 'badge')}
                    disabled={disabled}
                    placeholder="Enterprise rollout"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avatar URL</label>
                <input
                  type="text"
                  value={testimonial.avatarUrl ?? ''}
                  onChange={handleFieldChange(index, 'avatarUrl')}
                  disabled={disabled}
                  placeholder="https://cdn.gigvora.com/assets/avatars/jamie.png"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avatar alt text</label>
                <input
                  type="text"
                  value={testimonial.avatarAlt ?? ''}
                  onChange={handleFieldChange(index, 'avatarAlt')}
                  disabled={disabled}
                  placeholder="Portrait of Jamie Rivera smiling"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Highlight</label>
                <textarea
                  rows={2}
                  value={testimonial.highlight ?? ''}
                  onChange={handleFieldChange(index, 'highlight')}
                  disabled={disabled}
                  placeholder="Summarise the outcome or metric this quote unlocks"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        ))}
        {!testimonials.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
            Add testimonials to reinforce trust and surface compliance-ready deployments.
          </div>
        ) : null}
      </div>
    </section>
  );
}
