'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { searchApi } from '@/services/supabase';
import type { SearchResultItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Search, Package, User, Store, Loader2 } from 'lucide-react';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    orders: SearchResultItem[];
    users: SearchResultItem[];
    stores: SearchResultItem[];
  }>({ orders: [], users: [], stores: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (debouncedQuery.length < 2) {
        setResults({ orders: [], users: [], stores: [] });
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchApi.global(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults({ orders: [], users: [], stores: [] });
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResultItem) => {
    const link = result.type === 'order' 
      ? `/admin/orders/${result.id}` 
      : result.type === 'user' 
        ? `/admin/users` 
        : `/admin/stores`;
    router.push(link);
    setQuery('');
    setResults({ orders: [], users: [], stores: [] });
    setIsOpen(false);
  };

  const getIcon = (type: 'order' | 'user' | 'store') => {
    switch (type) {
      case 'order':
        return Package;
      case 'user':
        return User;
      case 'store':
        return Store;
    }
  };

  const allResults = [
    ...results.orders,
    ...results.users,
    ...results.stores,
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search orders, users, stores..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && allResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {allResults.map((result) => {
            const Icon = getIcon(result.type);
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-900">{result.title}</p>
                  <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase">{result.type}</span>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.length >= 2 && !isLoading && allResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-lg">
          No results found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
