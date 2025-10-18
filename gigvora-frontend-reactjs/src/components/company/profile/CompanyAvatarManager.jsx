import { useEffect, useMemo, useState } from 'react';
import UserAvatar from '../../UserAvatar.jsx';

export default function CompanyAvatarManager({ profile, saving = false, onSubmit, onCancel }) {
  const initialState = useMemo(
    () => ({
      logoUrl: profile?.logoUrl ?? '',
      bannerUrl: profile?.bannerUrl ?? '',
    }),
    [profile],
  );

  const [formState, setFormState] = useState(initialState);

  useEffect(() => {
    setFormState(initialState);
  }, [initialState]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formState);
  };

  const handleCancel = () => {
    setFormState(initialState);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">Logo</p>
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <UserAvatar
              name={profile?.companyName || 'Company'}
              imageUrl={formState.logoUrl}
              seed={profile?.companyName || 'Company'}
              className="h-24 w-24 rounded-3xl border border-slate-200 bg-white object-cover shadow-sm"
            />
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-700">Banner</p>
          <div className="h-40 rounded-3xl border border-slate-200 bg-slate-100">
            {formState.bannerUrl ? (
              <img
                src={formState.bannerUrl}
                alt="Company banner preview"
                className="h-full w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Add a banner image URL (1600x400 recommended)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="logoUrl" className="text-sm font-semibold text-slate-700">
            Logo image URL
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            value={formState.logoUrl}
            onChange={handleChange}
            placeholder="https://cdn.example.com/logo.png"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bannerUrl" className="text-sm font-semibold text-slate-700">
            Banner image URL
          </label>
          <input
            id="bannerUrl"
            name="bannerUrl"
            value={formState.bannerUrl}
            onChange={handleChange}
            placeholder="https://cdn.example.com/banner.png"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save images'}
        </button>
      </div>
    </form>
  );
}
