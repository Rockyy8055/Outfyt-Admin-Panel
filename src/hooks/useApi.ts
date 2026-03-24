'use client';

import { useState, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseApiReturn<T, P extends unknown[]> extends UseApiState<T> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T, P extends unknown[] = []>(
  apiFunction: (...params: P) => Promise<T>
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await apiFunction(...params);
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'An error occurred';
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
