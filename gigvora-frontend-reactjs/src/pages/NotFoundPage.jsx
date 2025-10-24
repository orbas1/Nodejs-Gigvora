import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">404</p>
      <h1 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">We couldn’t find that page</h1>
      <p className="mt-4 text-sm text-slate-600 sm:text-base">
        The link might be out of date or the page may have moved. Check the URL or head back to the dashboard to continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          <HomeIcon className="h-4 w-4" />
          Go home
        </Link>
        <Link
          to="/support"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
