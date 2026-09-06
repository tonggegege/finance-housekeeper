import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { Button, Field, TextInput } from '../components/ui';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate('/dashboard');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fm-app h-screen w-screen flex items-center justify-center px-4">
      <div className="fm-card w-full max-w-[400px] p-7 sm:p-8 fm-fade-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-3" style={{ background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)' }}>
            <Wallet size={26} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--fm-ink-strong)' }}>私人财务管家</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--fm-muted)' }}>记一笔，看清钱去哪了</p>
        </div>

        <div className="flex p-1 rounded-xl mb-5" style={{ backgroundColor: 'var(--fm-purple-soft)' }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow-sm' : ''}`}
            style={{ color: mode === 'login' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow-sm' : ''}`}
            style={{ color: mode === 'register' ? 'var(--fm-purple)' : 'var(--fm-muted)' }}
          >
            注册
          </button>
        </div>

        <Field label="用户名">
          <TextInput value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" autoFocus />
        </Field>
        <Field label="密码">
          <TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? '至少 4 位' : '请输入密码'} onKeyDown={e => e.key === 'Enter' && submit()} />
        </Field>

        {error && <div className="text-sm mb-3" style={{ color: 'var(--fm-danger)' }}>{error}</div>}

        <Button onClick={submit} disabled={loading} className="w-full flex items-center justify-center gap-2">
          {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
          {loading ? '处理中…' : mode === 'login' ? '登 录' : '注 册 并 进 入'}
        </Button>

        <p className="text-[11px] text-center mt-4 leading-relaxed" style={{ color: 'var(--fm-muted)' }}>
          数据保存在本地服务，注册即创建独立账本
        </p>
      </div>
    </div>
  );
}
