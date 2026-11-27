import type { GeminiModelOption } from '@/db/types';

export const DEFAULT_GEMINI_MODELS: GeminiModelOption[] = [
  { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Fast & Balanced)' },
  { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro (Deep Reasoning)' },
  { id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash-Lite (Lightweight)' },
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
];

interface RawGeminiModel {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

/**
 * Fetches available models from Google Gemini REST API using the user's custom API key.
 * Filters to models supporting generateContent.
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<GeminiModelOption[]> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('Gemini API key is required.');
  }

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    method: 'GET',
    headers: {
      'x-goog-api-key': trimmed,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch models (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { models?: RawGeminiModel[] };
  const models = (data.models ?? [])
    .filter(
      (m) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.name.includes('gemini')
    )
    .map((m) => ({
      id: m.name.replace(/^models\//, ''),
      displayName: m.displayName ?? m.name.replace(/^models\//, ''),
    }));

  return models.length > 0 ? models : DEFAULT_GEMINI_MODELS;
}

/**
 * Calls Google Gemini REST generateContent endpoint.
 */
export async function callGeminiAPI(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { apiKey, model, systemPrompt, userPrompt } = params;
  const trimmedKey = apiKey.trim();
  const modelId = (model || 'gemini-2.5-flash').replace(/^models\//, '');

  if (!trimmedKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': trimmedKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }
  return text.trim();
}
