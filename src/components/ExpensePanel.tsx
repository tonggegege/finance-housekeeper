import { useMemo, useState } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { CATEGORY_COLORS, DEFAULT_CATEGORIES, ExpenseItem } from '../finance/types';
import { LedgerSummary } from '../finance/calc';
import { formatMoney } from '../finance/parse';
import { EditableNumber } from './EditableNumber';

interface ExpensePanelProps {
  summary: LedgerSummary;
  items: ExpenseItem[];
  budget: number;
  mustSave: number;
  onAddItem: (category: string, amount: number) => void;
  onUpdateItem: (id: string, patch: Partial<Pick<ExpenseItem, 'amount' | 'category' | 'note'>>) => void;
  onRemoveItem: (id: string) => void;
  onBudgetChange: (value: number) => void;
  onMustSaveChange: (value: number) => void;
  onClearMonth: () => void;
}

export function ExpensePanel({
  summary,
  items,
  budget,
  mustSave,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onBudgetChange,
  onMustSaveChange,
  onClearMonth,
}: ExpensePanelProps) {
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // 当前清单分类：默认分类 + 用户自定义过的
  const categories = useMemo(() => {
    const set: string[] = [...DEFAULT_CATEGORIES];
    items.forEach(it => {
      if (it.category && !set.includes(it.category)) set.push(it.category);
    });
    return set;
  }, [items]);

  const colorOf = (category: string) => {
    const idx = categories.indexOf(category);
    return CATEGORY_COLORS[(idx < 0 ? category.length : idx) % CATEGORY_COLORS.length];
  };

  // 本月条目按分类分组
  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseItem[]>();
    [...summary.monthItems]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .forEach(it => {
        const arr = map.get(it.category) || [];
        arr.push(it);
        map.set(it.category, arr);
      });
    return [...map.entries()].sort((a, b) => {
      const sa = a[1].reduce((s, i) => s + i.amount, 0);
      const sb = b[1].reduce((s, i) => s + i.amount, 0);
      return sb - sa;
    });
  }, [summary.monthItems]);

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return setAddingCategory(false);
    onAddItem(name, 0);
    setNewCategory('');
    setAddingCategory(false);
  };

  return (
    <div className="fm-card flex flex-col h-full overflow-hidden">
      {/* 标题 + 预算 */}
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--fm-line)' }}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>
            花钱清单
          </h2>
          <span className="fm-label">{summary.monthLabel} · {summary.count} 笔</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="fm-card-soft px-3 py-2">
            <div className="fm-label">本月预算</div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: 'var(--fm-muted)' }}>到手</span>
              <EditableNumber value={budget} onCommit={onBudgetChange} width={90} title="点一下改本月预算" />
            </div>
          </div>
          <div className="fm-card-soft px-3 py-2">
            <div className="fm-label">必须先存</div>
            <div className="flex items-center justify-between">
              <span className="text-[13px]" style={{ color: 'var(--fm-muted)' }}>别动</span>
              <EditableNumber value={mustSave} onCommit={onMustSaveChange} width={90} title="点一下改必须先存的钱" />
            </div>
          </div>
        </div>

        {/* 快捷记一笔 */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {categories.map(cat => (
            <button key={cat} type="button" className="fm-chip flex items-center gap-1.5" onClick={() => onAddItem(cat, 0)}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: colorOf(cat) }} />
              {cat}
              <Plus size={11} />
            </button>
          ))}
          {addingCategory ? (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                className="fm-amount-input"
                style={{ width: 88, padding: '4px 8px', textAlign: 'left' }}
                placeholder="新分类名"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onBlur={handleAddCategory}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setAddingCategory(false);
                }}
              />
              <button type="button" className="fm-chip" onMouseDown={handleAddCategory}>
                <Check size={12} />
              </button>
              <button type="button" className="fm-chip" onMouseDown={() => setAddingCategory(false)}>
                <X size={12} />
              </button>
            </span>
          ) : (
            <button type="button" className="fm-chip" onClick={() => setAddingCategory(true)}>
              ＋ 加分类
            </button>
          )}
        </div>
      </div>

      {/* 明细列表 */}
      <div className="flex-1 overflow-y-auto px-5 py-3" style={{ minHeight: 0 }}>
        {grouped.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center" style={{ color: 'var(--fm-muted)' }}>
            <div className="text-[13px]">本月还是清白的</div>
            <div className="text-[12px] mt-1">在下面输入框报一笔，比如「打车20」</div>
          </div>
        ) : (
          grouped.map(([category, list]) => {
            const subtotal = list.reduce((s, i) => s + i.amount, 0);
            const stat = summary.categories.find(c => c.category === category);
            return (
              <div key={category} className="mb-4 fm-fade-up">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf(category) }} />
                    <span className="text-[13px] font-medium" style={{ color: 'var(--fm-ink-strong)' }}>
                      {category}
                    </span>
                    <span className="fm-label">{list.length} 笔</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="fm-label">{((stat?.ratio || 0) * 100).toFixed(0)}%</span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--fm-ink-strong)' }}>
                      {formatMoney(subtotal)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {list.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.7)' }}
                    >
                      <span className="text-[12px]" style={{ color: 'var(--fm-muted)' }}>
                        {item.date.slice(5).replace('-', '/')}
                        {item.note ? ` · ${item.note}` : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <EditableNumber value={item.amount} onCommit={v => onUpdateItem(item.id, { amount: v })} width={72} />
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md"
                          style={{ color: 'var(--fm-muted)' }}
                          onClick={() => onRemoveItem(item.id)}
                          title="删掉这笔"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部合计 */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--fm-line)' }}>
        <div>
          <div className="fm-label">本月已花</div>
          <div className="text-[17px] font-semibold tabular-nums" style={{ color: 'var(--fm-ink-strong)' }}>
            {formatMoney(summary.spent)}
          </div>
        </div>
        <button type="button" className="fm-chip" onClick={onClearMonth} title="清空本月所有记录">
          清空本月
        </button>
      </div>
    </div>
  );
}
