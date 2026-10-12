import { GoogleGenAI } from "@google/genai";

export interface GenerateWithRetryOptions {
  ai?: GoogleGenAI;
  apiKey?: string;
  model?: string;
  fallbackModels?: string[];
  contents: any;
  config?: any;
  maxRetriesPerModel?: number;
  initialDelayMs?: number;
}

interface KeyMetadata {
  key: string;
  cooldownUntil: number;
  lastErrorReason?: string;
}

const keyMetadataMap = new Map<string, KeyMetadata>();

function getKeyMask(key: string): string {
  if (!key) return "••••";
  if (key.length <= 8) return "••••" + key.slice(-2);
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

/**
 * Retrieve all configured Gemini API keys from environment variables.
 * Checks GEMINI_API_KEYS (comma-separated list), GEMINI_API_KEY, and GOOGLE_GEMINI_API_KEY.
 * Returns an array of trimmed, non-empty keys.
 */
export function getGeminiApiKeys(): string[] {
  const pool = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && !k.includes("your-gemini-api-key") && !k.includes("AIzaSyYourGeminiApiKeyHere"));

  const single = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "").trim();

  const allKeys = [...pool];
  if (single && !allKeys.includes(single) && !single.includes("your-gemini-api-key") && !single.includes("AIzaSyYourGeminiApiKeyHere")) {
    allKeys.push(single);
  }

  // Populate process.env.GEMINI_API_KEY for backward compatibility if not present
  if (!process.env.GEMINI_API_KEY && allKeys.length > 0) {
    process.env.GEMINI_API_KEY = allKeys[0];
  }

  return allKeys;
}

/**
 * Get the currently best available Gemini API key from the pool.
 */
export function getGeminiApiKey(): string | undefined {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return undefined;

  const now = Date.now();
  // Prefer key with earliest cooldown or healthy
  const healthy = keys.find((k) => (keyMetadataMap.get(k)?.cooldownUntil || 0) <= now);
  return healthy || keys[0];
}

// Initial sync on module load
getGeminiApiKeys();

/**
 * Resilient Gemini caller with automatic key pooling, failover on 401/402/429,
 * retry on transient errors, and fallback model progression.
 */
export async function generateContentWithRetry(options: GenerateWithRetryOptions) {
  const configuredKeys = getGeminiApiKeys();
  const optionsKey = options.apiKey?.trim();

  let keysToTry: string[] = [];
  if (optionsKey) {
    keysToTry = [optionsKey, ...configuredKeys.filter((k) => k !== optionsKey)];
  } else {
    keysToTry = [...configuredKeys];
  }

  if (keysToTry.length === 0) {
    throw new Error(
      "Gemini API key is not configured. Please set GEMINI_API_KEYS or GEMINI_API_KEY in your .env.local file."
    );
  }

  // Sort keys: healthy keys (cooldown passed) first
  const now = Date.now();
  keysToTry.sort((a, b) => {
    const metaA = keyMetadataMap.get(a)?.cooldownUntil || 0;
    const metaB = keyMetadataMap.get(b)?.cooldownUntil || 0;
    const aAvailable = metaA <= now;
    const bAvailable = metaB <= now;
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    return metaA - metaB;
  });

  const primaryModel = options.model || "gemini-flash-latest";
  const fallbackModels = options.fallbackModels || [
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-pro-latest",
  ];
  const candidateModels = [
    primaryModel,
    ...fallbackModels.filter((m) => m !== primaryModel),
  ];
  const maxRetries = options.maxRetriesPerModel ?? 2;
  const initialDelay = options.initialDelayMs ?? 800;

  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < keysToTry.length; keyIdx++) {
    const currentKey = keysToTry[keyIdx];
    const keyMask = getKeyMask(currentKey);

    // Use options.ai only on the very first key if caller provided it and didn't specify a different key
    const ai =
      keyIdx === 0 && options.ai && (!optionsKey || optionsKey === currentKey)
        ? options.ai
        : new GoogleGenAI({ apiKey: currentKey });

    let advanceToNextKey = false;

    for (const modelName of candidateModels) {
      if (advanceToNextKey) break;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timeoutMs = 15000;
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`[Gemini] Timeout after ${timeoutMs}ms on ${modelName}`)), timeoutMs)
          );
          const response = (await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: options.contents,
              config: options.config,
            }),
            timeoutPromise,
          ])) as any;

          // Mark key as healthy
          keyMetadataMap.set(currentKey, {
            key: currentKey,
            cooldownUntil: 0,
          });

          return response;
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || err || "");
          const status =
            err?.status ||
            err?.code ||
            (err?.error && (err.error.code || err.error.status));

          const isDepleted =
            status === 402 ||
            msg.includes("402") ||
            msg.includes("prepayment credits are depleted") ||
            msg.includes("billing#prepay");

          if (isDepleted) {
            console.warn(
              `[Gemini] Key ${keyMask} prepayment credits depleted (HTTP 402).`
            );
            keyMetadataMap.set(currentKey, {
              key: currentKey,
              cooldownUntil: Date.now() + 10 * 60 * 1000, // 10 min cooldown
              lastErrorReason: "402 Credits Depleted",
            });
            advanceToNextKey = true;
            break;
          }

          const isAuthError =
            status === 401 ||
            msg.includes("401") ||
            msg.includes("UNAUTHENTICATED") ||
            msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
            msg.includes("invalid authentication credentials") ||
            msg.includes("API key not valid");

          if (isAuthError) {
            console.warn(
              `[Gemini] Key ${keyMask} authentication failed (HTTP 401: Invalid / Unsupported Key).`
            );
            keyMetadataMap.set(currentKey, {
              key: currentKey,
              cooldownUntil: Date.now() + 30 * 60 * 1000, // 30 min cooldown
              lastErrorReason: "401 Authentication Failed",
            });
            advanceToNextKey = true;
            break;
          }

          const isQuotaOrRateLimit =
            status === 429 ||
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED") ||
            msg.includes("quota");

          if (isQuotaOrRateLimit) {
            console.warn(
              `[Gemini] Key ${keyMask} model ${modelName} hit quota / rate limit (HTTP 429). Trying next candidate model...`
            );
            keyMetadataMap.set(currentKey, {
              key: currentKey,
              cooldownUntil: Date.now() + 60 * 1000,
              lastErrorReason: "429 Rate Limit",
            });
            break; // Try next model on this key first
          }

          const isTransient =
            status === 503 ||
            status === 500 ||
            status === "UNAVAILABLE" ||
            msg.includes("503") ||
            msg.includes("high demand") ||
            msg.includes("UNAVAILABLE") ||
            msg.includes("overloaded");

          if (isTransient && attempt < maxRetries) {
            const waitTime = initialDelay * Math.pow(1.5, attempt - 1);
            console.warn(
              `[Gemini] Key ${keyMask} model ${modelName} transient error (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(waitTime)}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          console.warn(
            `[Gemini] Key ${keyMask} model ${modelName} attempt ${attempt}/${maxRetries} unavailable:`,
            msg.slice(0, 120)
          );
          break; // Try next model
        }
      }
    }

    if (keyIdx < keysToTry.length - 1) {
      console.warn(
        `[Gemini] Key ${keyMask} exhausted for available models. Failing over to next key in pool (${keyIdx + 2}/${keysToTry.length})...`
      );
    }
  }

  // Attempt Groq fallback if all Gemini keys fail
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey && groqKey.length > 0) {
    console.warn(`[Gemini -> Groq] All ${keysToTry.length} Gemini keys exhausted. Attempting blazing-fast fallback to Groq LLaMA 3.3 70B...`);
    try {
      let promptText = "";
      if (typeof options.contents === "string") {
        promptText = options.contents;
      } else if (Array.isArray(options.contents)) {
        promptText = options.contents.map(c => 
          c.parts?.map((p: any) => p.text).join("\n") || ""
        ).join("\n");
      } else {
        promptText = JSON.stringify(options.contents);
      }

      // Handle system instruction if provided in config
      const systemInstruction = options.config?.systemInstruction;
      let sysText = "";
      if (systemInstruction) {
        if (typeof systemInstruction === "string") {
          sysText = systemInstruction;
        } else if (systemInstruction.parts) {
          sysText = systemInstruction.parts.map((p: any) => p.text).join("\n");
        }
      }

      const messages = [];
      if (sysText) {
        messages.push({ role: "system", content: sysText });
      }
      messages.push({ role: "user", content: promptText });

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: options.config?.temperature ?? 0.7,
          response_format: options.config?.responseMimeType === "application/json" ? { type: "json_object" } : undefined
        })
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const textResponse = groqData.choices[0].message.content;
        console.warn(`[Groq Fallback] Success! Returning LLaMA 3.3 response.`);
        
        // Mock the Gemini SDK response shape
        return {
          text: textResponse,
          text_getter: () => textResponse, // in case it's a function call
        } as any;
      } else {
        console.error(`[Groq Fallback] API Error: ${await groqRes.text()}`);
      }
    } catch (groqErr) {
      console.error(`[Groq Fallback] Failed:`, groqErr);
    }
  }

  // Gracefully throw to allow agent fallbacks without freezing the machine
  console.warn(
    `[Gemini] All ${keysToTry.length} keys in pool exhausted or unavailable. Triggering application heuristic fallback.`
  );
  throw lastError || new Error("Gemini AI models unavailable across all API keys.");
}
