import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';
import { monthStr } from '../lib/format';
import type {
  Account, Category, Transaction, Budget, Summary,
} from '../types/finance';

interface FinanceContextValue {
  loading: boolean;
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  summary: Summary | null;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  refresh: () => Promise<void>;
  // 交易
  addTransaction: (t: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  addTransfer: (t: { amount: number; fromAccountId: string; toAccountId: string; date: string; note?: string }) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  // 分类
  addCategory: (c: Omit<Category, 'id' | 'userId' | 'order' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  // 账户
  addAccount: (a: Omit<Account, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, a: Partial<Account>) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  // 预算
  addBudget: (b: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthStr());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, accs, txs, bds, sum] = await Promise.all([
        api.get<{ categories: Category[] }>('/categories'),
        api.get<{ accounts: Account[] }>('/accounts'),
        api.get<{ transactions: Transaction[] }>('/transactions'),
        api.get<{ budgets: Budget[] }>(`/budgets?year=${selectedMonth.slice(0, 4)}`),
        api.get<{ summary: Summary }>(`/stats/summary?month=${selectedMonth}`),
      ]);
      setCategories(cats.categories);
      setAccounts(accs.accounts);
      setTransactions(txs.transactions);
      setBudgets(bds.budgets);
      setSummary(sum.summary);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    await api.post('/transactions', t);
    await refresh();
  }, [refresh]);

  const addTransfer = useCallback(async (t: { amount: number; fromAccountId: string; toAccountId: string; date: string; note?: string }) => {
    await api.post('/transactions/transfer', t);
    await refresh();
  }, [refresh]);

  const updateTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    await api.put(`/transactions/${id}`, t);
    await refresh();
  }, [refresh]);

  const removeTransaction = useCallback(async (id: string) => {
    await api.del(`/transactions/${id}`);
    await refresh();
  }, [refresh]);

  const addCategory = useCallback(async (c: Omit<Category, 'id' | 'userId' | 'order' | 'createdAt'>) => {
    await api.post('/categories', c);
    await refresh();
  }, [refresh]);

  const updateCategory = useCallback(async (id: string, c: Partial<Category>) => {
    await api.put(`/categories/${id}`, c);
    await refresh();
  }, [refresh]);

  const removeCategory = useCallback(async (id: string) => {
    await api.del(`/categories/${id}`);
    await refresh();
  }, [refresh]);

  const addAccount = useCallback(async (a: Omit<Account, 'id' | 'userId' | 'createdAt'>) => {
    await api.post('/accounts', a);
    await refresh();
  }, [refresh]);

  const updateAccount = useCallback(async (id: string, a: Partial<Account>) => {
    await api.put(`/accounts/${id}`, a);
    await refresh();
  }, [refresh]);

  const removeAccount = useCallback(async (id: string) => {
    await api.del(`/accounts/${id}`);
    await refresh();
  }, [refresh]);

  const addBudget = useCallback(async (b: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => {
    await api.post('/budgets', b);
    await refresh();
  }, [refresh]);

  const removeBudget = useCallback(async (id: string) => {
    await api.del(`/budgets/${id}`);
    await refresh();
  }, [refresh]);

  return (
    <FinanceContext.Provider value={{
      loading, categories, accounts, transactions, budgets, summary,
      selectedMonth, setSelectedMonth, refresh,
      addTransaction, addTransfer, updateTransaction, removeTransaction,
      addCategory, updateCategory, removeCategory,
      addAccount, updateAccount, removeAccount,
      addBudget, removeBudget,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance 必须在 FinanceProvider 内使用');
  return ctx;
}

export function categoryName(categories: Category[], id: string): string {
  if (id === '__uncategorized__') return '未分类';
  return categories.find(c => c.id === id)?.name || '已删除分类';
}

export function categoryColor(categories: Category[], id: string): string {
  if (id === '__uncategorized__') return '#CFD8DC';
  return categories.find(c => c.id === id)?.color || '#CFD8DC';
}
