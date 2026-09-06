import { useState, useEffect } from 'react';
import { useFinance } from '../finance/FinanceData';
import { useToast } from './ui';
import { Button, Field, Modal, NumberInput, SelectInput, TextArea, DateInput } from './ui';
import { todayStr } from '../lib/format';
import type { Transaction, TxType } from '../types/finance';

export function TransactionForm({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
}) {
  const { categories, accounts, addTransaction, addTransfer, updateTransaction } = useFinance();
  const toast = useToast();

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(editing.categoryId);
      setAccountId(editing.accountId || '');
      setFromAccountId(editing.accountId || '');
      setToAccountId(editing.toAccountId || '');
      setDate(editing.date);
      setNote(editing.note || '');
    } else {
      setType('expense');
      setAmount('');
      setCategoryId('');
      setAccountId('');
      setFromAccountId('');
      setToAccountId('');
      setDate(todayStr());
      setNote('');
    }
  }, [open, editing]);

  const catOptions = categories.filter(c => c.type === type);
  useEffect(() => {
    if (catOptions.length && !catOptions.find(c => c.id === categoryId)) {
      setCategoryId(catOptions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  async function save() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast('请输入有效金额', 'error'); return; }
    try {
      if (type === 'transfer') {
        if (!fromAccountId || !toAccountId) { toast('请选择转出和转入账户', 'error'); return; }
        if (fromAccountId === toAccountId) { toast('转出和转入账户不能相同', 'error'); return; }
        await addTransfer({ amount: amt, fromAccountId, toAccountId, date, note: note.trim() });
        toast('转账成功', 'success');
      } else {
        if (!categoryId) { toast('请选择分类', 'error'); return; }
        await addTransaction({ type, amount: amt, categoryId, accountId: accountId || null, date, note: note.trim() });
        toast(type === 'expense' ? '支出已记录' : '收入已记录', 'success');
      }
      onClose();
    } catch (e: any) {
      toast(e?.message || '保存失败', 'error');
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? '编辑记录' : '记一笔'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={save}>{editing ? '保存' : '记下来'}</Button>
        </>
      }
    >
      {/* 收支转账切换 */}
      <div className="flex p-1 rounded-xl mb-4" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
        <button onClick={() => setType('expense')} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: type === 'expense' ? '#fff' : 'transparent', color: type === 'expense' ? 'var(--fm-danger)' : 'var(--fm-muted)' }}>支出</button>
        <button onClick={() => setType('income')} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: type === 'income' ? '#fff' : 'transparent', color: type === 'income' ? 'var(--fm-success)' : 'var(--fm-muted)' }}>收入</button>
        <button onClick={() => setType('transfer')} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: type === 'transfer' ? '#fff' : 'transparent', color: type === 'transfer' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>转账</button>
      </div>

      <Field label="金额（元）">
        <NumberInput value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
      </Field>

      {type !== 'transfer' && (
        <>
          <Field label="分类">
            <SelectInput value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="" disabled>请选择分类</option>
              {catOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="账户（可选）">
            <SelectInput value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">不关联账户</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </SelectInput>
          </Field>
        </>
      )}

      {type === 'transfer' && (
        <>
          <Field label="转出账户">
            <SelectInput value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
              <option value="" disabled>请选择</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="转入账户">
            <SelectInput value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
              <option value="" disabled>请选择</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </SelectInput>
          </Field>
        </>
      )}

      <Field label="日期">
        <DateInput value={date} onChange={e => setDate(e.target.value)} />
      </Field>

      <Field label="备注（可选）">
        <TextArea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder={type === 'transfer' ? '例如：工资到账' : '例如：和朋友聚餐'} />
      </Field>
    </Modal>
  );
}
