import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { api } from '../lib/api';
import { useFinance } from '../finance/FinanceData';
import { Card, SectionTitle, Spinner, SelectInput } from '../components/ui';
import { formatMoney, yearOptions, currentYear } from '../lib/format';
import type { YearlyStat } from '../types/finance';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl shadow-lg px-3 py-2 text-xs" style={{ backgroundColor: '#fff', border: '1px solid var(--fm-line)' }}>
      {label && <div className="font-medium mb-1" style={{ color: 'var(--fm-ink-strong)' }}>{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2" style={{ color: 'var(--fm-muted)' }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}：¥{formatMoney(p.value)}
        </div>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { categories } = useFinance();
  const [year, setYear] = useState<number>(currentYear());
  const [data, setData] = useState<YearlyStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<YearlyStat>(`/stats/yearly?year=${year}`)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading && !data) return <div className="fm-page"><Spinner /></div>;

  const months = data?.months.map(m => ({ name: m.label, 收入: m.income, 支出: m.expense })) || [];
  const pieData = (data?.byCategory || []).map(c => ({ name: c.name, value: c.amount, color: c.color }));

  return (
    <div className="fm-page pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--fm-ink-strong)' }}>收支报表</h2>
        <div className="w-[110px]">
          <SelectInput value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectInput>
        </div>
      </div>

      {/* 年度汇总 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="!p-3.5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fm-muted)' }}><ArrowUpRight size={13} style={{ color: '#3f9b7c' }} />年收入</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: '#3f9b7c' }}>¥{formatMoney(data?.totalIncome ?? 0)}</div>
        </Card>
        <Card className="!p-3.5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fm-muted)' }}><ArrowDownRight size={13} style={{ color: 'var(--fm-danger)' }} />年支出</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--fm-danger)' }}>¥{formatMoney(data?.totalExpense ?? 0)}</div>
        </Card>
        <Card className="!p-3.5">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fm-muted)' }}><Scale size={13} style={{ color: 'var(--fm-purple)' }} />年结余</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--fm-ink-strong)' }}>¥{formatMoney((data?.totalIncome ?? 0) - (data?.totalExpense ?? 0))}</div>
        </Card>
      </div>

      {/* 月度趋势 */}
      <Card className="mb-4">
        <SectionTitle>月度收支趋势</SectionTitle>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={months} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efe9f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#918aa3' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#918aa3' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(183,156,224,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#918aa3' }} />
              <Bar dataKey="收入" fill="#63b79a" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar dataKey="支出" fill="#e8798f" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 年度支出构成 */}
      <Card>
        <SectionTitle>年度支出构成</SectionTitle>
        {pieData.length === 0 ? (
          <div className="text-sm py-8 text-center" style={{ color: 'var(--fm-muted)' }}>今年还没有支出记录</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span style={{ color: 'var(--fm-ink-strong)' }}>{d.name}</span>
                  </div>
                  <span className="tabular-nums" style={{ color: 'var(--fm-muted)' }}>¥{formatMoney(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
