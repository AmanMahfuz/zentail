export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function generateWithOllama(
  prompt: string,
  model: string = 'mistral'
): Promise<string> {
  try {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
    console.log(`[Ollama] Calling local model ${model} at ${url}...`);
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || model,
          prompt,
          stream: false,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('[Ollama] Generation error:', error);
    throw error;
  }
}
