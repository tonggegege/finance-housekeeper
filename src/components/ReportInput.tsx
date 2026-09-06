import { useCallback } from 'react';
import { SendHorizontal } from 'lucide-react';

interface ReportInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLES = ['打车20', '奶茶18', '外卖35', '聚餐260', '预算8000', '先存2000'];

/** 报账输入框：只收「类别＋金额」 */
export function ReportInput({ value, onChange, onSend, isLoading, disabled }: ReportInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  return (
    <div className="fm-card px-5 py-4">
      <div className="flex items-center gap-2">
        <input
          className="fm-amount-input flex-1"
          style={{
            textAlign: 'left',
            padding: '10px 14px',
            fontWeight: 400,
            fontSize: 14,
            background: '#fbf8fe',
            borderColor: 'var(--fm-line)',
          }}
          placeholder="报一笔：打车20（也认「奶茶18 外卖35」「预算8000」）"
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || isLoading || !value.trim()}
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            border: 'none',
            cursor: disabled || isLoading || !value.trim() ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading || !value.trim() ? 0.45 : 1,
            background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(183,156,224,0.35)',
          }}
          title="发送"
        >
          <SendHorizontal size={17} />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button key={ex} type="button" className="fm-chip" onClick={() => onChange(ex)}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
