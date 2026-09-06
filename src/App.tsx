import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/ui';
import { FinanceProvider } from './finance/FinanceData';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataPage } from './pages/DataPage';
import { HousekeeperPage } from './pages/HousekeeperPage';
import { Spinner } from './components/ui';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="fm-app h-screen w-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return (
    <FinanceProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/housekeeper" element={<HousekeeperPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RequireAuth />
      </ToastProvider>
    </AuthProvider>
  );
}
