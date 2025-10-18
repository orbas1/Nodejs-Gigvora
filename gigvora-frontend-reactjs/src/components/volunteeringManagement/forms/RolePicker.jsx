import { Fragment, useMemo, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import useOpportunityListing from '../../../hooks/useOpportunityListing.js';
import { toComboboxOption } from '../utils.js';

export default function RolePicker({ value, onChange, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data, loading } = useOpportunityListing('volunteering', query, {
    pageSize: 8,
    enabled: open,
  });

  const options = useMemo(() => {
    const items = Array.isArray(data?.items) ? data.items : [];
    const mapped = items
      .map((role) => toComboboxOption(role))
      .filter((option) => option && option.id != null);

    const existing = new Map(mapped.map((option) => [option.id, option]));
    if (value?.id && !existing.has(value.id)) {
      existing.set(value.id, toComboboxOption(value));
    }

    return Array.from(existing.values());
  }, [data?.items, value]);

  return (
    <Combobox
      value={value?.id ? value : null}
      onChange={(role) => {
        onChange(role ? { id: role.id, title: role.name, organization: role.subtitle, location: role.location } : null);
        setQuery('');
      }}
      disabled={disabled}
    >
      <div className="relative">
        <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <MagnifyingGlassIcon className="mr-2 h-4 w-4 text-slate-400" />
          <Combobox.Input
            className="w-full border-none p-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            placeholder="Search roles"
            displayValue={(role) => role?.name ?? ''}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
          />
          <Combobox.Button className="ml-2 text-slate-400">
            <ChevronUpDownIcon className="h-5 w-5" />
          </Combobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
            {loading ? (
              <div className="px-4 py-2 text-sm text-slate-500">Loading…</div>
            ) : options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500">No roles</div>
            ) : (
              options.map((option) => (
                <Combobox.Option
                  key={option.id}
                  value={option}
                  className={({ active }) =>
                    `flex cursor-pointer items-center justify-between px-4 py-2 text-sm ${
                      active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-700'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <div>
                        <p className="font-semibold">{option.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {option.subtitle ? <span>{option.subtitle}</span> : null}
                          {option.location ? (
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-3.5 w-3.5" /> {option.location}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {selected ? <CheckIcon className="h-4 w-4" /> : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
