import type { Exercise } from "@/types";

export type ExerciseVideoProvider = {
  name: string;
  description: string;
  licenseGuidance: string;
  fetchByExercise?: (exercise: Exercise) => Promise<Pick<Exercise, "videoUrl" | "thumbnail" | "licenseNote"> | null>;
};

export const exerciseVideoProviders: ExerciseVideoProvider[] = [
  {
    name: "Wikimedia Commons",
    description: "Public media repository where individual file pages define reuse license and attribution.",
    licenseGuidance: "Always store file-page attribution and verify each clip's license before shipping."
  },
  {
    name: "wger compatible",
    description: "Open-source fitness manager with exercise data and optional videos/images.",
    licenseGuidance: "wger content has per-entry Creative Commons metadata; preserve attribution and share-alike obligations."
  },
  {
    name: "YouTube embeds/search",
    description: "Credential-free embed or search links for technique videos when the creator allows playback on YouTube.",
    licenseGuidance: "Prefer official embed URLs or search links. Do not download or re-host YouTube videos."
  },
  {
    name: "Manual verified URL",
    description: "Admin-added video URLs for clips you own, commission, or can legally reuse.",
    licenseGuidance: "Only add clips with explicit commercial/product reuse rights."
  }
];
