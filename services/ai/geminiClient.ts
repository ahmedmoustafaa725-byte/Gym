type GeminiOptions = {
  temperature?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function cleanJSON(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function isGeminiEnabled() {
  return process.env.AI_PROVIDER === "gemini" && Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiJSON<T>(prompt: string, fallback: T, options: GeminiOptions = {}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  if (!apiKey || process.env.AI_PROVIDER !== "gemini") {
    return fallback;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: options.temperature ?? 0.25
      }
    })
  });

  if (!response.ok) {
    return fallback;
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  if (!text.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(cleanJSON(text)) as T;
  } catch {
    return fallback;
  }
}
