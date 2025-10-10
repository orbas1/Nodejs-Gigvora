export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-12 space-y-6">
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </span>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
          {description ? <p className="max-w-2xl text-base text-white/70 lg:text-lg">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
