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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
var sessionsPath = path.join(dataDir, 'sessions.json');
var messagesPath = path.join(dataDir, 'messages.json');
var ledgerPath = path.join(dataDir, 'ledger.json');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
function readJson(p, fallback) {
    try {
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
    }
    catch (_a) {
        /* ignore */
    }
    return fallback;
}
function writeJson(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}
// ============= 会话操作 =============
export function getAllSessions() {
    var sessions = readJson(sessionsPath, []);
    return sessions.sort(function (a, b) { return (a.updated_at < b.updated_at ? 1 : -1); });
}
export function getSession(id) {
    var sessions = readJson(sessionsPath, []);
    return sessions.find(function (s) { return s.id === id; });
}
export function createSession(session) {
    var sessions = readJson(sessionsPath, []);
    sessions.push(session);
    writeJson(sessionsPath, sessions);
    return session;
}
export function updateSession(id, updates) {
    var sessions = readJson(sessionsPath, []);
    var idx = sessions.findIndex(function (s) { return s.id === id; });
    if (idx === -1)
        return false;
    if (updates.title !== undefined)
        sessions[idx].title = updates.title;
    if (updates.model !== undefined)
        sessions[idx].model = updates.model;
    if (updates.sdk_session_id !== undefined)
        sessions[idx].sdk_session_id = updates.sdk_session_id;
    sessions[idx].updated_at = new Date().toISOString();
    writeJson(sessionsPath, sessions);
    return true;
}
export function deleteSession(id) {
    var sessions = readJson(sessionsPath, []);
    var before = sessions.length;
    sessions = sessions.filter(function (s) { return s.id !== id; });
    if (sessions.length === before)
        return false;
    writeJson(sessionsPath, sessions);
    // 级联删除消息
    var messages = readJson(messagesPath, []);
    messages = messages.filter(function (m) { return m.session_id !== id; });
    writeJson(messagesPath, messages);
    return true;
}
// ============= 消息操作 =============
export function getMessagesBySession(sessionId) {
    var messages = readJson(messagesPath, []);
    return messages
        .filter(function (m) { return m.session_id === sessionId; })
        .sort(function (a, b) { return (a.created_at < b.created_at ? -1 : 1); });
}
export function createMessage(message) {
    var messages = readJson(messagesPath, []);
    messages.push(message);
    writeJson(messagesPath, messages);
    // 更新会话 updated_at
    var sessions = readJson(sessionsPath, []);
    var idx = sessions.findIndex(function (s) { return s.id === message.session_id; });
    if (idx !== -1) {
        sessions[idx].updated_at = new Date().toISOString();
        writeJson(sessionsPath, sessions);
    }
    return message;
}
export function updateMessage(id, updates) {
    var messages = readJson(messagesPath, []);
    var idx = messages.findIndex(function (m) { return m.id === id; });
    if (idx === -1)
        return false;
    if (updates.content !== undefined)
        messages[idx].content = updates.content;
    if (updates.tool_calls !== undefined)
        messages[idx].tool_calls = updates.tool_calls;
    writeJson(messagesPath, messages);
    return true;
}
export function deleteMessage(id) {
    var messages = readJson(messagesPath, []);
    var before = messages.length;
    messages = messages.filter(function (m) { return m.id !== id; });
    if (messages.length === before)
        return false;
    writeJson(messagesPath, messages);
    return true;
}
export function createMessages(messages) {
    var all = readJson(messagesPath, []);
    all.push.apply(all, messages);
    writeJson(messagesPath, all);
}
// ============= 账本操作 =============
export function getLedger() {
    return readJson(ledgerPath, null);
}
export function saveLedger(data) {
    writeJson(ledgerPath, __assign(__assign({}, data), { updated_at: new Date().toISOString() }));
}
// 清空所有数据
export function clearAllData() {
    writeJson(messagesPath, []);
    writeJson(sessionsPath, []);
}
