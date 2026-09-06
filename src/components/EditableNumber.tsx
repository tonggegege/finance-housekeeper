import { useEffect, useRef, useState } from 'react';

interface EditableNumberProps {
  value: number;
  onCommit: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
  /** 显示成 ¥1,234 的形式 */
  prefix?: string;
  width?: number | string;
  title?: string;
}

/** 点一下就能改的数字 */
export function EditableNumber({
  value,
  onCommit,
  className = '',
  style,
  prefix = '¥',
  width = 84,
  title,
}: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, value]);

  const commit = () => {
    const next = Number(draft.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(next) && next >= 0) onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`fm-amount-input ${className}`}
        style={{ width, textAlign: 'right', padding: '2px 6px', ...style }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      title={title || '点一下改金额'}
      className={`fm-amount-input ${className}`}
      style={{ width: 'auto', padding: '2px 6px', textAlign: 'right', cursor: 'pointer', ...style }}
      onClick={() => setEditing(true)}
    >
      {prefix}
      {(Number(value) || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
    </button>
  );
}
