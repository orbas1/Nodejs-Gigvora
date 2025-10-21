import { testimonials as defaultTestimonials } from '../../content/home/testimonials.js';

export function TestimonialsSection({ loading, error, testimonials = defaultTestimonials }) {
  const items = !loading && !error && testimonials?.length ? testimonials : defaultTestimonials;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Trusted by leaders and makers</h2>
          <p className="mt-4 text-base text-slate-600">Short, thoughtful feedback from teams using Gigvora every day.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {items.map((testimonial) => (
            <article
              key={testimonial.name}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/70 bg-slate-50 p-8 text-left shadow-sm"
            >
              <p className="text-lg font-medium leading-relaxed text-slate-700">“{testimonial.quote}”</p>
              <div className="mt-6 space-y-2 text-sm text-slate-600">
                <p className="text-base font-semibold text-slate-900">{testimonial.name}</p>
                <p>{testimonial.role}</p>
                {testimonial.highlight ? <p className="text-slate-500">{testimonial.highlight}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
