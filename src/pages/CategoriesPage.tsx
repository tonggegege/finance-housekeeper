import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useFinance } from '../finance/FinanceData';
import { Button, Card, EmptyState, Field, Modal, Spinner, TextInput } from '../components/ui';
import { CATEGORY_PALETTE } from '../lib/format';
import type { Category, TxType } from '../types/finance';

function CategoryEditor({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing?: Category | null }) {
  const { addCategory, updateCategory } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);

  // 同步
  if (open && name === '' && editing) {
    setName(editing.name); setType(editing.type); setColor(editing.color);
  }
  if (open && !editing && name !== '' && false) { /* noop */ }

  function reset() { setName(''); setType('expense'); setColor(CATEGORY_PALETTE[0]); }

  async function save() {
    if (!name.trim()) return;
    if (editing) {
      await updateCategory(editing.id, { name: name.trim(), type, color });
    } else {
      await addCategory({ name: name.trim(), type, color, icon: 'tag' });
    }
    reset();
    onClose();
  }

  return (
    <Modal open={open} title={editing ? '编辑分类' : '新建分类'} onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button onClick={save}>保存</Button>
      </>}>
      <div className="flex p-1 rounded-xl mb-4" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
        <button onClick={() => setType('expense')} className="flex-1 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: type === 'expense' ? '#fff' : 'transparent', color: type === 'expense' ? 'var(--fm-danger)' : 'var(--fm-muted)' }}>支出</button>
        <button onClick={() => setType('income')} className="flex-1 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: type === 'income' ? '#fff' : 'transparent', color: type === 'income' ? 'var(--fm-success)' : 'var(--fm-muted)' }}>收入</button>
      </div>
      <Field label="分类名称">
        <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="如：餐饮、交通" autoFocus />
      </Field>
      <div className="mb-3">
        <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fm-muted)' }}>颜色</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_PALETTE.map(c => (
            <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full transition-transform"
              style={{ backgroundColor: c, outline: color === c ? '2px solid var(--fm-ink-strong)' : 'none', outlineOffset: 2 }} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function CategoriesPage() {
  const { categories, loading, removeCategory } = useFinance();
  const [tab, setTab] = useState<TxType>('expense');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [delTarget, setDelTarget] = useState<Category | null>(null);

  const list = categories.filter(c => c.type === tab);

  function openNew() { setEditing(null); setEditorOpen(true); }
  function openEdit(c: Category) { setEditing(c); setEditorOpen(true); }

  if (loading && categories.length === 0) return <div className="fm-page"><Spinner /></div>;

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>分类管理</h2>
        <Button onClick={openNew} className="!py-2 flex items-center gap-1"><Plus size={16} /> 新建</Button>
      </div>

      <div className="flex p-1 rounded-xl mb-4 w-fit" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
        <button onClick={() => setTab('expense')} className="px-5 py-1.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: tab === 'expense' ? '#fff' : 'transparent', color: tab === 'expense' ? 'var(--fm-danger)' : 'var(--fm-muted)' }}>支出分类</button>
        <button onClick={() => setTab('income')} className="px-5 py-1.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: tab === 'income' ? '#fff' : 'transparent', color: tab === 'income' ? 'var(--fm-success)' : 'var(--fm-muted)' }}>收入分类</button>
      </div>

      {list.length === 0 ? (
        <EmptyState text="还没有分类，点右上角新建一个" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map(c => (
            <Card key={c.id} className="!p-3.5 group">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.color + '33' }}>
                  <Tag size={16} style={{ color: c.color }} />
                </div>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--fm-ink-strong)' }}>{c.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-muted)' }}><Pencil size={14} /></button>
                  <button onClick={() => setDelTarget(c)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CategoryEditor open={editorOpen} editing={editing} onClose={() => { setEditorOpen(false); setEditing(null); }} />

      <Modal open={!!delTarget} title="删除分类" onClose={() => setDelTarget(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setDelTarget(null)}>取消</Button>
          <Button variant="danger" onClick={async () => { if (delTarget) { await removeCategory(delTarget.id); setDelTarget(null); } }}>删除</Button>
        </>}>
        <p className="text-sm" style={{ color: 'var(--fm-ink-strong)' }}>
          删除「{delTarget?.name}」后，相关记录会保留但标记为「未分类」。确定删除吗？
        </p>
      </Modal>
    </div>
  );
}
