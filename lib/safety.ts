export const safetyDisclaimer =
  "This product provides general fitness and nutrition guidance, not medical advice. Speak with a qualified clinician before starting a program if you have medical conditions, injuries, eating disorder history, pregnancy, or unusual symptoms. Stop training through sharp or serious pain.";

export function clampCalories(calories: number) {
  return Math.max(1400, Math.min(4200, Math.round(calories)));
}

export function injuryWarning(injuries?: string) {
  if (!injuries?.trim()) {
    return "Move with control and stop if an exercise causes sharp pain.";
  }

  return `Your noted limitation: ${injuries}. Choose pain-free ranges and use alternatives when needed.`;
}
