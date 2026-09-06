// 通用格式化与工具函数

export function formatMoney(n: number, withSign = false): string {
  const fixed = Math.round(n * 100) / 100;
  const str = fixed.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (withSign && fixed > 0) return `+${str}`;
  if (withSign && fixed < 0) return `-${str.replace('-', '')}`;
  return str;
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function monthLabel(month: string): string {
  const [, m] = month.split('-');
  return `${Number(m)}月`;
}

export function prettyDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const today = new Date();
  const isSameYear = d.getFullYear() === today.getFullYear();
  return isSameYear
    ? `${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function monthOptions(): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ label: `${d.getFullYear()}年${d.getMonth() + 1}月`, value: v });
  }
  return out;
}

export function yearOptions(): { label: string; value: number }[] {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2].map(v => ({ label: `${v}年`, value: v }));
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 简单分类颜色池
export const CATEGORY_PALETTE = [
  '#F49AC1', '#90CAF9', '#B39DDB', '#80CBC4', '#F8BBD0',
  '#FFB74D', '#A5D6A7', '#9575CD', '#4DB6AC', '#CFD8DC',
  '#F06292', '#7986CB',
];

export const CATEGORY_ICONS = [
  'utensils', 'car', 'shopping-bag', 'home', 'gamepad-2', 'heart-pulse',
  'gift', 'more-horizontal', 'wallet', 'briefcase', 'trending-up',
  'plus-circle', 'coffee', 'book', 'plane', 'smartphone',
];
