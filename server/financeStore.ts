import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient, type Collection } from 'mongodb';
import { hashPassword } from './crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 生产环境使用 /data 持久化磁盘（Render 等），开发环境使用项目目录
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const financePath = path.join(dataDir, 'finance.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 配置了 MONGODB_URI 时，数据落到 MongoDB（Render 免费实例磁盘会重置，必须外置）
const MONGODB_URI = process.env.MONGODB_URI || '';

// ============= 类型 =============

export type TxType = 'expense' | 'income' | 'transfer';
export type AccountType = 'cash' | 'card' | 'alipay' | 'wechat' | 'other';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TxType;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number; // 初始余额
  currency: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  categoryId: string;
  accountId: string | null;
  toAccountId?: string | null;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  /** 'all' 表示总预算；否则为某个分类 id */
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  year: number;
  month?: number; // 1-12，仅 monthly 使用
  createdAt: string;
}

interface FinanceDb {
  users: User[];
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
}

// ============= 读写 =============

const EMPTY_DB: FinanceDb = { users: [], categories: [], accounts: [], transactions: [], budgets: [] };

/** 内存缓存：读操作直接命中，写操作更新后异步落盘 */
let cache: FinanceDb = { ...EMPTY_DB };
let snapshotCol: Collection | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** 启动时调用：从 MongoDB 恢复数据；连不上则退回本地文件 */
export async function initStore(): Promise<void> {
  if (MONGODB_URI) {
    try {
      const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      await client.connect();
      snapshotCol = client.db('finance').collection('snapshot');
      const doc = await snapshotCol.findOne({ _id: 'main' as any });
      if (doc) {
        cache = {
          users: (doc.users as User[]) || [],
          categories: (doc.categories as Category[]) || [],
          accounts: (doc.accounts as Account[]) || [],
          transactions: (doc.transactions as Transaction[]) || [],
          budgets: (doc.budgets as Budget[]) || [],
        };
        console.log(`[store] MongoDB restored: ${cache.users.length} users / ${cache.transactions.length} txs`);
      } else {
        console.log('[store] MongoDB connected (empty)');
      }
      return;
    } catch (err) {
      console.error('[store] MongoDB init failed, fallback to local file:', err);
      snapshotCol = null;
    }
  }
  cache = readFile();
}

function readFile(): FinanceDb {
  try {
    if (fs.existsSync(financePath)) {
      return JSON.parse(fs.readFileSync(financePath, 'utf8')) as FinanceDb;
    }
  } catch {
    /* ignore */
  }
  return { ...EMPTY_DB };
}

function readDb(): FinanceDb {
  return cache;
}

function writeDb(db: FinanceDb): void {
  cache = db;
  schedulePersist();
}

/** 防抖：150ms 内的连续写合并成一次落盘 */
function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 150);
}

async function persistNow(): Promise<void> {
  try {
    fs.writeFileSync(financePath, JSON.stringify(cache, null, 2));
  } catch {
    /* ignore */
  }
  if (!snapshotCol) return;
  try {
    await snapshotCol.replaceOne({ _id: 'main' as any }, { _id: 'main' as any, ...cache } as any, { upsert: true });
  } catch (err) {
    console.error('[store] MongoDB persist failed:', err);
  }
}

// ============= 用户 =============

export function getUserByUsername(username: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.username === username);
}

export function getUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

export function createUser(username: string, password: string): User {
  const db = readDb();
  const user: User = {
    id: uuidv4(),
    username,
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

const DEFAULT_EXPENSE_CATS = [
  { name: '餐饮', color: '#F49AC1', icon: 'utensils' },
  { name: '交通', color: '#90CAF9', icon: 'car' },
  { name: '购物', color: '#B39DDB', icon: 'shopping-bag' },
  { name: '居家', color: '#80CBC4', icon: 'home' },
  { name: '娱乐', color: '#F8BBD0', icon: 'gamepad-2' },
  { name: '医疗', color: '#A5D6A7', icon: 'heart-pulse' },
  { name: '人情', color: '#C5CAE9', icon: 'gift' },
  { name: '其他', color: '#CFD8DC', icon: 'more-horizontal' },
];

const DEFAULT_INCOME_CATS = [
  { name: '工资', color: '#9CCC65', icon: 'wallet' },
  { name: '兼职', color: '#FFB74D', icon: 'briefcase' },
  { name: '理财', color: '#4DB6AC', icon: 'trending-up' },
  { name: '其他收入', color: '#9575CD', icon: 'plus-circle' },
];

const DEFAULT_ACCOUNTS = [
  { name: '现金', type: 'cash' as AccountType, color: '#F49AC1', icon: 'banknote' },
  { name: '银行卡', type: 'card' as AccountType, color: '#90CAF9', icon: 'credit-card' },
  { name: '支付宝', type: 'alipay' as AccountType, color: '#4DB6AC', icon: 'smartphone' },
  { name: '微信', type: 'wechat' as AccountType, color: '#A5D6A7', icon: 'message-circle' },
];

export function seedDefaults(userId: string): void {
  const db = readDb();
  const now = new Date().toISOString();

  if (!db.categories.some(c => c.userId === userId)) {
    let order = 0;
    DEFAULT_EXPENSE_CATS.forEach(c => {
      db.categories.push({
        id: uuidv4(), userId, name: c.name, type: 'expense',
        color: c.color, icon: c.icon, order: order++, createdAt: now,
      });
    });
    DEFAULT_INCOME_CATS.forEach(c => {
      db.categories.push({
        id: uuidv4(), userId, name: c.name, type: 'income',
        color: c.color, icon: c.icon, order: order++, createdAt: now,
      });
    });
  }

  if (!db.accounts.some(a => a.userId === userId)) {
    DEFAULT_ACCOUNTS.forEach(a => {
      db.accounts.push({
        id: uuidv4(), userId, name: a.name, type: a.type,
        initialBalance: 0, currency: 'CNY', icon: a.icon, color: a.color, createdAt: now,
      });
    });
  }

  writeDb(db);
}

// ============= 通用工具 =============

function ensureUserScope<T extends { userId: string }>(items: T[], userId: string): T[] {
  return items.filter(i => i.userId === userId);
}

// ============= 分类 =============

export function getCategories(userId: string): Category[] {
  const db = readDb();
  return ensureUserScope(db.categories, userId).sort((a, b) => a.order - b.order);
}

export function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'order'> & { order?: number }): Category {
  const db = readDb();
  const order = data.order ?? (getCategories(data.userId).length);
  const cat: Category = {
    id: uuidv4(), userId: data.userId, name: data.name, type: data.type,
    color: data.color, icon: data.icon, order, createdAt: new Date().toISOString(),
  };
  db.categories.push(cat);
  writeDb(db);
  return cat;
}

export function updateCategory(id: string, userId: string, updates: Partial<Category>): Category | null {
  const db = readDb();
  const idx = db.categories.findIndex(c => c.id === id && c.userId === userId);
  if (idx === -1) return null;
  db.categories[idx] = { ...db.categories[idx], ...updates, id, userId };
  writeDb(db);
  return db.categories[idx];
}

export function deleteCategory(id: string, userId: string): boolean {
  const db = readDb();
  const before = db.categories.length;
  db.categories = db.categories.filter(c => !(c.id === id && c.userId === userId));
  // 关联该分类的交易改为"未分类"占位（保留交易，不丢失金额）
  db.transactions = db.transactions.map(t =>
    t.userId === userId && t.categoryId === id ? { ...t, categoryId: '__uncategorized__' } : t,
  );
  writeDb(db);
  return db.categories.length < before;
}

// ============= 账户 =============

export function getAccounts(userId: string): Account[] {
  const db = readDb();
  return ensureUserScope(db.accounts, userId);
}

export function createAccount(data: Omit<Account, 'id' | 'createdAt'>): Account {
  const db = readDb();
  const acc: Account = {
    id: uuidv4(), userId: data.userId, name: data.name, type: data.type,
    initialBalance: data.initialBalance || 0, currency: data.currency || 'CNY',
    icon: data.icon, color: data.color, createdAt: new Date().toISOString(),
  };
  db.accounts.push(acc);
  writeDb(db);
  return acc;
}

export function updateAccount(id: string, userId: string, updates: Partial<Account>): Account | null {
  const db = readDb();
  const idx = db.accounts.findIndex(a => a.id === id && a.userId === userId);
  if (idx === -1) return null;
  db.accounts[idx] = { ...db.accounts[idx], ...updates, id, userId };
  writeDb(db);
  return db.accounts[idx];
}

export function deleteAccount(id: string, userId: string): boolean {
  const db = readDb();
  const before = db.accounts.length;
  db.accounts = db.accounts.filter(a => !(a.id === id && a.userId === userId));
  // 关联交易解除账户绑定，避免外键悬空
  db.transactions = db.transactions.map(t =>
    t.userId === userId && t.accountId === id ? { ...t, accountId: null } : t,
  );
  writeDb(db);
  return db.accounts.length < before;
}

/** 计算账户当前余额：初始余额 + 收入 - 支出 + 转入 - 转出 */
export function computeAccountBalance(account: Account, transactions: Transaction[]): number {
  const related = transactions.filter(t => t.accountId === account.id || t.toAccountId === account.id);
  const income = related.filter(t => t.type === 'income' && t.accountId === account.id).reduce((s, t) => s + t.amount, 0);
  const expense = related.filter(t => t.type === 'expense' && t.accountId === account.id).reduce((s, t) => s + t.amount, 0);
  const outTransfer = related.filter(t => t.type === 'transfer' && t.accountId === account.id).reduce((s, t) => s + t.amount, 0);
  const inTransfer = related.filter(t => t.type === 'transfer' && t.toAccountId === account.id).reduce((s, t) => s + t.amount, 0);
  return account.initialBalance + income - expense - outTransfer + inTransfer;
}

// ============= 交易 =============

export function getTransactions(userId: string): Transaction[] {
  const db = readDb();
  return ensureUserScope(db.transactions, userId).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getTransaction(id: string, userId: string): Transaction | null {
  const db = readDb();
  return db.transactions.find(t => t.id === id && t.userId === userId) || null;
}

export function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const db = readDb();
  const tx: Transaction = {
    id: uuidv4(), userId: data.userId, type: data.type, amount: data.amount,
    categoryId: data.categoryId, accountId: data.accountId ?? null,
    toAccountId: data.toAccountId ?? null,
    note: data.note || '', date: data.date, createdAt: new Date().toISOString(),
  };
  db.transactions.push(tx);
  writeDb(db);
  return tx;
}

export function updateTransaction(id: string, userId: string, updates: Partial<Transaction>): Transaction | null {
  const db = readDb();
  const idx = db.transactions.findIndex(t => t.id === id && t.userId === userId);
  if (idx === -1) return null;
  db.transactions[idx] = { ...db.transactions[idx], ...updates, id, userId };
  writeDb(db);
  return db.transactions[idx];
}

export function deleteTransaction(id: string, userId: string): boolean {
  const db = readDb();
  const before = db.transactions.length;
  db.transactions = db.transactions.filter(t => !(t.id === id && t.userId === userId));
  writeDb(db);
  return db.transactions.length < before;
}

export function replaceAllForUser(
  userId: string,
  data: { categories?: Category[]; accounts?: Account[]; transactions?: Transaction[]; budgets?: Budget[] },
): void {
  const db = readDb();
  const now = new Date().toISOString();
  const remap = (items: any[] = []) =>
    items.map(it => ({ ...it, id: uuidv4(), userId, createdAt: it.createdAt || now }));
  db.categories = [...db.categories.filter(c => c.userId !== userId), ...remap(data.categories)];
  db.accounts = [...db.accounts.filter(a => a.userId !== userId), ...remap(data.accounts)];
  db.transactions = [...db.transactions.filter(t => t.userId !== userId), ...remap(data.transactions)];
  db.budgets = [...db.budgets.filter(b => b.userId !== userId), ...remap(data.budgets)];
  writeDb(db);
}

export function mergeForUser(
  userId: string,
  data: { categories?: Category[]; accounts?: Account[]; transactions?: Transaction[]; budgets?: Budget[] },
): void {
  const db = readDb();
  const now = new Date().toISOString();
  const remap = (items: any[] = []) =>
    items.map(it => ({ ...it, id: uuidv4(), userId, createdAt: it.createdAt || now }));
  db.categories.push(...remap(data.categories));
  db.accounts.push(...remap(data.accounts));
  db.transactions.push(...remap(data.transactions));
  db.budgets.push(...remap(data.budgets));
  writeDb(db);
}

export function exportUserData(userId: string) {
  const db = readDb();
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

export function getBudgets(userId: string): Budget[] {
  const db = readDb();
  return ensureUserScope(db.budgets, userId);
}

export function upsertBudget(data: Omit<Budget, 'id' | 'createdAt'>): Budget {
  const db = readDb();
  const existing = db.budgets.find(b =>
    b.userId === data.userId && b.categoryId === data.categoryId &&
    b.period === data.period && b.year === data.year &&
    (data.period === 'yearly' || b.month === data.month),
  );
  if (existing) {
    existing.amount = data.amount;
    writeDb(db);
    return existing;
  }
  const budget: Budget = {
    id: uuidv4(), userId: data.userId, categoryId: data.categoryId,
    amount: data.amount, period: data.period, year: data.year, month: data.month,
    createdAt: new Date().toISOString(),
  };
  db.budgets.push(budget);
  writeDb(db);
  return budget;
}

export function deleteBudget(id: string, userId: string): boolean {
  const db = readDb();
  const before = db.budgets.length;
  db.budgets = db.budgets.filter(b => !(b.id === id && b.userId === userId));
  writeDb(db);
  return db.budgets.length < before;
}
