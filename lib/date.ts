export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

export function dayIndexFromDate(date = new Date()) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}
