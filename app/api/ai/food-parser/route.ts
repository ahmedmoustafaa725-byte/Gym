import { NextResponse } from "next/server";
import { estimateMealFromText } from "@/services/ai/mealEstimator";
import { generateGeminiJSON } from "@/services/ai/geminiClient";

type FoodParserResponse = ReturnType<typeof estimateMealFromText>;

export async function POST(request: Request) {
  const { message } = (await request.json()) as { message?: string };
  const input = message?.trim() ?? "";

  if (!input) {
    return NextResponse.json(estimateMealFromText(""));
  }

  const fallback = estimateMealFromText(input);
  const prompt = `
You are NileFit AI, a fitness nutrition parser for Egyptian and Middle Eastern food.
Parse this user's food message into calories and macros.
Support English, Arabic, Egyptian Arabic, slang, and portions like ربع رغيف, نص رغيف, كوباية, رغيف.
Be conservative and ask for clarification if the portion is impossible to estimate.

Return ONLY JSON with this exact shape:
{
  "mealName": "string",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "notes": "string",
  "breakdown": ["food item: kcal"],
  "needsClarification": false
}

User message:
${input}
`;

  const parsed = await generateGeminiJSON<FoodParserResponse>(prompt, fallback, { temperature: 0.15 });
  return NextResponse.json(parsed);
}
