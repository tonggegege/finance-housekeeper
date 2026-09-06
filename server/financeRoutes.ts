import { Router } from 'express';
import {
  authMiddleware,
  signToken,
} from './auth.js';
import { verifyPassword } from './crypto.js';
import {
  createUser,
  getUserByUsername,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  computeAccountBalance,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgets,
  upsertBudget,
  deleteBudget,
  exportUserData,
  replaceAllForUser,
  mergeForUser,
  type TxType,
  type AccountType,
} from './financeStore.js';

const router = Router();

// 统一错误返回
function fail(res: any, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

// 当前月份 YYYY-MM
function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ============= 认证 =============

router.post('/auth/register', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return fail(res, 400, '用户名和密码不能为空');
    if (String(password).length < 4) return fail(res, 400, '密码至少 4 位');
    if (getUserByUsername(String(username))) return fail(res, 409, '该用户名已被注册');
    const user = createUser(String(username), String(password));
    const token = signToken({ userId: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e: any) {
    fail(res, 500, e?.message || '注册失败');
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = getUserByUsername(String(username));
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return fail(res, 401, '用户名或密码错误');
    }
    const token = signToken({ userId: user.id, username: user.username });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (e: any) {
    fail(res, 500, e?.message || '登录失败');
  }
});

router.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ id: req.userId, username: req.username });
});

// 以下所有路由都需要鉴权
router.use(authMiddleware);

// ============= 分类 =============

router.get('/categories', (req, res) => {
  res.json({ categories: getCategories(req.userId!) });
});

router.post('/categories', (req, res) => {
  try {
    const { name, type, color, icon } = req.body || {};
    if (!name) return fail(res, 400, '分类名称不能为空');
    const cat = createCategory({
      userId: req.userId!,
      name: String(name),
      type: (type === 'income' ? 'income' : 'expense') as TxType,
      color: color || '#B39DDB',
      icon: icon || 'tag',
    });
    res.json({ category: cat });
  } catch (e: any) {
    fail(res, 500, e?.message || '创建分类失败');
  }
});

router.put('/categories/:id', (req, res) => {
  const updated = updateCategory(req.params.id, req.userId!, req.body || {});
  if (!updated) return fail(res, 404, '分类不存在');
  res.json({ category: updated });
});

router.delete('/categories/:id', (req, res) => {
  const ok = deleteCategory(req.params.id, req.userId!);
  if (!ok) return fail(res, 404, '分类不存在');
  res.json({ success: true });
});

// ============= 账户 =============

router.get('/accounts', (req, res) => {
  const accounts = getAccounts(req.userId!);
  const txs = getTransactions(req.userId!);
  const withBalance = accounts.map(a => ({ ...a, balance: computeAccountBalance(a, txs) }));
  const totalAssets = withBalance.reduce((s, a) => s + a.balance, 0);
  res.json({ accounts: withBalance, totalAssets });
});

router.post('/accounts', (req, res) => {
  try {
    const { name, type, initialBalance, currency, icon, color } = req.body || {};
    if (!name) return fail(res, 400, '账户名称不能为空');
    const acc = createAccount({
      userId: req.userId!,
      name: String(name),
      type: (type || 'cash') as AccountType,
      initialBalance: Number(initialBalance) || 0,
      currency: currency || 'CNY',
      icon: icon || 'wallet',
      color: color || '#90CAF9',
    });
    res.json({ account: { ...acc, balance: acc.initialBalance } });
  } catch (e: any) {
    fail(res, 500, e?.message || '创建账户失败');
  }
});

router.put('/accounts/:id', (req, res) => {
  const updated = updateAccount(req.params.id, req.userId!, req.body || {});
  if (!updated) return fail(res, 404, '账户不存在');
  const txs = getTransactions(req.userId!);
  res.json({ account: { ...updated, balance: computeAccountBalance(updated, txs) } });
});

router.delete('/accounts/:id', (req, res) => {
  const ok = deleteAccount(req.params.id, req.userId!);
  if (!ok) return fail(res, 404, '账户不存在');
  res.json({ success: true });
});

// ============= 交易 =============

function parseDate(s: string): string {
  // 接受 YYYY-MM-DD 或 YYYY-M-D
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

router.get('/transactions', (req, res) => {
  const { month, type } = req.query;
  let txs = getTransactions(req.userId!);
  if (month) txs = txs.filter(t => t.date.startsWith(String(month)));
  if (type) txs = txs.filter(t => t.type === type);
  res.json({ transactions: txs });
});

router.post('/transactions', (req, res) => {
  try {
    const { type, amount, categoryId, accountId, note, date } = req.body || {};
    if (!amount || Number(amount) <= 0) return fail(res, 400, '金额必须大于 0');
    if (!categoryId) return fail(res, 400, '请选择分类');
    const tx = createTransaction({
      userId: req.userId!,
      type: (type === 'income' ? 'income' : 'expense') as TxType,
      amount: Number(amount),
      categoryId: String(categoryId),
      accountId: accountId || null,
      note: note || '',
      date: date ? parseDate(String(date)) : new Date().toISOString().slice(0, 10),
    });
    res.json({ transaction: tx });
  } catch (e: any) {
    fail(res, 500, e?.message || '添加交易失败');
  }
});

router.post('/transactions/transfer', (req, res) => {
  try {
    const { amount, fromAccountId, toAccountId, date, note } = req.body || {};
    if (!amount || Number(amount) <= 0) return fail(res, 400, '金额必须大于 0');
    if (!fromAccountId || !toAccountId) return fail(res, 400, '请选择转出和转入账户');
    if (fromAccountId === toAccountId) return fail(res, 400, '转出和转入账户不能相同');
    const userAccounts = getAccounts(req.userId!);
    const fromAcc = userAccounts.find(a => a.id === fromAccountId);
    const toAcc = userAccounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc) return fail(res, 400, '账户不存在');
    const tx = createTransaction({
      userId: req.userId!,
      type: 'transfer',
      amount: Number(amount),
      categoryId: '__transfer__',
      accountId: String(fromAccountId),
      toAccountId: String(toAccountId),
      note: note || `${fromAcc.name} → ${toAcc.name}`,
      date: date ? parseDate(String(date)) : new Date().toISOString().slice(0, 10),
    });
    res.json({ transaction: tx });
  } catch (e: any) {
    fail(res, 500, e?.message || '转账失败');
  }
});

router.put('/transactions/:id', (req, res) => {
  const updates: any = { ...(req.body || {}) };
  if (updates.amount !== undefined) updates.amount = Number(updates.amount);
  if (updates.date) updates.date = parseDate(String(updates.date));
  if (updates.type) updates.type = updates.type === 'income' ? 'income' : updates.type === 'transfer' ? 'transfer' : 'expense';
  const updated = updateTransaction(req.params.id, req.userId!, updates);
  if (!updated) return fail(res, 404, '交易不存在');
  res.json({ transaction: updated });
});

router.delete('/transactions/:id', (req, res) => {
  const ok = deleteTransaction(req.params.id, req.userId!);
  if (!ok) return fail(res, 404, '交易不存在');
  res.json({ success: true });
});

// ============= 预算 =============

router.get('/budgets', (req, res) => {
  const { year, month } = req.query;
  let budgets = getBudgets(req.userId!);
  if (year) budgets = budgets.filter(b => b.year === Number(year));
  if (month) budgets = budgets.filter(b => b.month === Number(month));
  res.json({ budgets });
});

router.post('/budgets', (req, res) => {
  try {
    const { categoryId, amount, period, year, month } = req.body || {};
    if (!amount || Number(amount) <= 0) return fail(res, 400, '预算金额必须大于 0');
    const budget = upsertBudget({
      userId: req.userId!,
      categoryId: String(categoryId || 'all'),
      amount: Number(amount),
      period: period === 'yearly' ? 'yearly' : 'monthly',
      year: Number(year) || new Date().getFullYear(),
      month: month ? Number(month) : undefined,
    });
    res.json({ budget });
  } catch (e: any) {
    fail(res, 500, e?.message || '保存预算失败');
  }
});

router.delete('/budgets/:id', (req, res) => {
  const ok = deleteBudget(req.params.id, req.userId!);
  if (!ok) return fail(res, 404, '预算不存在');
  res.json({ success: true });
});

// ============= 统计 =============

function buildSummary(userId: string, month: string) {
  const txs = getTransactions(userId);
  const categories = getCategories(userId);
  const accounts = getAccounts(userId);
  const budgets = getBudgets(userId);

  const monthTxs = txs.filter(t => t.date.startsWith(month));
  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  // 账户总资产的合计（基于全部交易，而非仅当月）
  const accountsWithBalance = accounts.map(a => ({ ...a, balance: computeAccountBalance(a, txs) }));
  const totalAssets = accountsWithBalance.reduce((s, a) => s + a.balance, 0);

  // 分类占比（支出）
  const catMap = new Map(categories.map(c => [c.id, c]));
  const byCatAgg = new Map<string, number>();
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    byCatAgg.set(t.categoryId, (byCatAgg.get(t.categoryId) || 0) + t.amount);
  });
  const byCategory = Array.from(byCatAgg.entries())
    .map(([cid, amount]) => {
      const c = catMap.get(cid);
      return {
        categoryId: cid,
        name: c ? c.name : (cid === '__uncategorized__' ? '未分类' : '已删除分类'),
        color: c ? c.color : '#CFD8DC',
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .map(c => ({ ...c, percent: expense > 0 ? Math.round((c.amount / expense) * 1000) / 10 : 0 }));

  // 当月总预算
  const [y, m] = month.split('-').map(Number);
  const monthlyBudget = budgets.find(b => b.period === 'monthly' && b.categoryId === 'all' && b.year === y && b.month === m);
  const budgetTotal = monthlyBudget ? monthlyBudget.amount : 0;
  const budgetRemaining = budgetTotal - expense;

  // 每日平均与剩余天数
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const isCurrentMonth = curY === y && curM === m;
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth;
  const daysLeft = isCurrentMonth ? Math.max(daysInMonth - now.getDate(), 0) : 0;
  const dailyAvg = dayOfMonth > 0 ? expense / dayOfMonth : 0;
  const dailyBudget = daysLeft > 0 && budgetRemaining > 0 ? budgetRemaining / daysLeft : 0;

  return {
    month,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net: Math.round(net * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    budgetTotal: Math.round(budgetTotal * 100) / 100,
    budgetRemaining: Math.round(budgetRemaining * 100) / 100,
    byCategory,
    accounts: accountsWithBalance.map(a => ({ id: a.id, name: a.name, type: a.type, balance: Math.round(a.balance * 100) / 100, color: a.color })),
    daysInMonth,
    daysLeft,
    dailyAvg: Math.round(dailyAvg * 100) / 100,
    dailyBudget: Math.round(dailyBudget * 100) / 100,
  };
}

router.get('/stats/summary', (req, res) => {
  const month = (req.query.month as string) || thisMonth();
  res.json({ summary: buildSummary(req.userId!, month) });
});

router.get('/stats/monthly', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const txs = getTransactions(req.userId!);
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const mt = txs.filter(t => t.date.startsWith(key));
    const income = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    months.push({ month: m, label: `${m}月`, income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100, net: Math.round((income - expense) * 100) / 100 });
  }
  res.json({ year, months });
});

router.get('/stats/yearly', (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const txs = getTransactions(req.userId!);
  const categories = getCategories(req.userId!);
  const yearTxs = txs.filter(t => t.date.startsWith(String(year)));

  // 分类年度支出
  const catMap = new Map(categories.map(c => [c.id, c]));
  const byCatAgg = new Map<string, number>();
  yearTxs.filter(t => t.type === 'expense').forEach(t => {
    byCatAgg.set(t.categoryId, (byCatAgg.get(t.categoryId) || 0) + t.amount);
  });
  const byCategory = Array.from(byCatAgg.entries())
    .map(([cid, amount]) => {
      const c = catMap.get(cid);
      return { categoryId: cid, name: c ? c.name : '已删除分类', color: c ? c.color : '#CFD8DC', amount: Math.round(amount * 100) / 100 };
    })
    .sort((a, b) => b.amount - a.amount);

  const totalExpense = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // 月度趋势
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const mt = yearTxs.filter(t => t.date.startsWith(key));
    const income = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    months.push({ month: m, label: `${m}月`, income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100 });
  }

  res.json({
    year,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    byCategory,
    months,
  });
});

// ============= 导入 / 导出 =============

router.get('/export', (req, res) => {
  const data = exportUserData(req.userId!);
  res.setHeader('Content-Disposition', `attachment; filename="finance-export-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});

router.post('/import', (req, res) => {
  try {
    const { data, mode } = req.body || {};
    if (!data || typeof data !== 'object') return fail(res, 400, '导入数据格式不正确');
    const payload = {
      categories: Array.isArray(data.categories) ? data.categories : [],
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      budgets: Array.isArray(data.budgets) ? data.budgets : [],
    };
    if (mode === 'replace') {
      replaceAllForUser(req.userId!, payload);
    } else {
      mergeForUser(req.userId!, payload);
    }
    const counts = {
      categories: payload.categories.length,
      accounts: payload.accounts.length,
      transactions: payload.transactions.length,
      budgets: payload.budgets.length,
    };
    res.json({ success: true, mode: mode === 'replace' ? 'replace' : 'merge', counts });
  } catch (e: any) {
    fail(res, 500, e?.message || '导入失败');
  }
});

export default router;
