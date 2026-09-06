import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLedger } from '../finance/useLedger';
import { buildLedgerContext, summarize } from '../finance/calc';
import { parseReport } from '../finance/parse';
import { Message, PermissionMode, Session } from '../types';
import { ExpensePanel } from '../components/ExpensePanel';
import { DashboardPanel } from '../components/DashboardPanel';
import { ReportInput } from '../components/ReportInput';

interface FinancePageProps {
  currentSession: Session | undefined;
  isLoading: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (
    message: string,
    newChatOptions?: { agentId: string; cwd: string; permissionMode: PermissionMode },
    onNavigate?: (path: string) => void,
    context?: string,
  ) => void;
  onStop: () => void;
  ready: boolean;
}

export function FinancePage({
  currentSession,
  isLoading,
  inputValue,
  onInputChange,
  onSendMessage,
  onStop,
  ready,
}: FinancePageProps) {
  const navigate = useNavigate();
  const { state, summary, addItems, updateItem, removeItem, setBudget, setMustSave, clearMonth } = useLedger();

  const messages: Message[] = currentSession?.messages ?? [];

  // 最新一段实话 + 往期
  const { truth, isThinking, history } = useMemo(() => {
    const assistantMsgs = messages.filter(m => m.role === 'assistant' && (m.content || '').trim());
    const latest = assistantMsgs[assistantMsgs.length - 1];
    return {
      truth: latest?.content || '',
      isThinking: Boolean(latest?.isStreaming),
      history: assistantMsgs
        .slice(0, -1)
        .reverse()
        .slice(0, 8)
        .map(m => ({ id: m.id, text: m.content.trim() })),
    };
  }, [messages]);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || isLoading || !ready) return;

      const parsed = parseReport(content);

      // 先落账，再让管家按最新数字说话
      if (parsed.budget !== undefined) setBudget(parsed.budget);
      if (parsed.mustSave !== undefined) setMustSave(parsed.mustSave);
      if (parsed.entries.length > 0) addItems(parsed.entries);

      const nextSummary = summarize({
        budget: parsed.budget ?? state.budget,
        mustSave: parsed.mustSave ?? state.mustSave,
        items: [
          ...state.items,
          ...parsed.entries.map((e, i) => ({
            id: `pending-${Date.now()}-${i}`,
            category: e.category,
            amount: e.amount,
            date: new Date().toISOString().slice(0, 10),
          })),
        ],
      });

      onSendMessage(
        content,
        { agentId: 'default', cwd: '', permissionMode: 'default' },
        path => navigate(path),
        buildLedgerContext(nextSummary),
      );
    },
    [isLoading, ready, state, addItems, setBudget, setMustSave, onSendMessage, navigate],
  );

  const handleWeeklyReview = useCallback(() => {
    if (isLoading || !ready) return;
    onSendMessage(
      '做一次本周实话总结：哪笔最不该花，砍掉它一年能省多少，换算成具体金额。最多两行。',
      { agentId: 'default', cwd: '', permissionMode: 'default' },
      path => navigate(path),
      buildLedgerContext(summarize(state)),
    );
  }, [isLoading, ready, state, onSendMessage, navigate]);

  return (
    <div className="flex-1 min-h-0 grid gap-4 p-4 grid-cols-1 lg:grid-cols-[minmax(360px,420px)_1fr]">
      {/* 左：花钱清单 + 报账 */}
      <div className="flex flex-col gap-4 min-h-0">
        <div className="flex-1 min-h-0">
          <ExpensePanel
            summary={summary}
            items={state.items}
            budget={state.budget}
            mustSave={state.mustSave}
            onAddItem={(category, amount) => addItems([{ category, amount }])}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onBudgetChange={setBudget}
            onMustSaveChange={setMustSave}
            onClearMonth={clearMonth}
          />
        </div>
        <ReportInput
          value={inputValue}
          onChange={onInputChange}
          onSend={() => send(inputValue)}
          isLoading={isLoading}
          disabled={!ready}
        />
      </div>

      {/* 右：看板 + 实话 */}
      <div className="min-h-0">
        <DashboardPanel
          summary={summary}
          truth={truth}
          isThinking={isThinking}
          history={history}
          onWeeklyReview={handleWeeklyReview}
          weeklyDisabled={isLoading || !ready}
        />
      </div>
    </div>
  );
}
