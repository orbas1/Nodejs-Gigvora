function createFeature() {
  return {
    id: `homepage-feature-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    mediaAlt: '',
    bullets: [],
  };
}

function createBullet() {
  return {
    id: `homepage-feature-bullet-${Math.random().toString(36).slice(2, 8)}`,
    text: '',
  };
}

export default function HomepageFeatureSectionsForm({ value, onChange, disabled }) {
  const sections = Array.isArray(value) ? value : [];

  const updateSections = (nextSections) => {
    if (typeof onChange !== 'function') return;
    onChange(nextSections);
  };

  const handleSectionChange = (index, field) => (event) => {
    const nextSections = sections.map((section, sectionIndex) => {
      if (sectionIndex !== index) return section;
      const nextValue = field === 'mediaType' ? event.target.value : event.target.value;
      return {
        ...section,
        [field]: nextValue,
      };
    });
    updateSections(nextSections);
  };

  const handleBulletChange = (sectionIndex, bulletIndex) => (event) => {
    const nextSections = sections.map((section, idx) => {
      if (idx !== sectionIndex) return section;
      const bullets = Array.isArray(section.bullets) ? section.bullets : [];
      const nextBullets = bullets.map((bullet, bIndex) => {
        if (bIndex !== bulletIndex) return bullet;
        return {
          ...bullet,
          text: event.target.value,
        };
      });
      return {
        ...section,
        bullets: nextBullets,
      };
    });
    updateSections(nextSections);
  };

  const handleAddSection = () => {
    updateSections([...sections, createFeature()]);
  };

  const handleRemoveSection = (index) => () => {
    updateSections(sections.filter((_, sectionIndex) => sectionIndex !== index));
  };

  const handleAddBullet = (sectionIndex) => () => {
    const nextSections = sections.map((section, idx) => {
      if (idx !== sectionIndex) return section;
      const bullets = Array.isArray(section.bullets) ? section.bullets : [];
      return {
        ...section,
        bullets: [...bullets, createBullet()],
      };
    });
    updateSections(nextSections);
  };

  const handleRemoveBullet = (sectionIndex, bulletIndex) => () => {
    const nextSections = sections.map((section, idx) => {
      if (idx !== sectionIndex) return section;
      const bullets = Array.isArray(section.bullets) ? section.bullets : [];
      return {
        ...section,
        bullets: bullets.filter((_, bIndex) => bIndex !== bulletIndex),
      };
    });
    updateSections(nextSections);
  };

  return (
    <section id="admin-homepage-sections" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Deep dive sections</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pair imagery or product shots with supporting bullets to narrate how Gigvora operates for enterprise buyers.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSection}
          disabled={disabled || sections.length >= 4}
          className="inline-flex items-center rounded-full border border-accent bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          Add section
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((section, index) => (
          <div key={section.id ?? index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section {index + 1}</p>
                <p className="text-sm text-slate-600">Outline a workflow, benefit, or differentiator.</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveSection(index)}
                disabled={disabled}
                className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Remove
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Title</label>
                <input
                  type="text"
                  value={section.title ?? ''}
                  onChange={handleSectionChange(index, 'title')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Media URL</label>
                <input
                  type="text"
                  value={section.mediaUrl ?? ''}
                  onChange={handleSectionChange(index, 'mediaUrl')}
                  disabled={disabled}
                  placeholder="https://cdn.gigvora.com/assets/features/workspace.png"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  rows={2}
                  value={section.description ?? ''}
                  onChange={handleSectionChange(index, 'description')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Media alt text</label>
                <input
                  type="text"
                  value={section.mediaAlt ?? ''}
                  onChange={handleSectionChange(index, 'mediaAlt')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Media type</label>
                <select
                  value={section.mediaType ?? 'image'}
                  onChange={handleSectionChange(index, 'mediaType')}
                  disabled={disabled}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="illustration">Illustration</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supporting bullets</p>
                <button
                  type="button"
                  onClick={handleAddBullet(index)}
                  disabled={disabled || (section.bullets ?? []).length >= 6}
                  className="text-xs font-semibold uppercase tracking-wide text-accent transition hover:text-accentDark disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Add bullet
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {(section.bullets ?? []).map((bullet, bulletIndex) => (
                  <div key={bullet.id ?? bulletIndex} className="flex items-start gap-3">
                    <textarea
                      rows={2}
                      value={bullet.text ?? ''}
                      onChange={handleBulletChange(index, bulletIndex)}
                      disabled={disabled}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveBullet(index, bulletIndex)}
                      disabled={disabled}
                      className="text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!section.bullets?.length ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-2 text-sm text-slate-500">
                    Use bullets to outline automation, governance, or finance capabilities delivered in this section.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!sections.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
            Add up to four detail sections that go deeper into workflows, compliance guardrails, or collaboration surfaces.
          </div>
        ) : null}
      </div>
    </section>
  );
}
