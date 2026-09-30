import { GoogleGenAI } from "@google/genai";
import { generateWithOllama } from "./ai/ollama-client";

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

/**
 * Resilient Gemini caller with automatic retry on transient 503/429 errors and fallback model progression.
 */
export async function generateContentWithRetry(options: GenerateWithRetryOptions) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = options.ai || new GoogleGenAI({ apiKey });
  const primaryModel = options.model || "gemini-3.8-flash";
  const fallbackModels = options.fallbackModels || ["gemini-3.5-flash", "gemini-2.5-flash"];
  const candidateModels = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];
  const maxRetries = options.maxRetriesPerModel ?? 3;
  const initialDelay = options.initialDelayMs ?? 1000;

  let lastError: any = null;

  for (const modelName of candidateModels) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || "");
        const status =
          err?.status ||
          err?.code ||
          (err?.error && (err.error.code || err.error.status));

        const isTransient =
          status === 503 ||
          status === 429 ||
          status === 500 ||
          status === "UNAVAILABLE" ||
          status === "RESOURCE_EXHAUSTED" ||
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("overloaded");

        if (isTransient && attempt < maxRetries) {
          const waitTime = initialDelay * Math.pow(1.5, attempt - 1);
          console.warn(
            `[Gemini] Model ${modelName} returned transient error (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(waitTime)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        console.warn(
          `[Gemini] Model ${modelName} attempt ${attempt}/${maxRetries} failed:`,
          msg.slice(0, 150)
        );
        break;
      }
    }
  }

  console.warn("[Gemini] All models failed. Falling back to local Ollama...");
  try {
    let promptStr = "";
    if (typeof options.contents === "string") {
      promptStr = options.contents;
    } else if (Array.isArray(options.contents)) {
      promptStr = JSON.stringify(options.contents);
    } else {
      promptStr = JSON.stringify(options.contents);
    }
    
    if (options.config?.systemInstruction) {
      promptStr = `SYSTEM INSTRUCTION: ${options.config.systemInstruction}\n\nUSER PROMPT: ${promptStr}`;
    }

    if (options.config?.responseSchema) {
      promptStr += "\n\nCRITICAL: YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT MATCHING THIS EXACT SCHEMA AND NO ADDITIONAL TEXT OR MARKDOWN WRAPPERS:\n" + JSON.stringify(options.config.responseSchema, null, 2);
    }

    const ollamaResponseText = await generateWithOllama(promptStr);
    
    let cleanedText = ollamaResponseText.trim();
    if (cleanedText.includes("\`\`\`")) {
       cleanedText = cleanedText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    
    return { text: cleanedText } as any;
  } catch (ollamaErr) {
    console.error("[Ollama] Fallback also failed:", ollamaErr);
    throw lastError || ollamaErr;
  }
}
