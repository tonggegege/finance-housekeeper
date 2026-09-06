import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ChevronRight, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { useFinance, categoryName, categoryColor } from '../finance/FinanceData';
import { Card, SectionTitle, Spinner, Button, EmptyState } from '../components/ui';
import { TransactionForm } from '../components/TransactionForm';
import { formatMoney, prettyDate, monthLabel } from '../lib/format';

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'ink' | 'green' | 'pink' | 'purple' }) {
  const color = { ink: 'var(--fm-ink-strong)', green: '#3f9b7c', pink: '#e05a72', purple: 'var(--fm-purple)' }[tone];
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: tone === 'purple' ? 'var(--fm-purple-soft)' : tone === 'green' ? '#e3f3ec' : tone === 'pink' ? '#fbe5ea' : 'var(--fm-card-soft)' }}>
          {icon}
        </div>
        <span className="text-xs" style={{ color: 'var(--fm-muted)' }}>{label}</span>
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>¥{value}</div>
    </Card>
  );
}

export function DashboardPage() {
  const { summary, transactions, categories, accounts, loading } = useFinance();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  if (loading && !summary) return <div className="fm-page"><Spinner /></div>;
  if (!summary) return <div className="fm-page"><EmptyState text="暂无数据" /></div>;

  const budgetPct = summary.budgetTotal > 0 ? Math.min(100, Math.round((summary.expense / summary.budgetTotal) * 100)) : 0;
  const overBudget = summary.budgetTotal > 0 && summary.expense > summary.budgetTotal;
  const recent = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>{monthLabel(summary.month)}概览</h2>
          <p className="text-xs" style={{ color: 'var(--fm-muted)' }}>今天也要把钱花在刀刃上</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="!py-2 flex items-center gap-1">
          <Plus size={16} /> 记一笔
        </Button>
      </div>

      {/* 四宫格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatTile icon={<ArrowDownRight size={15} style={{ color: '#e05a72' }} />} label="本月支出" value={formatMoney(summary.expense)} tone="pink" />
        <StatTile icon={<ArrowUpRight size={15} style={{ color: '#3f9b7c' }} />} label="本月收入" value={formatMoney(summary.income)} tone="green" />
        <StatTile icon={<TrendingUp size={15} style={{ color: 'var(--fm-purple)' }} />} label="本月结余" value={formatMoney(summary.net)} tone="purple" />
        <StatTile icon={<Wallet size={15} style={{ color: 'var(--fm-ink-strong)' }} />} label="总资产" value={formatMoney(summary.totalAssets)} tone="ink" />
      </div>

      {/* 预算 + 分类 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle
            right={<span className="text-xs" style={{ color: 'var(--fm-muted)' }}>日均可花 ¥{formatMoney(summary.dailyBudget)}</span>}
          >本月预算</SectionTitle>
          {summary.budgetTotal > 0 ? (
            <>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-xs" style={{ color: 'var(--fm-muted)' }}>已花 / 预算</div>
                  <div className="text-lg font-bold tabular-nums" style={{ color: overBudget ? 'var(--fm-danger)' : 'var(--fm-ink-strong)' }}>
                    ¥{formatMoney(summary.expense)} <span style={{ color: 'var(--fm-muted)', fontWeight: 400 }}>/ {formatMoney(summary.budgetTotal)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: 'var(--fm-muted)' }}>{overBudget ? '已超支' : '还能花'}</div>
                  <div className="text-lg font-bold tabular-nums" style={{ color: overBudget ? 'var(--fm-danger)' : '#3f9b7c' }}>
                    ¥{formatMoney(Math.abs(summary.budgetRemaining))}
                  </div>
                </div>
              </div>
              <div className="fm-bar-track h-2.5">
                <div className="fm-bar-fill h-2.5" style={{ width: `${budgetPct}%`, background: overBudget ? 'var(--fm-danger)' : 'linear-gradient(90deg,#f4a7c4,#b79ce0)' }} />
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--fm-muted)' }}>已用 {budgetPct}%，剩余 {summary.daysLeft} 天</div>
            </>
          ) : (
            <div className="text-sm py-2" style={{ color: 'var(--fm-muted)' }}>
              还没设预算，去 <button className="underline" style={{ color: 'var(--fm-purple)' }} onClick={() => navigate('/budgets')}>预算页</button> 设一个吧
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle right={<span className="text-xs" style={{ color: 'var(--fm-muted)' }}>共 {summary.byCategory.length} 类</span>}>钱去哪了</SectionTitle>
          {summary.byCategory.length === 0 ? (
            <div className="text-sm py-2" style={{ color: 'var(--fm-muted)' }}>本月还没有支出</div>
          ) : (
            <div className="space-y-2.5">
              {summary.byCategory.slice(0, 6).map(c => (
                <div key={c.categoryId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--fm-ink-strong)' }}>{c.name}</span>
                    <span style={{ color: 'var(--fm-muted)' }}>¥{formatMoney(c.amount)} · {c.percent}%</span>
                  </div>
                  <div className="fm-bar-track h-2">
                    <div className="fm-bar-fill h-2" style={{ width: `${c.percent}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 账户 + 最近 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle right={<button className="text-xs" style={{ color: 'var(--fm-purple)' }} onClick={() => navigate('/accounts')}>管理</button>}>我的账户</SectionTitle>
          {summary.accounts.length === 0 ? (
            <div className="text-sm py-2" style={{ color: 'var(--fm-muted)' }}>还没有账户</div>
          ) : (
            <div className="space-y-2">
              {summary.accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: a.color + '33' }} />
                    <span className="text-sm" style={{ color: 'var(--fm-ink-strong)' }}>{a.name}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: a.balance < 0 ? 'var(--fm-danger)' : 'var(--fm-ink-strong)' }}>¥{formatMoney(a.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle right={<button className="text-xs" style={{ color: 'var(--fm-purple)' }} onClick={() => navigate('/transactions')}>全部</button>}>最近记录</SectionTitle>
          {recent.length === 0 ? (
            <div className="text-sm py-2" style={{ color: 'var(--fm-muted)' }}>还没有记录</div>
          ) : (
            <div className="space-y-1">
              {recent.map(t => {
                const name = categoryName(categories, t.categoryId);
                const color = categoryColor(categories, t.categoryId);
                const income = t.type === 'income';
                const transfer = t.type === 'transfer';
                const acc = accounts.find(a => a.id === t.accountId);
                const toAcc = accounts.find(a => a.id === t.toAccountId);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--fm-line)' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: transfer ? 'var(--fm-purple-soft)' : color + '40' }}>
                        {transfer ? <ArrowRightLeft size={13} style={{ color: 'var(--fm-purple)' }} /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ color: 'var(--fm-ink-strong)' }}>{transfer ? '转账' : name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--fm-muted)' }}>
                          {transfer ? `${acc ? acc.name : '未知'} → ${toAcc ? toAcc.name : '未知'}` : prettyDate(t.date)}{t.note ? ' · ' + t.note : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: income ? '#3f9b7c' : transfer ? 'var(--fm-purple)' : 'var(--fm-ink-strong)' }}>
                      {transfer ? '' : (income ? '+' : '-')}¥{formatMoney(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 移动端悬浮按钮 */}
      <button
        onClick={() => setFormOpen(true)}
        className="md:hidden fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)' }}
      >
        <Plus size={26} />
      </button>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
