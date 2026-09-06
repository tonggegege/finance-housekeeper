import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const sessionsPath = path.join(dataDir, 'sessions.json');
const messagesPath = path.join(dataDir, 'messages.json');
const ledgerPath = path.join(dataDir, 'ledger.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readJson<T>(p: string, fallback: T): T {
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeJson(p: string, data: unknown) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// 类型定义
export interface DbSession {
  id: string;
  title: string;
  model: string;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
  tool_calls: string | null;
}

// ============= 会话操作 =============

export function getAllSessions(): DbSession[] {
  const sessions = readJson<DbSession[]>(sessionsPath, []);
  return sessions.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export function getSession(id: string): DbSession | undefined {
  const sessions = readJson<DbSession[]>(sessionsPath, []);
  return sessions.find(s => s.id === id);
}

export function createSession(session: DbSession): DbSession {
  const sessions = readJson<DbSession[]>(sessionsPath, []);
  sessions.push(session);
  writeJson(sessionsPath, sessions);
  return session;
}

export function updateSession(id: string, updates: Partial<Pick<DbSession, 'title' | 'model' | 'sdk_session_id'>>): boolean {
  const sessions = readJson<DbSession[]>(sessionsPath, []);
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return false;
  if (updates.title !== undefined) sessions[idx].title = updates.title;
  if (updates.model !== undefined) sessions[idx].model = updates.model;
  if (updates.sdk_session_id !== undefined) sessions[idx].sdk_session_id = updates.sdk_session_id;
  sessions[idx].updated_at = new Date().toISOString();
  writeJson(sessionsPath, sessions);
  return true;
}

export function deleteSession(id: string): boolean {
  let sessions = readJson<DbSession[]>(sessionsPath, []);
  const before = sessions.length;
  sessions = sessions.filter(s => s.id !== id);
  if (sessions.length === before) return false;
  writeJson(sessionsPath, sessions);
  // 级联删除消息
  let messages = readJson<DbMessage[]>(messagesPath, []);
  messages = messages.filter(m => m.session_id !== id);
  writeJson(messagesPath, messages);
  return true;
}

// ============= 消息操作 =============

export function getMessagesBySession(sessionId: string): DbMessage[] {
  const messages = readJson<DbMessage[]>(messagesPath, []);
  return messages
    .filter(m => m.session_id === sessionId)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export function createMessage(message: DbMessage): DbMessage {
  const messages = readJson<DbMessage[]>(messagesPath, []);
  messages.push(message);
  writeJson(messagesPath, messages);
  // 更新会话 updated_at
  const sessions = readJson<DbSession[]>(sessionsPath, []);
  const idx = sessions.findIndex(s => s.id === message.session_id);
  if (idx !== -1) {
    sessions[idx].updated_at = new Date().toISOString();
    writeJson(sessionsPath, sessions);
  }
  return message;
}

export function updateMessage(id: string, updates: Partial<Pick<DbMessage, 'content' | 'tool_calls'>>): boolean {
  const messages = readJson<DbMessage[]>(messagesPath, []);
  const idx = messages.findIndex(m => m.id === id);
  if (idx === -1) return false;
  if (updates.content !== undefined) messages[idx].content = updates.content;
  if (updates.tool_calls !== undefined) messages[idx].tool_calls = updates.tool_calls;
  writeJson(messagesPath, messages);
  return true;
}

export function deleteMessage(id: string): boolean {
  let messages = readJson<DbMessage[]>(messagesPath, []);
  const before = messages.length;
  messages = messages.filter(m => m.id !== id);
  if (messages.length === before) return false;
  writeJson(messagesPath, messages);
  return true;
}

export function createMessages(messages: DbMessage[]): void {
  const all = readJson<DbMessage[]>(messagesPath, []);
  all.push(...messages);
  writeJson(messagesPath, all);
}

// ============= 账本操作 =============

export function getLedger(): Record<string, unknown> | null {
  return readJson<Record<string, unknown> | null>(ledgerPath, null);
}

export function saveLedger(data: Record<string, unknown>): void {
  writeJson(ledgerPath, { ...data, updated_at: new Date().toISOString() });
}

// 清空所有数据
export function clearAllData(): void {
  writeJson(messagesPath, []);
  writeJson(sessionsPath, []);
}
