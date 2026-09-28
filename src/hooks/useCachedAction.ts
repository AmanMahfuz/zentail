"use client";

import { useState, useCallback, useRef } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Global in-memory cache map across component mounts
const globalClientCache = new Map<string, CacheItem<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

export interface UseCachedActionOptions {
  ttlMs?: number; // Default: 5 minutes
  cacheKeyPrefix?: string;
}

export function useCachedAction<TInput, TOutput>(
  actionFn: (input: TInput) => Promise<TOutput>,
  options: UseCachedActionOptions = {}
) {
  const { ttlMs = 5 * 60 * 1000, cacheKeyPrefix = "client_cache" } = options;
  const [data, setData] = useState<TOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const getCacheKey = useCallback(
    (input: TInput): string => {
      try {
        return `${cacheKeyPrefix}:${JSON.stringify(input)}`;
      } catch {
        return `${cacheKeyPrefix}:${String(input)}`;
      }
    },
    [cacheKeyPrefix]
  );

  const execute = useCallback(
    async (
      input: TInput,
      execOptions?: { forceRefresh?: boolean }
    ): Promise<TOutput> => {
      const key = getCacheKey(input);
      const now = Date.now();

      // 1. Check in-memory client cache
      if (!execOptions?.forceRefresh) {
        const cached = globalClientCache.get(key);
        if (cached && now - cached.timestamp < ttlMs) {
          setData(cached.data);
          setIsFromCache(true);
          setIsLoading(false);
          setError(null);
          return cached.data;
        }
      }

      // 2. Check in-flight promise deduplication
      if (inFlightPromises.has(key)) {
        setIsLoading(true);
        try {
          const result = await inFlightPromises.get(key);
          setData(result);
          setIsFromCache(true);
          return result;
        } finally {
          setIsLoading(false);
        }
      }

      // 3. Execute action
      setIsLoading(true);
      setError(null);
      setIsFromCache(false);

      const promise = actionFn(input)
        .then((result) => {
          globalClientCache.set(key, { data: result, timestamp: Date.now() });
          setData(result);
          return result;
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          throw err;
        })
        .finally(() => {
          inFlightPromises.delete(key);
          setIsLoading(false);
        });

      inFlightPromises.set(key, promise);
      return promise;
    },
    [actionFn, getCacheKey, ttlMs]
  );

  const clearCache = useCallback(
    (input?: TInput) => {
      if (input !== undefined) {
        const key = getCacheKey(input);
        globalClientCache.delete(key);
      } else {
        for (const k of globalClientCache.keys()) {
          if (k.startsWith(`${cacheKeyPrefix}:`)) {
            globalClientCache.delete(k);
          }
        }
      }
    },
    [cacheKeyPrefix, getCacheKey]
  );

  return {
    data,
    isLoading,
    error,
    isFromCache,
    execute,
    clearCache,
    setData,
  };
}
