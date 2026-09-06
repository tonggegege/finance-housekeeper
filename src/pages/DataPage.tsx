import { useState, useRef } from 'react';
import { Download, Upload, FileJson, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, getToken } from '../lib/api';
import { useFinance } from '../finance/FinanceData';
import { Button, Card, Field, SectionTitle, Spinner } from '../components/ui';

export function DataPage() {
  const { refresh } = useFinance();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setBusy(true);
    setMsg(null);
    try {
      const token = getToken();
      const res = await fetch('/api/export', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('导出失败');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `财务数据导出_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ type: 'ok', text: '导出成功，文件已下载' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || '导出失败' });
    } finally {
      setBusy(false);
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        setMsg({ type: 'err', text: '文件不是有效的 JSON' });
        return;
      }
      if (typeof parsed !== 'object' || parsed === null) {
        setMsg({ type: 'err', text: '数据格式不正确' });
        return;
      }
      const res = await api.post<{ counts: Record<string, number> }>('/import', { data: parsed, mode });
      await refresh();
      const c = res.counts;
      setMsg({ type: 'ok', text: `导入完成：分类 ${c.categories} · 账户 ${c.accounts} · 记录 ${c.transactions} · 预算 ${c.budgets}` });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || '导入失败' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="fm-page pb-24 md:pb-8 max-w-2xl">
      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--fm-ink-strong)' }}>数据备份</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--fm-muted)' }}>导出全部账本，或导入之前备份的文件</p>

      {msg && (
        <div className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{ backgroundColor: msg.type === 'ok' ? '#e3f3ec' : '#fbe5ea', color: msg.type === 'ok' ? '#3f9b7c' : '#e05a72' }}>
          {msg.type === 'ok' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertTriangle size={16} className="mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      <Card className="mb-4">
        <SectionTitle right={<FileJson size={18} style={{ color: 'var(--fm-muted)' }} />}>导出数据</SectionTitle>
        <p className="text-sm mb-3" style={{ color: 'var(--fm-muted)' }}>将你的分类、账户、收支记录与预算导出为 JSON 文件，可随时备份或迁移。</p>
        <Button onClick={handleExport} disabled={busy} className="flex items-center gap-2">
          <Download size={16} /> {busy ? '导出中…' : '导出为 JSON'}
        </Button>
      </Card>

      <Card>
        <SectionTitle right={<Upload size={18} style={{ color: 'var(--fm-muted)' }} />}>导入数据</SectionTitle>
        <p className="text-sm mb-3" style={{ color: 'var(--fm-muted)' }}>从备份文件恢复数据。</p>
        <Field label="导入方式">
          <div className="flex p-1 rounded-xl" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
            <button onClick={() => setMode('merge')} className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: mode === 'merge' ? '#fff' : 'transparent', color: mode === 'merge' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>合并（追加）</button>
            <button onClick={() => setMode('replace')} className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: mode === 'replace' ? '#fff' : 'transparent', color: mode === 'replace' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}>替换（清空后导入）</button>
          </div>
        </Field>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="soft" className="flex items-center gap-2">
          <Upload size={16} /> {busy ? '导入中…' : '选择文件并导入'}
        </Button>
        <p className="text-[11px] mt-2" style={{ color: 'var(--fm-muted)' }}>替换模式会先清空当前账号所有数据，请谨慎操作。</p>
      </Card>
    </div>
  );
}
