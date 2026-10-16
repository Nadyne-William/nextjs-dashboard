'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';

export type FilterOption = { value: string; label: string };

export type SelectFilter = {
  /** URL search param this filter writes to, e.g. "status". */
  param: string;
  label: string;
  options: FilterOption[];
  /** Value meaning "no filter". It's left out of the URL. */
  defaultValue: string;
};

type FilterBarProps = {
  searchPlaceholder: string;
  filters?: SelectFilter[];
  /** Extra controls on the right, e.g. a "Create" button. */
  actions?: React.ReactNode;
};

/**
 * Search plus any number of select filters, all stored in the URL.
 * Because the URL is the state, a filtered view can be refreshed, bookmarked
 * or shared, and the server renders exactly the rows that match.
 */
export function FilterBar({ searchPlaceholder, filters = [], actions }: FilterBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get('query') ?? '';
  const [query, setQuery] = useState(urlQuery);

  // Keep the input in step when the URL changes from elsewhere (back button, "Clear all").
  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Any change to what's shown starts again from the first page.
    params.delete('page');
    const qs = params.toString();
    startTransition(() => replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const commitSearch = useDebouncedCallback((term: string) => {
    updateParams({ query: term.trim() || null });
  }, 300);

  const activeFilters = filters.filter((f) => {
    const value = searchParams.get(f.param);
    return value !== null && value !== f.defaultValue;
  });
  const hasActiveFilters = urlQuery !== '' || activeFilters.length > 0;

  const clearAll = () => {
    commitSearch.cancel();
    setQuery('');
    updateParams(Object.fromEntries([['query', null], ...filters.map((f) => [f.param, null])]));
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="relative flex flex-1 flex-shrink-0">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          id="search"
          type="search"
          className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            commitSearch(e.target.value);
          }}
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
      </div>

      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <div key={filter.param}>
            <label htmlFor={`filter-${filter.param}`} className="sr-only">
              {filter.label}
            </label>
            <select
              id={`filter-${filter.param}`}
              className={clsx(
                'h-10 cursor-pointer rounded-md border py-2 pl-3 pr-8 text-sm',
                searchParams.get(filter.param) && searchParams.get(filter.param) !== filter.defaultValue
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200',
              )}
              value={searchParams.get(filter.param) ?? filter.defaultValue}
              onChange={(e) =>
                updateParams({
                  [filter.param]: e.target.value === filter.defaultValue ? null : e.target.value,
                })
              }
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="flex h-10 items-center gap-1 whitespace-nowrap rounded-md px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear all
          </button>
        ) : null}

        <span
          className={clsx(
            'h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 transition-opacity',
            isPending ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden
        />

        {actions ? <div className="ml-auto md:ml-2">{actions}</div> : null}
      </div>
    </div>
  );
}
