export type AICompletionInput = {
  system: string;
  user: string;
  temperature?: number;
};

export async function createAICompletion(input: AICompletionInput) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: input.system },
        { role: "user", content: input.user }
      ],
      temperature: input.temperature ?? 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  return response.json();
}
