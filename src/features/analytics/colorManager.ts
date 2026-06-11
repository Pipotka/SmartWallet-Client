import { CHART_COLORS } from './constants';

const STORAGE_KEY = 'chart-category-colors';

let cachedMapping: Record<string, string> | null = null;

function loadMapping(): Record<string, string> {
  if (cachedMapping !== null) {
    return cachedMapping;
  }
  let mapping: Record<string, string>;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    mapping = stored ? JSON.parse(stored) : {};
  } catch {
    mapping = {};
  }
  cachedMapping = mapping;
  return mapping;
}

function saveMapping(mapping: Record<string, string>): void {
  cachedMapping = mapping;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function getColor(categoryId: string): string {
  const mapping = loadMapping();
  if (categoryId in mapping) {
    return mapping[categoryId];
  }
  const colorIndex = Object.keys(mapping).length % CHART_COLORS.length;
  const color = CHART_COLORS[colorIndex];
  const updated = { ...mapping, [categoryId]: color };
  saveMapping(updated);
  return color;
}

export function getColorMap(ids: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const id of ids) {
    result.set(id, getColor(id));
  }
  return result;
}

export function clearColors(): void {
  cachedMapping = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
