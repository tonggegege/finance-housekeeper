/** 财务管家的核心数据模型 */

export interface ExpenseItem {
  id: string;
  /** 分类，例如 打车 / 外卖 */
  category: string;
  /** 金额（元） */
  amount: number;
  /** 备注，可空 */
  note?: string;
  /** ISO 日期字符串，例如 2026-09-06 */
  date: string;
}

export interface LedgerState {
  /** 本月预算（到手后可支配总额） */
  budget: number;
  /** 必须先存的钱（工资一到就划走，不算可花的） */
  mustSave: number;
  items: ExpenseItem[];
  updatedAt: string;
}

/** 默认清单分类 */
export const DEFAULT_CATEGORIES = [
  '打车',
  '交通',
  '外卖',
  '聚餐',
  '奶茶',
  '服饰',
  '杂物',
] as const;

/** 淡粉 / 淡紫 / 淡蓝 配色池 */
export const CATEGORY_COLORS = [
  '#F49AC1', // 粉
  '#90CAF9', // 蓝
  '#B39DDB', // 紫
  '#F8BBD0', // 浅粉
  '#B2EBF2', // 浅蓝
  '#C5CAE9', // 蓝紫
  '#E1BEE7', // 浅紫
  '#FFCDD2', // 藕粉
  '#D1C4E9', // 淡紫
  '#BBDEFB', // 天蓝
];

export const EMPTY_LEDGER: LedgerState = {
  budget: 6000,
  mustSave: 1500,
  items: [],
  updatedAt: '',
};
