import CreationStudioManager from '../../components/creationStudio/CreationStudioManager.jsx';

export default function FreelancerCreationStudioPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Create</p>
          <h1 className="text-3xl font-semibold text-slate-900">Creation Studio</h1>
        </header>

        <section className="mt-8">
          <CreationStudioManager />
        </section>
      </div>
    </div>
  );
}
