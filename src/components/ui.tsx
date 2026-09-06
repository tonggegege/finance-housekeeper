import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';
import { X } from 'lucide-react';

// ============= Toast =============

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setItems(prev => [...prev, { id, type, message }]);
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 2600);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
        {items.map(i => (
          <div
            key={i.id}
            className="fm-fade-up px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium"
            style={{
              backgroundColor: '#fff',
              color: i.type === 'error' ? '#e05a72' : i.type === 'success' ? '#3f9b7c' : '#5b5470',
              border: `1px solid ${i.type === 'error' ? '#f3c2cc' : i.type === 'success' ? '#bfe6d6' : '#efe9f7'}`,
              boxShadow: '0 8px 28px rgba(150,128,190,0.18)',
            }}
          >
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ============= Card =============

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`fm-card p-4 sm:p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[15px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>{children}</h3>
      {right}
    </div>
  );
}

// ============= Modal =============

export function Modal({
  open, title, onClose, children, footer, maxWidth = 460,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(51,46,64,0.45)' }}
      onClick={onClose}
    >
      <div
        className="fm-fade-up bg-white w-full sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--fm-line)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--fm-line)' }}>{footer}</div>}
      </div>
    </div>
  );
}

// ============= Form fields =============

const fieldBase =
  'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white ' +
  'focus:border-[var(--fm-purple)] focus:ring-2 focus:ring-[rgba(183,156,224,0.18)]';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fm-muted)' }}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className || ''}`} style={{ color: 'var(--fm-ink-strong)', borderColor: 'var(--fm-line)' }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} resize-none ${props.className || ''}`} style={{ color: 'var(--fm-ink-strong)', borderColor: 'var(--fm-line)' }} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" inputMode="decimal" {...props} className={`${fieldBase} ${props.className || ''}`} style={{ color: 'var(--fm-ink-strong)', borderColor: 'var(--fm-line)' }} />;
}

export function DateInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" {...props} className={`${fieldBase} ${props.className || ''}`} style={{ color: 'var(--fm-ink-strong)', borderColor: 'var(--fm-line)' }} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldBase} appearance-none cursor-pointer ${props.className || ''}`} style={{ color: 'var(--fm-ink-strong)', borderColor: 'var(--fm-line)', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23918aa3' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
      {props.children}
    </select>
  );
}

export function Button({
  children, variant = 'primary', className = '', ...rest
}: { children: ReactNode; variant?: 'primary' | 'ghost' | 'danger' | 'soft'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--fm-purple)', color: '#fff', border: '1px solid var(--fm-purple)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--fm-ink-strong)', border: '1px solid var(--fm-line)' },
    soft: { backgroundColor: 'var(--fm-purple-soft)', color: 'var(--fm-purple)', border: '1px solid transparent' },
    danger: { backgroundColor: '#fff', color: 'var(--fm-danger)', border: '1px solid #f3c2cc' },
  };
  return (
    <button
      {...rest}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function EmptyState({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: 'var(--fm-muted)' }}>
      {icon && <div className="mb-2 opacity-60">{icon}</div>}
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 border-[var(--fm-purple)] border-t-transparent animate-spin" />
    </div>
  );
}
