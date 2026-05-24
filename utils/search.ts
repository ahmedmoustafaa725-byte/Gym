const arabicDiacritics = /[\u064B-\u065F\u0670]/g;

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(arabicDiacritics, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesSearch(haystack: string[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  return haystack.some((item) => normalizeSearch(item).includes(normalizedQuery));
}
