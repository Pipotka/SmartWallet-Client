import { TimeUnit } from '@/api/schemas/common';
import type { TabId, DateRange } from './types';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'categorized', label: 'Расходы по категориям' },
  { id: 'comparative', label: 'Сравнение периодов' },
  { id: 'trend', label: 'Тренды расходов' },
];

export const CHART_COLORS = [
  '#3B82F6',  // blue-500
  '#F59E0B',  // amber-500
  '#10B981',  // emerald-500
  '#EF4444',  // red-500
  '#8B5CF6',  // violet-500
  '#06B6D4',  // cyan-500
  '#F97316',  // orange-500
  '#EC4899',  // pink-500
  '#84CC16',  // lime-500
  '#6366F1',  // indigo-500
  '#14B8A6',  // teal-500
  '#EAB308',  // yellow-500
  '#0EA5E9',  // sky-500
  '#F43F5E',  // rose-500
  '#A855F7',  // purple-500
  '#D946EF',  // fuchsia-500
  '#22C55E',  // green-500
  '#E11D48',  // rose-600
  '#2563EB',  // blue-600
  '#059669',  // emerald-600
];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfQuarter(date: Date): Date {
  const d = new Date(date);
  const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
  d.setMonth(quarterStartMonth, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getThisWeekRange(): DateRange {
  const now = new Date();
  const start = startOfWeek(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisMonthRange(): DateRange {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisQuarterRange(): DateRange {
  const now = new Date();
  const start = startOfQuarter(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisYearRange(): DateRange {
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export const PERIOD_PRESETS: { label: string; getRange: () => DateRange }[] = [
  { label: 'Эта неделя', getRange: getThisWeekRange },
  { label: 'Этот месяц', getRange: getThisMonthRange },
  { label: 'Этот квартал', getRange: getThisQuarterRange },
  { label: 'Этот год', getRange: getThisYearRange },
];

export const TIME_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: String(TimeUnit.Day), label: 'День' },
  { value: String(TimeUnit.Month), label: 'Месяц' },
  { value: String(TimeUnit.Year), label: 'Год' },
];
