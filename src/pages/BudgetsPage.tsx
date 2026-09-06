import { useState, useEffect } from 'react';
import { Target, Pencil, Trash2, Plus } from 'lucide-react';
import { useFinance, categoryName, categoryColor } from '../finance/FinanceData';
import { Button, Card, SectionTitle, Field, Modal, Spinner, NumberInput, SelectInput } from '../components/ui';
import { formatMoney, monthLabel } from '../lib/format';
import type { Budget } from '../types/finance';

function BudgetModal({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing?: Budget | null }) {
  const { categories, selectedMonth, addBudget } = useFinance();
  const [scope, setScope] = useState<'all' | 'category'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');

  const expenseCats = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setScope(editing.categoryId === 'all' ? 'all' : 'category');
      setCategoryId(editing.categoryId === 'all' ? '' : editing.categoryId);
      setAmount(String(editing.amount));
    } else {
      setScope('all');
      setCategoryId('');
      setAmount('');
    }
  }, [open, editing]);

  async function save() {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    if (scope === 'category' && !categoryId) return;
    const [y, m] = selectedMonth.split('-').map(Number);
    await addBudget({
      categoryId: scope === 'all' ? 'all' : categoryId,
      amount: amt,
      period: 'monthly',
      year: y,
      month: m,
    });
    onClose();
  }

  return (
    <Modal open={open} title={editing ? '调整预算' : '设置预算'} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button onClick={save}>保存</Button>
      </>}>
      <Field label="预算范围">
        <div className="flex p-1 rounded-xl" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
          <button onClick={() => setScope('all')} className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: scope === 'all' ? '#fff' : 'transparent', color: scope === 'all' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>总预算</button>
          <button onClick={() => setScope('category')} className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: scope === 'category' ? '#fff' : 'transparent', color: scope === 'category' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>分类预算</button>
        </div>
      </Field>
      {scope === 'category' && (
        <Field label="选择分类">
          <SelectInput value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="" disabled>请选择分类</option>
            {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectInput>
        </Field>
      )}
      <Field label="月度预算金额（元）">
        <NumberInput value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
      </Field>
    </Modal>
  );
}

export function BudgetsPage() {
  const { budgets, categories, summary, loading, removeBudget, selectedMonth } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  if (loading && !summary) return <div className="fm-page"><Spinner /></div>;

  const [y, m] = selectedMonth.split('-').map(Number);
  const monthBudgets = budgets.filter(b => b.period === 'monthly' && b.year === y && b.month === m);
  const totalBudget = monthBudgets.find(b => b.categoryId === 'all');
  const catBudgets = monthBudgets.filter(b => b.categoryId !== 'all');

  const expense = summary?.expense ?? 0;
  const usedPct = totalBudget && totalBudget.amount > 0 ? Math.min(100, Math.round((expense / totalBudget.amount) * 100)) : 0;

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>{monthLabel(selectedMonth)}预算</h2>
          <p className="text-xs" style={{ color: 'var(--fm-muted)' }}>给自己一个花钱的边界</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="!py-2 flex items-center gap-1"><Plus size={16} /> 设预算</Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
            <Target size={16} style={{ color: 'var(--fm-purple)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>本月总预算</span>
        </div>
        {totalBudget ? (
          <>
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--fm-ink-strong)' }}>¥{formatMoney(totalBudget.amount)}</div>
              <div className="text-sm" style={{ color: 'var(--fm-muted)' }}>已花 ¥{formatMoney(expense)}</div>
            </div>
            <div className="fm-bar-track h-3">
              <div className="fm-bar-fill h-3" style={{ width: `${usedPct}%`, background: usedPct > 100 ? 'var(--fm-danger)' : 'linear-gradient(90deg,#f4a7c4,#b79ce0)' }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--fm-muted)' }}>已用 {usedPct}%</span>
              <button className="text-xs" style={{ color: 'var(--fm-purple)' }} onClick={() => { setEditing(totalBudget); setModalOpen(true); }}>调整</button>
            </div>
          </>
        ) : (
          <div className="text-sm py-1" style={{ color: 'var(--fm-muted)' }}>还没设总预算，点右上角设置</div>
        )}
      </Card>

      <SectionTitle right={<span className="text-xs" style={{ color: 'var(--fm-muted)' }}>{catBudgets.length} 项</span>}>分类预算</SectionTitle>
      {catBudgets.length === 0 ? (
        <div className="text-sm py-3 text-center" style={{ color: 'var(--fm-muted)' }}>暂无分类预算</div>
      ) : (
        <div className="space-y-2">
          {catBudgets.map(b => {
            const name = categoryName(categories, b.categoryId);
            const color = categoryColor(categories, b.categoryId);
            const spent = (summary?.byCategory.find(c => c.categoryId === b.categoryId)?.amount) || 0;
            const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
            return (
              <Card key={b.id} className="!p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--fm-ink-strong)' }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--fm-muted)' }}>¥{formatMoney(spent)} / {formatMoney(b.amount)}</span>
                    <button onClick={() => { setEditing(b); setModalOpen(true); }} className="p-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-muted)' }}><Pencil size={14} /></button>
                    <button onClick={() => removeBudget(b.id)} className="p-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-danger)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="fm-bar-track h-2">
                  <div className="fm-bar-fill h-2" style={{ width: `${pct}%`, background: pct > 100 ? 'var(--fm-danger)' : color }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal open={modalOpen} editing={editing} onClose={() => { setModalOpen(false); setEditing(null); }} />
    </div>
  );
}
