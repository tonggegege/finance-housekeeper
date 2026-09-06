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
    initialBalance: number;
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
    date: string;
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
    month?: number;
    createdAt: string;
}
export declare function getUserByUsername(username: string): User | undefined;
export declare function getUserById(id: string): User | undefined;
export declare function createUser(username: string, password: string): User;
export declare function seedDefaults(userId: string): void;
export declare function getCategories(userId: string): Category[];
export declare function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'order'> & {
    order?: number;
}): Category;
export declare function updateCategory(id: string, userId: string, updates: Partial<Category>): Category | null;
export declare function deleteCategory(id: string, userId: string): boolean;
export declare function getAccounts(userId: string): Account[];
export declare function createAccount(data: Omit<Account, 'id' | 'createdAt'>): Account;
export declare function updateAccount(id: string, userId: string, updates: Partial<Account>): Account | null;
export declare function deleteAccount(id: string, userId: string): boolean;
/** 计算账户当前余额：初始余额 + 收入 - 支出 + 转入 - 转出 */
export declare function computeAccountBalance(account: Account, transactions: Transaction[]): number;
export declare function getTransactions(userId: string): Transaction[];
export declare function getTransaction(id: string, userId: string): Transaction | null;
export declare function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction;
export declare function updateTransaction(id: string, userId: string, updates: Partial<Transaction>): Transaction | null;
export declare function deleteTransaction(id: string, userId: string): boolean;
export declare function replaceAllForUser(userId: string, data: {
    categories?: Category[];
    accounts?: Account[];
    transactions?: Transaction[];
    budgets?: Budget[];
}): void;
export declare function mergeForUser(userId: string, data: {
    categories?: Category[];
    accounts?: Account[];
    transactions?: Transaction[];
    budgets?: Budget[];
}): void;
export declare function exportUserData(userId: string): {
    version: number;
    exportedAt: string;
    categories: Category[];
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
};
export declare function getBudgets(userId: string): Budget[];
export declare function upsertBudget(data: Omit<Budget, 'id' | 'createdAt'>): Budget;
export declare function deleteBudget(id: string, userId: string): boolean;
