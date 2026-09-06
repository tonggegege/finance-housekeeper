import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Receipt, Tags, Wallet, Target, BarChart3, Database, Bot, LogOut, ChevronDown, Menu,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFinance } from '../finance/FinanceData';
import { monthOptions, monthLabel, todayStr } from '../lib/format';
import { SelectInput } from './ui';

const NAV = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard },
  { to: '/transactions', label: '流水', icon: Receipt },
  { to: '/categories', label: '分类', icon: Tags },
  { to: '/accounts', label: '账户', icon: Wallet },
  { to: '/budgets', label: '预算', icon: Target },
  { to: '/reports', label: '报表', icon: BarChart3 },
  { to: '/data', label: '数据', icon: Database },
  { to: '/housekeeper', label: '管家', icon: Bot },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { selectedMonth, setSelectedMonth } = useFinance();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="fm-app flex h-screen w-screen overflow-hidden">
      {/* 桌面端侧栏 */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 w-[88px] lg:w-[200px] border-r items-center py-4"
        style={{ borderColor: 'var(--fm-line)', backgroundColor: 'rgba(255,255,255,0.6)' }}
      >
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg,#f4a7c4,#b79ce0)' }}>财</div>
          <span className="hidden lg:block text-[15px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>财务管家</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1 w-full px-2">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'nav-active' : 'nav-idle'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium nav-idle w-full mt-2"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="hidden lg:block">退出</span>
        </button>
      </aside>

      {/* 主区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header
          className="h-14 flex items-center justify-between px-4 flex-shrink-0 border-b"
          style={{ borderColor: 'var(--fm-line)', backgroundColor: 'rgba(255,255,255,0.55)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold" style={{ color: 'var(--fm-ink-strong)' }}>
              {NAV.find(n => location.pathname.startsWith(n.to))?.label || '财务管家'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[130px] sm:w-[150px]">
              <SelectInput value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                {monthOptions().map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectInput>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-black/5"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#b79ce0,#93c5f5)' }}>
                  {(user?.username || '我').slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown size={14} style={{ color: 'var(--fm-muted)' }} className="hidden sm:block" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-44 rounded-xl shadow-lg p-2 text-sm"
                  style={{ backgroundColor: '#fff', border: '1px solid var(--fm-line)' }}
                >
                  <div className="px-3 py-2 text-xs" style={{ color: 'var(--fm-muted)' }}>当前账号</div>
                  <div className="px-3 py-1 font-medium" style={{ color: 'var(--fm-ink-strong)' }}>{user?.username}</div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--fm-danger)' }}>
                    <LogOut size={16} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 内容 */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: 'transparent' }}>
          {children}
        </main>

        {/* 移动端底栏 */}
        <nav
          className="md:hidden flex items-stretch justify-around flex-shrink-0 border-t bg-white/80 backdrop-blur"
          style={{ borderColor: 'var(--fm-line)' }}
        >
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-1 flex-1 transition-colors ${
                  isActive ? 'nav-active-mobile' : 'nav-idle-mobile'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
