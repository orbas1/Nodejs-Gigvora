import SectionShell from '../SectionShell.jsx';

export default function ReferencesSection() {
  return (
    <SectionShell
      id="references"
      title="References & reviews"
      description="Curate testimonials, references, and optional private endorsements."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Published testimonials</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                client: 'Lumina Health',
                quote: 'Amelia helped us unlock a new member experience in six weeks. Our NPS jumped by 22 points.',
                score: '5.0',
              },
              {
                client: 'Atlas Robotics',
                quote: 'She orchestrated our product vision sprint and aligned engineering, design, and sales in record time.',
                score: '4.9',
              },
            ].map((reference) => (
              <div key={reference.client} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-sm font-semibold text-slate-900">{reference.client}</p>
                <p className="mt-2 text-slate-600">{reference.quote}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Score {reference.score}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Reference controls</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Allow private references</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Showcase review badges</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Allow feed cross-posting</span>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
            </label>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
