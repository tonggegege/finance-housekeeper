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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from './crypto.js';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
// 生产环境使用 /data 持久化磁盘（Render 等），开发环境使用项目目录
var dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
var financePath = path.join(dataDir, 'finance.json');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
// ============= 读写 =============
function readDb() {
    try {
        if (fs.existsSync(financePath)) {
            return JSON.parse(fs.readFileSync(financePath, 'utf8'));
        }
    }
    catch (_a) {
        /* ignore */
    }
    return { users: [], categories: [], accounts: [], transactions: [], budgets: [] };
}
function writeDb(db) {
    fs.writeFileSync(financePath, JSON.stringify(db, null, 2));
}
// ============= 用户 =============
export function getUserByUsername(username) {
    var db = readDb();
    return db.users.find(function (u) { return u.username === username; });
}
export function getUserById(id) {
    var db = readDb();
    return db.users.find(function (u) { return u.id === id; });
}
export function createUser(username, password) {
    var db = readDb();
    var user = {
        id: uuidv4(),
        username: username,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    writeDb(db);
    // 新用户种子数据
    seedDefaults(user.id);
    return user;
}
// ============= 默认种子 =============
var DEFAULT_EXPENSE_CATS = [
    { name: '餐饮', color: '#F49AC1', icon: 'utensils' },
    { name: '交通', color: '#90CAF9', icon: 'car' },
    { name: '购物', color: '#B39DDB', icon: 'shopping-bag' },
    { name: '居家', color: '#80CBC4', icon: 'home' },
    { name: '娱乐', color: '#F8BBD0', icon: 'gamepad-2' },
    { name: '医疗', color: '#A5D6A7', icon: 'heart-pulse' },
    { name: '人情', color: '#C5CAE9', icon: 'gift' },
    { name: '其他', color: '#CFD8DC', icon: 'more-horizontal' },
];
var DEFAULT_INCOME_CATS = [
    { name: '工资', color: '#9CCC65', icon: 'wallet' },
    { name: '兼职', color: '#FFB74D', icon: 'briefcase' },
    { name: '理财', color: '#4DB6AC', icon: 'trending-up' },
    { name: '其他收入', color: '#9575CD', icon: 'plus-circle' },
];
var DEFAULT_ACCOUNTS = [
    { name: '现金', type: 'cash', color: '#F49AC1', icon: 'banknote' },
    { name: '银行卡', type: 'card', color: '#90CAF9', icon: 'credit-card' },
    { name: '支付宝', type: 'alipay', color: '#4DB6AC', icon: 'smartphone' },
    { name: '微信', type: 'wechat', color: '#A5D6A7', icon: 'message-circle' },
];
export function seedDefaults(userId) {
    var db = readDb();
    var now = new Date().toISOString();
    if (!db.categories.some(function (c) { return c.userId === userId; })) {
        var order_1 = 0;
        DEFAULT_EXPENSE_CATS.forEach(function (c) {
            db.categories.push({
                id: uuidv4(),
                userId: userId,
                name: c.name, type: 'expense',
                color: c.color, icon: c.icon, order: order_1++, createdAt: now,
            });
        });
        DEFAULT_INCOME_CATS.forEach(function (c) {
            db.categories.push({
                id: uuidv4(),
                userId: userId,
                name: c.name, type: 'income',
                color: c.color, icon: c.icon, order: order_1++, createdAt: now,
            });
        });
    }
    if (!db.accounts.some(function (a) { return a.userId === userId; })) {
        DEFAULT_ACCOUNTS.forEach(function (a) {
            db.accounts.push({
                id: uuidv4(),
                userId: userId,
                name: a.name, type: a.type,
                initialBalance: 0, currency: 'CNY', icon: a.icon, color: a.color, createdAt: now,
            });
        });
    }
    writeDb(db);
}
// ============= 通用工具 =============
function ensureUserScope(items, userId) {
    return items.filter(function (i) { return i.userId === userId; });
}
// ============= 分类 =============
export function getCategories(userId) {
    var db = readDb();
    return ensureUserScope(db.categories, userId).sort(function (a, b) { return a.order - b.order; });
}
export function createCategory(data) {
    var _a;
    var db = readDb();
    var order = (_a = data.order) !== null && _a !== void 0 ? _a : (getCategories(data.userId).length);
    var cat = {
        id: uuidv4(), userId: data.userId, name: data.name, type: data.type,
        color: data.color, icon: data.icon,
        order: order,
        createdAt: new Date().toISOString(),
    };
    db.categories.push(cat);
    writeDb(db);
    return cat;
}
export function updateCategory(id, userId, updates) {
    var db = readDb();
    var idx = db.categories.findIndex(function (c) { return c.id === id && c.userId === userId; });
    if (idx === -1)
        return null;
    db.categories[idx] = __assign(__assign(__assign({}, db.categories[idx]), updates), { id: id, userId: userId });
    writeDb(db);
    return db.categories[idx];
}
export function deleteCategory(id, userId) {
    var db = readDb();
    var before = db.categories.length;
    db.categories = db.categories.filter(function (c) { return !(c.id === id && c.userId === userId); });
    // 关联该分类的交易改为"未分类"占位（保留交易，不丢失金额）
    db.transactions = db.transactions.map(function (t) {
        return t.userId === userId && t.categoryId === id ? __assign(__assign({}, t), { categoryId: '__uncategorized__' }) : t;
    });
    writeDb(db);
    return db.categories.length < before;
}
// ============= 账户 =============
export function getAccounts(userId) {
    var db = readDb();
    return ensureUserScope(db.accounts, userId);
}
export function createAccount(data) {
    var db = readDb();
    var acc = {
        id: uuidv4(), userId: data.userId, name: data.name, type: data.type,
        initialBalance: data.initialBalance || 0, currency: data.currency || 'CNY',
        icon: data.icon, color: data.color, createdAt: new Date().toISOString(),
    };
    db.accounts.push(acc);
    writeDb(db);
    return acc;
}
export function updateAccount(id, userId, updates) {
    var db = readDb();
    var idx = db.accounts.findIndex(function (a) { return a.id === id && a.userId === userId; });
    if (idx === -1)
        return null;
    db.accounts[idx] = __assign(__assign(__assign({}, db.accounts[idx]), updates), { id: id, userId: userId });
    writeDb(db);
    return db.accounts[idx];
}
export function deleteAccount(id, userId) {
    var db = readDb();
    var before = db.accounts.length;
    db.accounts = db.accounts.filter(function (a) { return !(a.id === id && a.userId === userId); });
    // 关联交易解除账户绑定，避免外键悬空
    db.transactions = db.transactions.map(function (t) {
        return t.userId === userId && t.accountId === id ? __assign(__assign({}, t), { accountId: null }) : t;
    });
    writeDb(db);
    return db.accounts.length < before;
}
/** 计算账户当前余额：初始余额 + 收入 - 支出 + 转入 - 转出 */
export function computeAccountBalance(account, transactions) {
    var related = transactions.filter(function (t) { return t.accountId === account.id || t.toAccountId === account.id; });
    var income = related.filter(function (t) { return t.type === 'income' && t.accountId === account.id; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var expense = related.filter(function (t) { return t.type === 'expense' && t.accountId === account.id; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var outTransfer = related.filter(function (t) { return t.type === 'transfer' && t.accountId === account.id; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var inTransfer = related.filter(function (t) { return t.type === 'transfer' && t.toAccountId === account.id; }).reduce(function (s, t) { return s + t.amount; }, 0);
    return account.initialBalance + income - expense - outTransfer + inTransfer;
}
// ============= 交易 =============
export function getTransactions(userId) {
    var db = readDb();
    return ensureUserScope(db.transactions, userId).sort(function (a, b) { return (a.date < b.date ? 1 : a.date > b.date ? -1 : 0); });
}
export function getTransaction(id, userId) {
    var db = readDb();
    return db.transactions.find(function (t) { return t.id === id && t.userId === userId; }) || null;
}
export function createTransaction(data) {
    var _a, _b;
    var db = readDb();
    var tx = {
        id: uuidv4(), userId: data.userId, type: data.type, amount: data.amount,
        categoryId: data.categoryId, accountId: (_a = data.accountId) !== null && _a !== void 0 ? _a : null,
        toAccountId: (_b = data.toAccountId) !== null && _b !== void 0 ? _b : null,
        note: data.note || '', date: data.date, createdAt: new Date().toISOString(),
    };
    db.transactions.push(tx);
    writeDb(db);
    return tx;
}
export function updateTransaction(id, userId, updates) {
    var db = readDb();
    var idx = db.transactions.findIndex(function (t) { return t.id === id && t.userId === userId; });
    if (idx === -1)
        return null;
    db.transactions[idx] = __assign(__assign(__assign({}, db.transactions[idx]), updates), { id: id, userId: userId });
    writeDb(db);
    return db.transactions[idx];
}
export function deleteTransaction(id, userId) {
    var db = readDb();
    var before = db.transactions.length;
    db.transactions = db.transactions.filter(function (t) { return !(t.id === id && t.userId === userId); });
    writeDb(db);
    return db.transactions.length < before;
}
export function replaceAllForUser(userId, data) {
    var db = readDb();
    var now = new Date().toISOString();
    var remap = function (items) {
        if (items === void 0) { items = []; }
        return items.map(function (it) { return (__assign(__assign({}, it), { id: uuidv4(), userId: userId, createdAt: it.createdAt || now })); });
    };
    db.categories = __spreadArray(__spreadArray([], db.categories.filter(function (c) { return c.userId !== userId; }), true), remap(data.categories), true);
    db.accounts = __spreadArray(__spreadArray([], db.accounts.filter(function (a) { return a.userId !== userId; }), true), remap(data.accounts), true);
    db.transactions = __spreadArray(__spreadArray([], db.transactions.filter(function (t) { return t.userId !== userId; }), true), remap(data.transactions), true);
    db.budgets = __spreadArray(__spreadArray([], db.budgets.filter(function (b) { return b.userId !== userId; }), true), remap(data.budgets), true);
    writeDb(db);
}
export function mergeForUser(userId, data) {
    var _a, _b, _c, _d;
    var db = readDb();
    var now = new Date().toISOString();
    var remap = function (items) {
        if (items === void 0) { items = []; }
        return items.map(function (it) { return (__assign(__assign({}, it), { id: uuidv4(), userId: userId, createdAt: it.createdAt || now })); });
    };
    (_a = db.categories).push.apply(_a, remap(data.categories));
    (_b = db.accounts).push.apply(_b, remap(data.accounts));
    (_c = db.transactions).push.apply(_c, remap(data.transactions));
    (_d = db.budgets).push.apply(_d, remap(data.budgets));
    writeDb(db);
}
export function exportUserData(userId) {
    var db = readDb();
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        categories: ensureUserScope(db.categories, userId),
        accounts: ensureUserScope(db.accounts, userId),
        transactions: ensureUserScope(db.transactions, userId),
        budgets: ensureUserScope(db.budgets, userId),
    };
}
// ============= 预算 =============
export function getBudgets(userId) {
    var db = readDb();
    return ensureUserScope(db.budgets, userId);
}
export function upsertBudget(data) {
    var db = readDb();
    var existing = db.budgets.find(function (b) {
        return b.userId === data.userId && b.categoryId === data.categoryId &&
            b.period === data.period && b.year === data.year &&
            (data.period === 'yearly' || b.month === data.month);
    });
    if (existing) {
        existing.amount = data.amount;
        writeDb(db);
        return existing;
    }
    var budget = {
        id: uuidv4(), userId: data.userId, categoryId: data.categoryId,
        amount: data.amount, period: data.period, year: data.year, month: data.month,
        createdAt: new Date().toISOString(),
    };
    db.budgets.push(budget);
    writeDb(db);
    return budget;
}
export function deleteBudget(id, userId) {
    var db = readDb();
    var before = db.budgets.length;
    db.budgets = db.budgets.filter(function (b) { return !(b.id === id && b.userId === userId); });
    writeDb(db);
    return db.budgets.length < before;
}
