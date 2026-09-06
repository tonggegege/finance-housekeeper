import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { useFinance, categoryName, categoryColor } from '../finance/FinanceData';
import { Button, Card, EmptyState, Modal, Spinner, TextInput } from '../components/ui';
import { TransactionForm } from '../components/TransactionForm';
import { formatMoney, prettyDate, monthLabel } from '../lib/format';
import type { Transaction, TxType } from '../types/finance';

export function TransactionsPage() {
  const { transactions, categories, accounts, loading, removeTransaction } = useFinance();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TxType>('all');
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter(t => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter(t => {
        if (!q) return true;
        const name = categoryName(categories, t.categoryId).toLowerCase();
        return name.includes(q) || (t.note || '').toLowerCase().includes(q);
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, typeFilter, query, categories]);

  // 按日期分组
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach(t => {
      const arr = map.get(t.date) || [];
      arr.push(t);
      map.set(t.date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const totals = useMemo(() => {
    let inc = 0, exp = 0;
    filtered.forEach(t => t.type === 'income' ? (inc += t.amount) : (exp += t.amount));
    return { inc, exp };
  }, [filtered]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeTransaction(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading && transactions.length === 0) return <div className="fm-page"><Spinner /></div>;

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>流水记录</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="!py-2 flex items-center gap-1">
          <Plus size={16} /> 记一笔
        </Button>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="!p-3.5">
          <div className="text-xs" style={{ color: 'var(--fm-muted)' }}>收入合计</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#3f9b7c' }}>¥{formatMoney(totals.inc)}</div>
        </Card>
        <Card className="!p-3.5">
          <div className="text-xs" style={{ color: 'var(--fm-muted)' }}>支出合计</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--fm-danger)' }}>¥{formatMoney(totals.exp)}</div>
        </Card>
      </div>

      {/* 筛选行 */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fm-muted)' }} />
          <TextInput value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索分类或备注" className="!pl-9" />
        </div>
        <div className="flex p-1 rounded-xl" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
          {(['all', 'expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: typeFilter === t ? '#fff' : 'transparent', color: typeFilter === t ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>
              {t === 'all' ? '全部' : t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      {grouped.length === 0 ? (
        <EmptyState text="没有符合条件的记录" />
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="mb-4">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--fm-muted)' }}>{prettyDate(date)}</span>
            </div>
            <Card className="!p-1.5">
              {items.map(t => {
                const name = categoryName(categories, t.categoryId);
                const color = categoryColor(categories, t.categoryId);
                const income = t.type === 'income';
                const transfer = t.type === 'transfer';
                const acc = accounts.find(a => a.id === t.accountId);
                const toAcc = accounts.find(a => a.id === t.toAccountId);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-black/[0.03]">
                    <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: transfer ? 'var(--fm-purple-soft)' : color + '33' }}>
                      {transfer ? <ArrowRightLeft size={16} style={{ color: 'var(--fm-purple)' }} /> : income ? <ArrowUpRight size={16} style={{ color: '#3f9b7c' }} /> : <ArrowDownRight size={16} style={{ color: 'var(--fm-danger)' }} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--fm-ink-strong)' }}>
                        {transfer ? '转账' : name}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--fm-muted)' }}>
                        {transfer ? `${acc ? acc.name : '未知'} → ${toAcc ? toAcc.name : '未知'}` : (acc ? acc.name : '无账户')}{t.note ? ' · ' + t.note : ''}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums" style={{ color: income ? '#3f9b7c' : transfer ? 'var(--fm-purple)' : 'var(--fm-ink-strong)' }}>
                      {transfer ? '' : (income ? '+' : '-')}¥{formatMoney(t.amount)}
                    </div>
                    <div className="flex items-center gap-0.5 ml-1">
                      <button onClick={() => { setEditing(t); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-muted)' }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      <button onClick={() => { setEditing(null); setFormOpen(true); }}
        className="md:hidden fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)' }}>
        <Plus size={26} />
      </button>

      <TransactionForm open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />

      <Modal open={!!deleteTarget} title="删除记录" onClose={() => setDeleteTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? '删除中…' : '确认删除'}</Button>
        </>}>
        <p className="text-sm" style={{ color: 'var(--fm-ink-strong)' }}>
          确定要删除这笔「{deleteTarget ? categoryName(categories, deleteTarget.categoryId) : ''} ¥{deleteTarget ? formatMoney(deleteTarget.amount) : ''}」记录吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  );
}
