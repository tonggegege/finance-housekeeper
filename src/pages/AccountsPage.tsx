import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet, Banknote, CreditCard, Smartphone, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useFinance } from '../finance/FinanceData';
import { Button, Card, EmptyState, Field, Modal, Spinner, TextInput, NumberInput } from '../components/ui';
import { formatMoney, CATEGORY_PALETTE } from '../lib/format';
import { ACCOUNT_TYPE_LABEL, type Account, type AccountType } from '../types/finance';

const TYPE_ICON: Record<AccountType, React.ReactNode> = {
  cash: <Banknote size={16} />,
  card: <CreditCard size={16} />,
  alipay: <Smartphone size={16} />,
  wechat: <MessageCircle size={16} />,
  other: <MoreHorizontal size={16} />,
};

function AccountEditor({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: Account | null }) {
  const { addAccount, updateAccount } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(CATEGORY_PALETTE[1]);

  if (open && editing && name === '') { setName(editing.name); setType(editing.type); setInitialBalance(String(editing.initialBalance)); setColor(editing.color); }
  if (open && !editing && name !== '' && false) { /* noop */ }

  function reset() { setName(''); setType('cash'); setInitialBalance(''); setColor(CATEGORY_PALETTE[1]); }

  async function save() {
    if (!name.trim()) return;
    const payload = { name: name.trim(), type, initialBalance: Number(initialBalance) || 0, color, icon: type, currency: 'CNY' };
    if (editing) await updateAccount(editing.id, payload);
    else await addAccount(payload);
    reset();
    onClose();
  }

  return (
    <Modal open={open} title={editing ? '编辑账户' : '新建账户'} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button onClick={save}>保存</Button>
      </>}>
      <Field label="账户名称">
        <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="如：招商银行卡" autoFocus />
      </Field>
      <Field label="账户类型">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map(t => (
            <button key={t} onClick={() => setType(t)} className="py-2 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: type === t ? 'var(--fm-purple)' : 'var(--fm-line)', backgroundColor: type === t ? 'var(--fm-purple-soft)' : '#fff', color: type === t ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>
              {ACCOUNT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="初始余额（可选）">
        <NumberInput value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" />
      </Field>
      <div className="mb-1">
        <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fm-muted)' }}>颜色</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PALETTE.map(c => (
            <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full"
              style={{ backgroundColor: c, outline: color === c ? '2px solid var(--fm-ink-strong)' : 'none', outlineOffset: 2 }} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function AccountsPage() {
  const { accounts, loading, removeAccount, summary } = useFinance();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [delTarget, setDelTarget] = useState<Account | null>(null);

  if (loading && accounts.length === 0) return <div className="fm-page"><Spinner /></div>;

  const totalAssets = summary?.totalAssets ?? 0;

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>账户管理</h2>
          <p className="text-xs" style={{ color: 'var(--fm-muted)' }}>总资产 ¥{formatMoney(totalAssets)}</p>
        </div>
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} className="!py-2 flex items-center gap-1"><Plus size={16} /> 新建</Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState text="还没有账户，点右上角添加" icon={<Wallet size={32} />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map(a => (
            <Card key={a.id} className="!p-4 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: a.color }}>
                    {TYPE_ICON[a.type]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>{a.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--fm-muted)' }}>{ACCOUNT_TYPE_LABEL[a.type]}</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(a); setEditorOpen(true); }} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-muted)' }}><Pencil size={14} /></button>
                  <button onClick={() => setDelTarget(a)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold tabular-nums" style={{ color: a.balance !== undefined && a.balance < 0 ? 'var(--fm-danger)' : 'var(--fm-ink-strong)' }}>
                ¥{formatMoney(a.balance ?? a.initialBalance)}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--fm-muted)' }}>初始 ¥{formatMoney(a.initialBalance)}</div>
            </Card>
          ))}
        </div>
      )}

      <AccountEditor open={editorOpen} editing={editing} onClose={() => { setEditorOpen(false); setEditing(null); }} />

      <Modal open={!!delTarget} title="删除账户" onClose={() => setDelTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setDelTarget(null)}>取消</Button>
          <Button variant="danger" onClick={async () => { if (delTarget) { await removeAccount(delTarget.id); setDelTarget(null); } }}>删除</Button>
        </>}>
        <p className="text-sm" style={{ color: 'var(--fm-ink-strong)' }}>
          删除「{delTarget?.name}」后，关联的交易会解除账户绑定（金额不丢失）。确定删除吗？
        </p>
      </Modal>
    </div>
  );
}
