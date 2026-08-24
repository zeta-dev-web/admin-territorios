export function formatCongregationName(name: string): string {
  if (!name) return "";
  // Don't add "Congregación" if it's already there
  if (name.toLowerCase().startsWith("congregación")) {
    return name;
  }
  return `Congregación ${name}`;
}

export function cleanCongregationName(name: string): string {
  if (!name) return "";
  // Remove "Congregación" prefix if it exists
  const cleaned = name.replace(/^congregación\s+/i, "").trim();
  return cleaned;
}
