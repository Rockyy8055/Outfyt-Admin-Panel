'use client';

import { useState, useCallback } from 'react';

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  offset: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  total = 0,
}: UsePaginationProps = {}): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const totalPages = Math.ceil(total / limit);

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, Math.min(newPage, totalPages || 1)));
  }, [totalPages]);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const prevPage = useCallback(() => {
    setPage(page - 1);
  }, [page, setPage]);

  const goToFirst = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLast = useCallback(() => {
    setPage(totalPages);
  }, [setPage, totalPages]);

  return {
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    offset: (page - 1) * limit,
  };
}

export default usePagination;
