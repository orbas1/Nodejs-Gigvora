import BlogIndex from '../components/blog/BlogIndex.jsx';

export function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-accent bg-accent text-white shadow-soft'
          : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
}

export default function BlogPage() {
  return <BlogIndex />;
}
