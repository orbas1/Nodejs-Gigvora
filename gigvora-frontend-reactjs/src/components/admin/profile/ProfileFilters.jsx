import { useEffect, useMemo, useState } from 'react';
import { FunnelIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All availability' },
  { value: 'open', label: 'Open for work' },
  { value: 'limited', label: 'Limited' },
  { value: 'unavailable', label: 'Unavailable' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'name', label: 'Name' },
  { value: 'trust', label: 'Trust score' },
  { value: 'completion', label: 'Profile completion' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'agency', label: 'Agency' },
  { value: 'company', label: 'Company' },
  { value: 'user', label: 'Member' },
];

const AVATAR_OPTIONS = [
  { value: '', label: 'Avatar status' },
  { value: 'true', label: 'Has avatar' },
  { value: 'false', label: 'Missing avatar' },
];

export default function ProfileFilters({ filters, onFiltersChange, onCreate }) {
  const [searchValue, setSearchValue] = useState(filters.search ?? '');

  useEffect(() => {
    setSearchValue(filters.search ?? '');
  }, [filters.search]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.availability ||
        filters.userType ||
        filters.membership ||
        filters.hasAvatar,
    );
  }, [filters]);

  const handleChange = (key, value) => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleChange('search', searchValue ?? '');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:flex-row lg:items-end"
    >
      <div className="flex flex-1 flex-col gap-2">
        <label htmlFor="profile-search" className="text-sm font-medium text-slate-700">
          Search profiles
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="profile-search"
            name="search"
            type="search"
            placeholder="Search by name, email, headline, or mission"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="profile-sort" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FunnelIcon className="h-4 w-4" /> Sort by
          </label>
          <select
            id="profile-sort"
            name="sortBy"
            value={filters.sortBy ?? 'recent'}
            onChange={(event) => handleChange('sortBy', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="profile-availability" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Availability
          </label>
          <select
            id="profile-availability"
            name="availability"
            value={filters.availability ?? ''}
            onChange={(event) => handleChange('availability', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="profile-role" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Primary role
          </label>
          <select
            id="profile-role"
            name="userType"
            value={filters.userType ?? ''}
            onChange={(event) => handleChange('userType', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="profile-membership" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Membership tag
          </label>
          <input
            id="profile-membership"
            name="membership"
            type="text"
            placeholder="e.g. compliance"
            value={filters.membership ?? ''}
            onChange={(event) => handleChange('membership', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="profile-avatar" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Avatar
          </label>
          <select
            id="profile-avatar"
            name="hasAvatar"
            value={filters.hasAvatar ?? ''}
            onChange={(event) => handleChange('hasAvatar', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {AVATAR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:w-48">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          Apply search
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <PlusIcon className="mr-2 h-5 w-5" /> New profile
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearchValue('');
              if (typeof onFiltersChange === 'function') {
                onFiltersChange({
                  search: '',
                  availability: '',
                  userType: '',
                  membership: '',
                  hasAvatar: '',
                  sortBy: filters.sortBy ?? 'recent',
                });
              }
            }}
            className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </form>
  );
}
