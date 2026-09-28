// src/lib/cache.ts
import crypto from "crypto";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { Redis } from "@upstash/redis";

// Optional Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Default TTL Constants (in days)
export const CACHE_TTL_DAYS = {
  JD_PARSE: 30,
  RESUME_EXTRACT: 30,
  MATCH_ANALYSIS: 14,
  RESUME_TAILOR: 14,
  INTERVIEW_PREP: 14,
  DEFAULT: 14,
};

// In-memory LRU-like store for ultra-fast warm hits (<5ms)
interface MemoryEntry {
  payload: any;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryEntry>();
const MAX_MEMORY_ENTRIES = 500;

function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

/**
 * Deterministically generates a SHA-256 hash for any cache type and payload
 */
export function generateCacheKey(type: string, input: any): string {
  const normalize = (val: any): any => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val.trim().toLowerCase();
    if (typeof val === "number" || typeof val === "boolean") return val;
    if (Array.isArray(val)) return val.map(normalize);
    if (typeof val === "object") {
      const sortedKeys = Object.keys(val).sort();
      const result: Record<string, any> = {};
      for (const k of sortedKeys) {
        result[k] = normalize(val[k]);
      }
      return result;
    }
    return String(val);
  };

  const normalized = JSON.stringify(normalize(input));
  const hash = crypto.createHash("sha256").update(`${type}:${normalized}`).digest("hex");
  return `aicache:${type}:${hash}`;
}

export interface CacheResult<T> {
  data: T;
  hit: boolean;
  modelUsed?: string;
  hitCount?: number;
  tokensSaved?: number;
}

/**
 * Retrieves cached AI output from In-Memory -> Redis (if configured) -> Supabase
 */
export async function getCachedAIResult<T>(
  type: string,
  input: any,
  options?: { forceRefresh?: boolean; tokensToAdd?: number }
): Promise<CacheResult<T> | null> {
  if (options?.forceRefresh) return null;

  const key = generateCacheKey(type, input);
  const now = Date.now();

  // 1. Check in-memory warm cache
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > now) {
    return {
      data: mem.payload as T,
      hit: true,
      hitCount: 1,
      tokensSaved: options?.tokensToAdd || 500,
    };
  }

  // 2. Check Redis if available
  if (redis) {
    try {
      const redisData = await redis.get(key);
      if (redisData) {
        const parsed = typeof redisData === "string" ? JSON.parse(redisData) : redisData;
        memoryCache.set(key, { payload: parsed, expiresAt: now + 3600000 });
        return {
          data: parsed as T,
          hit: true,
          tokensSaved: options?.tokensToAdd || 500,
        };
      }
    } catch (err) {
      console.warn("[Redis Cache GET Error]", err);
    }
  }

  // 3. Check persistent Supabase database
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await (supabase as any)
      .from("ai_cache")
      .select("payload, model_used, hit_count, estimated_tokens_saved, expires_at")
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Cache in memory for subsequent calls
    const expiresMs = new Date(data.expires_at).getTime();
    memoryCache.set(key, { payload: data.payload, expiresAt: Math.min(expiresMs, now + 3600000) });

    // Asynchronously record hit
    const tokens = options?.tokensToAdd || 500;
    (async () => {
      try {
        await (supabase as any).rpc("increment_cache_hit", {
          p_cache_key: key,
          p_tokens_to_add: tokens,
        });
      } catch {
        // Fallback update if RPC fails
        await (supabase as any)
          .from("ai_cache")
          .update({
            hit_count: (data.hit_count || 1) + 1,
            last_hit_at: new Date().toISOString(),
          })
          .eq("cache_key", key);
      }
    })().catch(() => {});

    return {
      data: data.payload as T,
      hit: true,
      modelUsed: data.model_used,
      hitCount: (data.hit_count || 1) + 1,
      tokensSaved: (data.estimated_tokens_saved || 0) + tokens,
    };
  } catch (err) {
    console.error("[Database Cache GET Error]", err);
    return null;
  }
}

/**
 * Stores AI output into In-Memory + Supabase (+ Redis if configured)
 */
export async function setCachedAIResult(
  type: string,
  input: any,
  payload: any,
  options?: { ttlDays?: number; tokens?: number; model?: string }
): Promise<void> {
  const key = generateCacheKey(type, input);
  const ttlDays = options?.ttlDays || CACHE_TTL_DAYS.DEFAULT;
  const ttlSeconds = ttlDays * 86400;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // 1. Store in memory
  cleanMemoryCache();
  memoryCache.set(key, {
    payload,
    expiresAt: Date.now() + Math.min(ttlSeconds * 1000, 3600000), // 1 hour max in volatile memory
  });

  // 2. Store in Redis if configured
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(payload));
    } catch (err) {
      console.warn("[Redis Cache SET Error]", err);
    }
  }

  // 3. Store persistently in Supabase
  try {
    const supabase = await createSupabaseServerClient();
    await (supabase as any).from("ai_cache").upsert(
      {
        cache_key: key,
        cache_type: type,
        payload,
        model_used: options?.model || "gemini-2.5-flash",
        estimated_tokens_saved: options?.tokens || 500,
        hit_count: 1,
        created_at: new Date().toISOString(),
        last_hit_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "cache_key" }
    );
  } catch (err) {
    console.error("[Database Cache SET Error]", err);
  }
}

/**
 * Delete a cache entry manually (for testing or cache invalidation)
 */
export async function invalidateCache(type: string, input: any): Promise<void> {
  const key = generateCacheKey(type, input);
  memoryCache.delete(key);

  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn("[Redis Cache DEL Error]", err);
    }
  }

  try {
    const supabase = await createSupabaseServerClient();
    await (supabase as any).from("ai_cache").delete().eq("cache_key", key);
  } catch (err) {
    console.error("[Database Cache DEL Error]", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Legacy Namespace for Backward Compatibility
// ─────────────────────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const data = await redis.get(key);
      return data as T | null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function setCache(key: string, data: any, ttl: number) {
  if (redis) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch {}
  }
}

export async function deleteCache(key: string) {
  if (redis) {
    try {
      await redis.del(key);
    } catch {}
  }
}

export const Cache = {
  skillGaps: {
    get: (userId: string) => getCache(`skill_gaps:${userId}`),
    set: (userId: string, data: any) => setCache(`skill_gaps:${userId}`, data, 604800),
    clear: (userId: string) => deleteCache(`skill_gaps:${userId}`),
  },
  company: {
    get: (name: string) => getCache(`company:${name.toLowerCase().replace(/\s/g, "_")}`),
    set: (name: string, data: any) => setCache(`company:${name.toLowerCase().replace(/\s/g, "_")}`, data, 2592000),
  },
  resources: {
    get: (skill: string) => getCache(`resources:${skill.toLowerCase()}`),
    set: (skill: string, data: any) => setCache(`resources:${skill.toLowerCase()}`, data, 2592000),
  },
  jdParse: {
    get: (hash: string) => getCache(`jd_parsed:${hash}`),
    set: (hash: string, data: any) => setCache(`jd_parsed:${hash}`, data, 7776000),
  },
  interviewQs: {
    get: (company: string, role: string) => getCache(`interview_qs:${company.toLowerCase()}:${role.toLowerCase()}`),
    set: (company: string, role: string, data: any) => setCache(`interview_qs:${company.toLowerCase()}:${role.toLowerCase()}`, data, 604800),
  },
  resumeMatch: {
    get: (resumeId: string, jdHash: string) => getCache(`resume_match:${resumeId}:${jdHash}`),
    set: (resumeId: string, jdHash: string, data: any) => setCache(`resume_match:${resumeId}:${jdHash}`, data, 604800),
  },
};
