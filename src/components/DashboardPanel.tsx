import { useMemo } from 'react';
import { Sparkles, CalendarClock } from 'lucide-react';
import { LedgerSummary } from '../finance/calc';
import { formatMoney } from '../finance/parse';

interface DashboardPanelProps {
  summary: LedgerSummary;
  /** 管家最新一段实话（可能正在流式输出） */
  truth: string;
  isThinking: boolean;
  /** 往期实话 */
  history: { id: string; text: string; time?: string }[];
  onWeeklyReview: () => void;
  weeklyDisabled: boolean;
}

export function DashboardPanel({
  summary,
  truth,
  isThinking,
  history,
  onWeeklyReview,
  weeklyDisabled,
}: DashboardPanelProps) {
  const usedPercent = Math.min(100, Math.max(0, summary.usedRatio * 100));
  const over = summary.overspent;

  const shareItems = useMemo(() => summary.categories.slice(0, 7), [summary.categories]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* 大数字：本月还能花 */}
      <div className="fm-card px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="fm-label">本月还能花</span>
          <span className="fm-label">
            {summary.monthLabel} · 还剩 {summary.daysLeft} 天
          </span>
        </div>

        <div
          className="mt-1 text-[52px] leading-[1.05] font-semibold tabular-nums"
          style={{ color: over ? 'var(--fm-danger)' : 'var(--fm-ink-strong)' }}
        >
          {over ? '-' : ''}
          {formatMoney(Math.abs(summary.remaining))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="fm-card-soft px-3 py-2.5">
            <div className="fm-label">平摊每天</div>
            <div
              className="text-[19px] font-semibold tabular-nums"
              style={{ color: over ? 'var(--fm-danger)' : 'var(--fm-purple)' }}
            >
              {over ? '-' : ''}
              {formatMoney(Math.abs(summary.daily))}
            </div>
          </div>
          <div className="fm-card-soft px-3 py-2.5">
            <div className="fm-label">可花额度</div>
            <div className="text-[19px] font-semibold tabular-nums" style={{ color: 'var(--fm-ink-strong)' }}>
              {formatMoney(summary.spendable)}
            </div>
            <div className="fm-label mt-0.5">
              预算 {formatMoney(summary.budget)} − 必存 {formatMoney(summary.mustSave)}
            </div>
          </div>
        </div>

        {/* 已花进度 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="fm-label">已花 {formatMoney(summary.spent)}</span>
            <span className="fm-label" style={{ color: over ? 'var(--fm-danger)' : undefined }}>
              {summary.usedRatio > 0 ? `${(summary.usedRatio * 100).toFixed(0)}%` : '0%'}
              {over ? ' · 超支了' : ''}
            </span>
          </div>
          <div className="fm-bar-track" style={{ height: 10 }}>
            <div
              className="fm-bar-fill"
              style={{
                width: `${usedPercent}%`,
                background: over
                  ? 'linear-gradient(90deg,#f6a7bb,#e8798f)'
                  : 'linear-gradient(90deg,#c9b6f2,#93c5f5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 钱去哪了 */}
      <div className="fm-card px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>
            钱去哪了
          </span>
          <span className="fm-label">共 {summary.count} 笔</span>
        </div>

        {shareItems.length === 0 ? (
          <div className="text-[13px]" style={{ color: 'var(--fm-muted)' }}>
            还没有支出，报一笔就出图。
          </div>
        ) : (
          <>
            {/* 堆叠占比条 */}
            <div className="flex rounded-full overflow-hidden" style={{ height: 14 }}>
              {shareItems.map(c => (
                <div
                  key={c.category}
                  title={`${c.category} ${formatMoney(c.amount)}`}
                  style={{ width: `${Math.max(2, c.ratio * 100)}%`, background: c.color }}
                />
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {shareItems.map(c => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-[13px] w-12 flex-shrink-0" style={{ color: 'var(--fm-ink)' }}>
                    {c.category}
                  </span>
                  <div className="fm-bar-track flex-1" style={{ height: 8 }}>
                    <div
                      className="fm-bar-fill"
                      style={{ width: `${Math.max(2, c.ratio * 100)}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-[12px] tabular-nums w-10 text-right" style={{ color: 'var(--fm-muted)' }}>
                    {(c.ratio * 100).toFixed(0)}%
                  </span>
                  <span
                    className="text-[13px] tabular-nums w-20 text-right font-medium"
                    style={{ color: 'var(--fm-ink-strong)' }}
                  >
                    {formatMoney(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 它跟你说的实话 */}
      <div className="fm-card px-6 py-5 flex-1 flex flex-col" style={{ minHeight: 220 }}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>
            <Sparkles size={15} style={{ color: 'var(--fm-pink)' }} />
            它跟你说的实话
          </span>
          <button
            type="button"
            className="fm-chip flex items-center gap-1.5"
            onClick={onWeeklyReview}
            disabled={weeklyDisabled}
            style={{ opacity: weeklyDisabled ? 0.5 : 1 }}
          >
            <CalendarClock size={12} />
            每周实话总结
          </button>
        </div>

        <div
          className="fm-card-soft px-4 py-3.5 text-[14px] leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--fm-ink)' }}
        >
          {truth ? (
            <span className={isThinking ? 'fm-caret' : undefined}>{truth}</span>
          ) : (
            <span style={{ color: 'var(--fm-muted)' }}>
              {isThinking ? '正在算账…' : '报一笔账，它就开口。比如：打车20'}
            </span>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-3 overflow-y-auto" style={{ maxHeight: 160 }}>
            <div className="fm-label mb-1.5">往期实话</div>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex gap-2 text-[12.5px] leading-relaxed">
                  <span style={{ color: 'var(--fm-purple)' }}>·</span>
                  <span style={{ color: 'var(--fm-muted)' }}>{h.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
