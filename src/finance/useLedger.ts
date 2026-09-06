import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { EMPTY_LEDGER, ExpenseItem, LedgerState } from './types';
import { summarize } from './calc';

const LS_KEY = 'finance-housekeeper-ledger';

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadLocal(): LedgerState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        budget: Number(parsed.budget) || 0,
        mustSave: Number(parsed.mustSave) || 0,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        updatedAt: parsed.updatedAt || '',
      };
    }
  } catch {
    /* ignore */
  }
  return { ...EMPTY_LEDGER };
}

export function useLedger() {
  const [state, setState] = useState<LedgerState>(loadLocal);
  const [loaded, setLoaded] = useState(false);

  // 首次从后端拉取，失败则沿用本地
  useEffect(() => {
    let alive = true;
    fetch('/api/ledger')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive || !data?.ledger) return;
        const l = data.ledger as LedgerState;
        setState({
          budget: Number(l.budget) || 0,
          mustSave: Number(l.mustSave) || 0,
          items: Array.isArray(l.items) ? l.items : [],
          updatedAt: l.updatedAt || '',
        });
      })
      .catch(() => {
        /* 后端不可用，使用本地存储 */
      })
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  // 变更后持久化（后端优先，同时写本地兜底）
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    const timer = setTimeout(() => {
      fetch('/api/ledger', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
      }).catch(() => {
        /* 忽略后端失败 */
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [state, loaded]);

  const summary = useMemo(() => summarize(state), [state]);

  const addItems = useCallback((entries: { category: string; amount: number; note?: string }[]) => {
    if (entries.length === 0) return;
    setState(prev => ({
      ...prev,
      items: [
        ...prev.items,
        ...entries.map(e => ({
          id: uuidv4(),
          category: e.category,
          amount: Number(e.amount) || 0,
          note: e.note,
          date: todayISO(),
        })),
      ],
    }));
  }, []);

  const addItem = useCallback((category: string, amount: number) => {
    addItems([{ category, amount }]);
  }, [addItems]);

  const updateItem = useCallback((id: string, patch: Partial<Pick<ExpenseItem, 'amount' | 'category' | 'note'>>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(it => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) }));
  }, []);

  const setBudget = useCallback((budget: number) => {
    setState(prev => ({ ...prev, budget: Number(budget) || 0 }));
  }, []);

  const setMustSave = useCallback((mustSave: number) => {
    setState(prev => ({ ...prev, mustSave: Number(mustSave) || 0 }));
  }, []);

  const clearMonth = useCallback(() => {
    const month = todayISO().slice(0, 7);
    setState(prev => ({ ...prev, items: prev.items.filter(it => (it.date || '').slice(0, 7) !== month) }));
  }, []);

  return {
    state,
    summary,
    addItem,
    addItems,
    updateItem,
    removeItem,
    setBudget,
    setMustSave,
    clearMonth,
  };
}
