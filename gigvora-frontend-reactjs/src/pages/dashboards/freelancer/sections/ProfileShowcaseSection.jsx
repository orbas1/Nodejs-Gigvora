import SectionShell from '../SectionShell.jsx';

export default function ProfileShowcaseSection() {
  return (
    <SectionShell
      id="profile-showcase"
      title="Profile showcase"
      description="Craft a rich public profile with multimedia storytelling and credentialing."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Brand identity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-banner">
                Banner media
              </label>
              <input
                id="profile-banner"
                type="file"
                accept="image/*,video/*"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-tagline">
                Tagline
              </label>
              <input
                id="profile-tagline"
                type="text"
                placeholder="Designing category-leading product experiences."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-video">
                Showcase video
              </label>
              <input
                id="profile-video"
                type="file"
                accept="video/*"
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="profile-bio">
                Biography
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                placeholder="Share your story, approach, and differentiators."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Portfolio', placeholder: 'Add case study URLs or upload files' },
              { label: 'Skill tags', placeholder: 'Product strategy, JTBD, GTM, Research' },
              { label: 'Certificates', placeholder: 'Product Ops Institute, IDEO U' },
              { label: 'Qualifications', placeholder: 'Former Director at Lunar Labs' },
              { label: 'Work experience', placeholder: 'Leadership roles, highlights, tenure' },
              { label: 'Profile link', placeholder: 'gigvora.com/amelia-rivers', readOnly: true },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</label>
                <input
                  type="text"
                  defaultValue={item.readOnly ? item.placeholder : ''}
                  placeholder={item.placeholder}
                  readOnly={item.readOnly}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none ${
                    item.readOnly ? 'cursor-pointer text-blue-600' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Suggested follows</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                { name: 'Noah Kim', role: 'AI Product Strategist' },
                { name: 'Priya Desai', role: 'Service Design Lead' },
                { name: 'Gina Rodriguez', role: 'Growth Marketing Architect' },
              ].map((profile) => (
                <li key={profile.name} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Recent feed posts</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {[
                'Research blueprint: How to modernize enterprise discovery ops.',
                'Case study: Driving retention for Lumina Health in 90 days.',
                'Template drop: My go-to product vision workshop board.',
              ].map((post) => (
                <li key={post} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {post}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
