import { estimateMealFromText } from "@/services/ai/mealEstimator";

export async function parseFoodMessage(input: string) {
  return estimateMealFromText(input);
}
