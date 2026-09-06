var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { Router } from 'express';
import { authMiddleware, signToken, } from './auth.js';
import { verifyPassword } from './crypto.js';
import { createUser, getUserByUsername, getCategories, createCategory, updateCategory, deleteCategory, getAccounts, createAccount, updateAccount, deleteAccount, computeAccountBalance, getTransactions, createTransaction, updateTransaction, deleteTransaction, getBudgets, upsertBudget, deleteBudget, exportUserData, replaceAllForUser, mergeForUser, } from './financeStore.js';
var router = Router();
// 统一错误返回
function fail(res, code, msg) {
    return res.status(code).json({ error: msg });
}
// 当前月份 YYYY-MM
function thisMonth() {
    var d = new Date();
    return "".concat(d.getFullYear(), "-").concat(String(d.getMonth() + 1).padStart(2, '0'));
}
// ============= 认证 =============
router.post('/auth/register', function (req, res) {
    try {
        var _a = req.body || {}, username = _a.username, password = _a.password;
        if (!username || !password)
            return fail(res, 400, '用户名和密码不能为空');
        if (String(password).length < 4)
            return fail(res, 400, '密码至少 4 位');
        if (getUserByUsername(String(username)))
            return fail(res, 409, '该用户名已被注册');
        var user = createUser(String(username), String(password));
        var token = signToken({ userId: user.id, username: user.username });
        res.json({ token: token, user: { id: user.id, username: user.username } });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '注册失败');
    }
});
router.post('/auth/login', function (req, res) {
    try {
        var _a = req.body || {}, username = _a.username, password = _a.password;
        var user = getUserByUsername(String(username));
        if (!user || !verifyPassword(String(password), user.passwordHash)) {
            return fail(res, 401, '用户名或密码错误');
        }
        var token = signToken({ userId: user.id, username: user.username });
        res.json({ token: token, user: { id: user.id, username: user.username } });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '登录失败');
    }
});
router.get('/auth/me', authMiddleware, function (req, res) {
    res.json({ id: req.userId, username: req.username });
});
// 以下所有路由都需要鉴权
router.use(authMiddleware);
// ============= 分类 =============
router.get('/categories', function (req, res) {
    res.json({ categories: getCategories(req.userId) });
});
router.post('/categories', function (req, res) {
    try {
        var _a = req.body || {}, name_1 = _a.name, type = _a.type, color = _a.color, icon = _a.icon;
        if (!name_1)
            return fail(res, 400, '分类名称不能为空');
        var cat = createCategory({
            userId: req.userId,
            name: String(name_1),
            type: (type === 'income' ? 'income' : 'expense'),
            color: color || '#B39DDB',
            icon: icon || 'tag',
        });
        res.json({ category: cat });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '创建分类失败');
    }
});
router.put('/categories/:id', function (req, res) {
    var updated = updateCategory(req.params.id, req.userId, req.body || {});
    if (!updated)
        return fail(res, 404, '分类不存在');
    res.json({ category: updated });
});
router.delete('/categories/:id', function (req, res) {
    var ok = deleteCategory(req.params.id, req.userId);
    if (!ok)
        return fail(res, 404, '分类不存在');
    res.json({ success: true });
});
// ============= 账户 =============
router.get('/accounts', function (req, res) {
    var accounts = getAccounts(req.userId);
    var txs = getTransactions(req.userId);
    var withBalance = accounts.map(function (a) { return (__assign(__assign({}, a), { balance: computeAccountBalance(a, txs) })); });
    var totalAssets = withBalance.reduce(function (s, a) { return s + a.balance; }, 0);
    res.json({ accounts: withBalance, totalAssets: totalAssets });
});
router.post('/accounts', function (req, res) {
    try {
        var _a = req.body || {}, name_2 = _a.name, type = _a.type, initialBalance = _a.initialBalance, currency = _a.currency, icon = _a.icon, color = _a.color;
        if (!name_2)
            return fail(res, 400, '账户名称不能为空');
        var acc = createAccount({
            userId: req.userId,
            name: String(name_2),
            type: (type || 'cash'),
            initialBalance: Number(initialBalance) || 0,
            currency: currency || 'CNY',
            icon: icon || 'wallet',
            color: color || '#90CAF9',
        });
        res.json({ account: __assign(__assign({}, acc), { balance: acc.initialBalance }) });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '创建账户失败');
    }
});
router.put('/accounts/:id', function (req, res) {
    var updated = updateAccount(req.params.id, req.userId, req.body || {});
    if (!updated)
        return fail(res, 404, '账户不存在');
    var txs = getTransactions(req.userId);
    res.json({ account: __assign(__assign({}, updated), { balance: computeAccountBalance(updated, txs) }) });
});
router.delete('/accounts/:id', function (req, res) {
    var ok = deleteAccount(req.params.id, req.userId);
    if (!ok)
        return fail(res, 404, '账户不存在');
    res.json({ success: true });
});
// ============= 交易 =============
function parseDate(s) {
    // 接受 YYYY-MM-DD 或 YYYY-M-D
    var d = new Date(s);
    if (isNaN(d.getTime()))
        return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
}
router.get('/transactions', function (req, res) {
    var _a = req.query, month = _a.month, type = _a.type;
    var txs = getTransactions(req.userId);
    if (month)
        txs = txs.filter(function (t) { return t.date.startsWith(String(month)); });
    if (type)
        txs = txs.filter(function (t) { return t.type === type; });
    res.json({ transactions: txs });
});
router.post('/transactions', function (req, res) {
    try {
        var _a = req.body || {}, type = _a.type, amount = _a.amount, categoryId = _a.categoryId, accountId = _a.accountId, note = _a.note, date = _a.date;
        if (!amount || Number(amount) <= 0)
            return fail(res, 400, '金额必须大于 0');
        if (!categoryId)
            return fail(res, 400, '请选择分类');
        var tx = createTransaction({
            userId: req.userId,
            type: (type === 'income' ? 'income' : 'expense'),
            amount: Number(amount),
            categoryId: String(categoryId),
            accountId: accountId || null,
            note: note || '',
            date: date ? parseDate(String(date)) : new Date().toISOString().slice(0, 10),
        });
        res.json({ transaction: tx });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '添加交易失败');
    }
});
router.post('/transactions/transfer', function (req, res) {
    try {
        var _a = req.body || {}, amount = _a.amount, fromAccountId_1 = _a.fromAccountId, toAccountId_1 = _a.toAccountId, date = _a.date, note = _a.note;
        if (!amount || Number(amount) <= 0)
            return fail(res, 400, '金额必须大于 0');
        if (!fromAccountId_1 || !toAccountId_1)
            return fail(res, 400, '请选择转出和转入账户');
        if (fromAccountId_1 === toAccountId_1)
            return fail(res, 400, '转出和转入账户不能相同');
        var userAccounts = getAccounts(req.userId);
        var fromAcc = userAccounts.find(function (a) { return a.id === fromAccountId_1; });
        var toAcc = userAccounts.find(function (a) { return a.id === toAccountId_1; });
        if (!fromAcc || !toAcc)
            return fail(res, 400, '账户不存在');
        var tx = createTransaction({
            userId: req.userId,
            type: 'transfer',
            amount: Number(amount),
            categoryId: '__transfer__',
            accountId: String(fromAccountId_1),
            toAccountId: String(toAccountId_1),
            note: note || "".concat(fromAcc.name, " \u2192 ").concat(toAcc.name),
            date: date ? parseDate(String(date)) : new Date().toISOString().slice(0, 10),
        });
        res.json({ transaction: tx });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '转账失败');
    }
});
router.put('/transactions/:id', function (req, res) {
    var updates = __assign({}, (req.body || {}));
    if (updates.amount !== undefined)
        updates.amount = Number(updates.amount);
    if (updates.date)
        updates.date = parseDate(String(updates.date));
    if (updates.type)
        updates.type = updates.type === 'income' ? 'income' : updates.type === 'transfer' ? 'transfer' : 'expense';
    var updated = updateTransaction(req.params.id, req.userId, updates);
    if (!updated)
        return fail(res, 404, '交易不存在');
    res.json({ transaction: updated });
});
router.delete('/transactions/:id', function (req, res) {
    var ok = deleteTransaction(req.params.id, req.userId);
    if (!ok)
        return fail(res, 404, '交易不存在');
    res.json({ success: true });
});
// ============= 预算 =============
router.get('/budgets', function (req, res) {
    var _a = req.query, year = _a.year, month = _a.month;
    var budgets = getBudgets(req.userId);
    if (year)
        budgets = budgets.filter(function (b) { return b.year === Number(year); });
    if (month)
        budgets = budgets.filter(function (b) { return b.month === Number(month); });
    res.json({ budgets: budgets });
});
router.post('/budgets', function (req, res) {
    try {
        var _a = req.body || {}, categoryId = _a.categoryId, amount = _a.amount, period = _a.period, year = _a.year, month = _a.month;
        if (!amount || Number(amount) <= 0)
            return fail(res, 400, '预算金额必须大于 0');
        var budget = upsertBudget({
            userId: req.userId,
            categoryId: String(categoryId || 'all'),
            amount: Number(amount),
            period: period === 'yearly' ? 'yearly' : 'monthly',
            year: Number(year) || new Date().getFullYear(),
            month: month ? Number(month) : undefined,
        });
        res.json({ budget: budget });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '保存预算失败');
    }
});
router.delete('/budgets/:id', function (req, res) {
    var ok = deleteBudget(req.params.id, req.userId);
    if (!ok)
        return fail(res, 404, '预算不存在');
    res.json({ success: true });
});
// ============= 统计 =============
function buildSummary(userId, month) {
    var txs = getTransactions(userId);
    var categories = getCategories(userId);
    var accounts = getAccounts(userId);
    var budgets = getBudgets(userId);
    var monthTxs = txs.filter(function (t) { return t.date.startsWith(month); });
    var income = monthTxs.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var expense = monthTxs.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var net = income - expense;
    // 账户总资产的合计（基于全部交易，而非仅当月）
    var accountsWithBalance = accounts.map(function (a) { return (__assign(__assign({}, a), { balance: computeAccountBalance(a, txs) })); });
    var totalAssets = accountsWithBalance.reduce(function (s, a) { return s + a.balance; }, 0);
    // 分类占比（支出）
    var catMap = new Map(categories.map(function (c) { return [c.id, c]; }));
    var byCatAgg = new Map();
    monthTxs.filter(function (t) { return t.type === 'expense'; }).forEach(function (t) {
        byCatAgg.set(t.categoryId, (byCatAgg.get(t.categoryId) || 0) + t.amount);
    });
    var byCategory = Array.from(byCatAgg.entries())
        .map(function (_a) {
        var cid = _a[0], amount = _a[1];
        var c = catMap.get(cid);
        return {
            categoryId: cid,
            name: c ? c.name : (cid === '__uncategorized__' ? '未分类' : '已删除分类'),
            color: c ? c.color : '#CFD8DC',
            amount: amount,
        };
    })
        .sort(function (a, b) { return b.amount - a.amount; })
        .map(function (c) { return (__assign(__assign({}, c), { percent: expense > 0 ? Math.round((c.amount / expense) * 1000) / 10 : 0 })); });
    // 当月总预算
    var _a = month.split('-').map(Number), y = _a[0], m = _a[1];
    var monthlyBudget = budgets.find(function (b) { return b.period === 'monthly' && b.categoryId === 'all' && b.year === y && b.month === m; });
    var budgetTotal = monthlyBudget ? monthlyBudget.amount : 0;
    var budgetRemaining = budgetTotal - expense;
    // 每日平均与剩余天数
    var now = new Date();
    var curY = now.getFullYear();
    var curM = now.getMonth() + 1;
    var isCurrentMonth = curY === y && curM === m;
    var daysInMonth = new Date(y, m, 0).getDate();
    var dayOfMonth = isCurrentMonth ? now.getDate() : daysInMonth;
    var daysLeft = isCurrentMonth ? Math.max(daysInMonth - now.getDate(), 0) : 0;
    var dailyAvg = dayOfMonth > 0 ? expense / dayOfMonth : 0;
    var dailyBudget = daysLeft > 0 && budgetRemaining > 0 ? budgetRemaining / daysLeft : 0;
    return {
        month: month,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        net: Math.round(net * 100) / 100,
        totalAssets: Math.round(totalAssets * 100) / 100,
        budgetTotal: Math.round(budgetTotal * 100) / 100,
        budgetRemaining: Math.round(budgetRemaining * 100) / 100,
        byCategory: byCategory,
        accounts: accountsWithBalance.map(function (a) { return ({ id: a.id, name: a.name, type: a.type, balance: Math.round(a.balance * 100) / 100, color: a.color }); }),
        daysInMonth: daysInMonth,
        daysLeft: daysLeft,
        dailyAvg: Math.round(dailyAvg * 100) / 100,
        dailyBudget: Math.round(dailyBudget * 100) / 100,
    };
}
router.get('/stats/summary', function (req, res) {
    var month = req.query.month || thisMonth();
    res.json({ summary: buildSummary(req.userId, month) });
});
router.get('/stats/monthly', function (req, res) {
    var year = Number(req.query.year) || new Date().getFullYear();
    var txs = getTransactions(req.userId);
    var months = [];
    var _loop_1 = function (m) {
        var key = "".concat(year, "-").concat(String(m).padStart(2, '0'));
        var mt = txs.filter(function (t) { return t.date.startsWith(key); });
        var income = mt.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
        var expense = mt.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
        months.push({ month: m, label: "".concat(m, "\u6708"), income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100, net: Math.round((income - expense) * 100) / 100 });
    };
    for (var m = 1; m <= 12; m++) {
        _loop_1(m);
    }
    res.json({ year: year, months: months });
});
router.get('/stats/yearly', function (req, res) {
    var year = Number(req.query.year) || new Date().getFullYear();
    var txs = getTransactions(req.userId);
    var categories = getCategories(req.userId);
    var yearTxs = txs.filter(function (t) { return t.date.startsWith(String(year)); });
    // 分类年度支出
    var catMap = new Map(categories.map(function (c) { return [c.id, c]; }));
    var byCatAgg = new Map();
    yearTxs.filter(function (t) { return t.type === 'expense'; }).forEach(function (t) {
        byCatAgg.set(t.categoryId, (byCatAgg.get(t.categoryId) || 0) + t.amount);
    });
    var byCategory = Array.from(byCatAgg.entries())
        .map(function (_a) {
        var cid = _a[0], amount = _a[1];
        var c = catMap.get(cid);
        return { categoryId: cid, name: c ? c.name : '已删除分类', color: c ? c.color : '#CFD8DC', amount: Math.round(amount * 100) / 100 };
    })
        .sort(function (a, b) { return b.amount - a.amount; });
    var totalExpense = yearTxs.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var totalIncome = yearTxs.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    // 月度趋势
    var months = [];
    var _loop_2 = function (m) {
        var key = "".concat(year, "-").concat(String(m).padStart(2, '0'));
        var mt = yearTxs.filter(function (t) { return t.date.startsWith(key); });
        var income = mt.filter(function (t) { return t.type === 'income'; }).reduce(function (s, t) { return s + t.amount; }, 0);
        var expense = mt.filter(function (t) { return t.type === 'expense'; }).reduce(function (s, t) { return s + t.amount; }, 0);
        months.push({ month: m, label: "".concat(m, "\u6708"), income: Math.round(income * 100) / 100, expense: Math.round(expense * 100) / 100 });
    };
    for (var m = 1; m <= 12; m++) {
        _loop_2(m);
    }
    res.json({
        year: year,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        byCategory: byCategory,
        months: months,
    });
});
// ============= 导入 / 导出 =============
router.get('/export', function (req, res) {
    var data = exportUserData(req.userId);
    res.setHeader('Content-Disposition', "attachment; filename=\"finance-export-".concat(Date.now(), ".json\""));
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
});
router.post('/import', function (req, res) {
    try {
        var _a = req.body || {}, data = _a.data, mode = _a.mode;
        if (!data || typeof data !== 'object')
            return fail(res, 400, '导入数据格式不正确');
        var payload = {
            categories: Array.isArray(data.categories) ? data.categories : [],
            accounts: Array.isArray(data.accounts) ? data.accounts : [],
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
            budgets: Array.isArray(data.budgets) ? data.budgets : [],
        };
        if (mode === 'replace') {
            replaceAllForUser(req.userId, payload);
        }
        else {
            mergeForUser(req.userId, payload);
        }
        var counts = {
            categories: payload.categories.length,
            accounts: payload.accounts.length,
            transactions: payload.transactions.length,
            budgets: payload.budgets.length,
        };
        res.json({ success: true, mode: mode === 'replace' ? 'replace' : 'merge', counts: counts });
    }
    catch (e) {
        fail(res, 500, (e === null || e === void 0 ? void 0 : e.message) || '导入失败');
    }
});
export default router;
