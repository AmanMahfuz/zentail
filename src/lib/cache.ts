import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// TTL Constants (in seconds)
const TTL = {
  SKILL_GAPS: 604800,    // 7 days
  COMPANY: 2592000,      // 30 days
  RESOURCES: 2592000,    // 30 days
  JD_PARSE: 7776000,     // 90 days
  INTERVIEW_QS: 604800,  // 7 days
  RESUME_MATCH: 604800,  // 7 days
};

// Generic get/set/del
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return null; // Fail gracefully if not configured
    const data = await redis.get(key);
    return data as T | null;
  } catch (err) {
    console.error(`[Cache GET Error] Key: ${key}`, err);
    return null; // If Redis fails, continue without cache
  }
}

export async function setCache(key: string, data: any, ttl: number) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return; // Fail gracefully if not configured
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error(`[Cache SET Error] Key: ${key}`, err);
    // If Redis fails, just don't cache
  }
}

export async function deleteCache(key: string) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;
    await redis.del(key);
  } catch (err) {
    console.error(`[Cache DEL Error] Key: ${key}`, err);
  }
}

// Feature-specific functions namespace
export const Cache = {
  skillGaps: {
    get: (userId: string) => getCache(`skill_gaps:${userId}`),
    set: (userId: string, data: any) =>
      setCache(`skill_gaps:${userId}`, data, TTL.SKILL_GAPS),
    clear: (userId: string) => deleteCache(`skill_gaps:${userId}`),
  },

  company: {
    get: (name: string) =>
      getCache(`company:${name.toLowerCase().replace(/\s/g, "_")}`),
    set: (name: string, data: any) =>
      setCache(
        `company:${name.toLowerCase().replace(/\s/g, "_")}`,
        data,
        TTL.COMPANY
      ),
  },

  resources: {
    get: (skill: string) => getCache(`resources:${skill.toLowerCase()}`),
    set: (skill: string, data: any) =>
      setCache(`resources:${skill.toLowerCase()}`, data, TTL.RESOURCES),
  },

  jdParse: {
    get: (hash: string) => getCache(`jd_parsed:${hash}`),
    set: (hash: string, data: any) => setCache(`jd_parsed:${hash}`, data, TTL.JD_PARSE),
  },

  interviewQs: {
    get: (company: string, role: string) =>
      getCache(`interview_qs:${company.toLowerCase()}:${role.toLowerCase()}`),
    set: (company: string, role: string, data: any) =>
      setCache(
        `interview_qs:${company.toLowerCase()}:${role.toLowerCase()}`,
        data,
        TTL.INTERVIEW_QS
      ),
  },

  resumeMatch: {
    get: (resumeId: string, jdHash: string) => 
      getCache(`resume_match:${resumeId}:${jdHash}`),
    set: (resumeId: string, jdHash: string, data: any) =>
      setCache(`resume_match:${resumeId}:${jdHash}`, data, TTL.RESUME_MATCH),
  },
};
