import { CATEGORY_COLORS, ExpenseItem } from './types';
import { formatMoney } from './parse';

export interface CategoryStat {
  category: string;
  amount: number;
  count: number;
  /** 占总支出比例 0~1 */
  ratio: number;
  color: string;
}

export interface LedgerSummary {
  /** 本月标识，例如 2026-09 */
  month: string;
  monthLabel: string;
  budget: number;
  mustSave: number;
  /** 可花额度 = 预算 - 必存 */
  spendable: number;
  spent: number;
  /** 还能花 = 可花额度 - 已花 */
  remaining: number;
  /** 含今天在内的剩余天数 */
  daysLeft: number;
  /** 平摊到每天还能花多少 */
  daily: number;
  /** 已花占可花额度比例 0~1（可能 >1） */
  usedRatio: number;
  overspent: boolean;
  count: number;
  categories: CategoryStat[];
  monthItems: ExpenseItem[];
}

export function currentMonthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function daysLeftInMonth(d = new Date()): number {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.max(1, last - d.getDate() + 1);
}

export function summarize(state: { budget: number; mustSave: number; items: ExpenseItem[] }, now = new Date()): LedgerSummary {
  const month = currentMonthKey(now);
  const monthItems = state.items.filter(it => (it.date || '').slice(0, 7) === month);

  const spent = monthItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const spendable = Math.max(0, state.budget - state.mustSave);
  const remaining = spendable - spent;
  const daysLeft = daysLeftInMonth(now);

  const byCat = new Map<string, { amount: number; count: number }>();
  for (const it of monthItems) {
    const cur = byCat.get(it.category) || { amount: 0, count: 0 };
    cur.amount += Number(it.amount) || 0;
    cur.count += 1;
    byCat.set(it.category, cur);
  }

  const categories: CategoryStat[] = [...byCat.entries()]
    .map(([category, v], index) => ({
      category,
      amount: v.amount,
      count: v.count,
      ratio: spent > 0 ? v.amount / spent : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    month,
    monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    budget: state.budget,
    mustSave: state.mustSave,
    spendable,
    spent,
    remaining,
    daysLeft,
    daily: remaining / daysLeft,
    usedRatio: spendable > 0 ? spent / spendable : 0,
    overspent: remaining < 0,
    count: monthItems.length,
    categories,
    monthItems,
  };
}

/** 生成给 Agent 看的账本快照，数字以这里为准 */
export function buildLedgerContext(summary: LedgerSummary): string {
  const lines: string[] = [];
  lines.push(`【账本实时状态 · ${summary.monthLabel}】`);
  lines.push(`- 本月预算 ${formatMoney(summary.budget)}，必须先存 ${formatMoney(summary.mustSave)}，可花额度 ${formatMoney(summary.spendable)}`);
  lines.push(`- 已花 ${formatMoney(summary.spent)}（${summary.count} 笔），还能花 ${formatMoney(summary.remaining)}`);
  lines.push(`- 本月还剩 ${summary.daysLeft} 天（含今天），平摊每天 ${formatMoney(summary.daily)}`);
  lines.push(
    `- 预算进度 ${(summary.usedRatio * 100).toFixed(1)}%${summary.overspent ? '（已超支）' : ''}`,
  );

  if (summary.categories.length > 0) {
    const parts = summary.categories.map(
      c => `${c.category} ${formatMoney(c.amount)}（${(c.ratio * 100).toFixed(0)}%，${c.count}笔）`,
    );
    lines.push(`- 钱去哪了：${parts.join('；')}`);
  } else {
    lines.push('- 钱去哪了：本月还没有记账');
  }

  const recent = summary.monthItems.slice(-25).map(it => {
    const day = it.date.slice(5).replace('-', '/');
    return `${day} ${it.category}${formatMoney(it.amount)}${it.note ? `（${it.note}）` : ''}`;
  });
  if (recent.length > 0) {
    lines.push(`- 明细：${recent.join('；')}`);
  }

  return lines.join('\n');
}
