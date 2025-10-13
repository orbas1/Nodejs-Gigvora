import SectionShell from '../SectionShell.jsx';

export default function GigStudioSection() {
  return (
    <SectionShell
      id="gig-studio"
      title="Gig building studio"
      description="Launch, iterate, and monitor signature offers with pricing intelligence."
      actions={[
        <button
          key="preview"
          type="button"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          Preview storefront
        </button>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Offer composer</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-title">
                Gig title
              </label>
              <input
                id="gig-title"
                type="text"
                placeholder="Product strategy accelerator"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-category">
                Category
              </label>
              <select
                id="gig-category"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              >
                <option>Discovery & research</option>
                <option>Product strategy</option>
                <option>Design leadership</option>
                <option>Growth marketing</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gig-outcomes">
                Outcomes & proof points
              </label>
              <textarea
                id="gig-outcomes"
                rows={4}
                placeholder="Define the transformation, success metrics, and proof for this offer."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {['Essentials', 'Pro', 'Enterprise'].map((tier) => (
              <div key={tier} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{tier} plan</p>
                <input
                  type="text"
                  placeholder="$4,200"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
                <textarea
                  rows={3}
                  placeholder="Deliverables, SLAs, and add-ons."
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Market intelligence</p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="font-semibold text-slate-900">Benchmark position</p>
              <p className="text-xs text-slate-500">Top 5% pricing in enterprise product strategy.</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Win rate 64%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Landing page assets</p>
              <ul className="mt-2 space-y-2 text-xs text-slate-500">
                <li>• Narrative deck synced</li>
                <li>• Testimonial widget embedded</li>
                <li>• Checkout flow with upsells</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
