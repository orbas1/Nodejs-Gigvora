export default function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-gradient-to-b from-white via-white to-surfaceMuted">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-soft">
        <div className="h-3 w-3 animate-ping rounded-full bg-accent" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">Loading the workspace&hellip;</p>
      </div>
    </div>
  );
}
