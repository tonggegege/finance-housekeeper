// 财务管理系统前端类型

export type TxType = 'expense' | 'income' | 'transfer';
export type AccountType = 'cash' | 'card' | 'alipay' | 'wechat' | 'other';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TxType;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string;
  icon: string;
  color: string;
  createdAt: string;
  balance?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  categoryId: string;
  accountId: string | null;
  toAccountId?: string | null;
  note: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string; // 'all' 或分类 id
  amount: number;
  period: 'monthly' | 'yearly';
  year: number;
  month?: number;
  createdAt: string;
}

export interface Summary {
  month: string;
  income: number;
  expense: number;
  net: number;
  totalAssets: number;
  budgetTotal: number;
  budgetRemaining: number;
  byCategory: { categoryId: string; name: string; color: string; amount: number; percent: number }[];
  accounts: { id: string; name: string; type: AccountType; balance: number; color: string }[];
  daysInMonth: number;
  daysLeft: number;
  dailyAvg: number;
  dailyBudget: number;
}

export interface MonthlyStat {
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface YearlyStat {
  year: number;
  totalIncome: number;
  totalExpense: number;
  byCategory: { categoryId: string; name: string; color: string; amount: number }[];
  months: MonthlyStat[];
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: '现金',
  card: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  other: '其他',
};
