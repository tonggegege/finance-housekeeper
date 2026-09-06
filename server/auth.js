import jwt from 'jsonwebtoken';
import { getUserById } from './financeStore.js';
// 开发环境使用一个固定密钥；生产环境应通过环境变量覆盖
var JWT_SECRET = process.env.JWT_SECRET || 'finance-housekeeper-dev-secret';
var TOKEN_TTL = '30d';
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (_a) {
        return null;
    }
}
/** 鉴权中间件：从 Authorization: Bearer <token> 解析用户 */
export function authMiddleware(req, res, next) {
    var header = req.headers.authorization || '';
    var token = header.startsWith('Bearer ') ? header.slice(7) : '';
    var payload = token ? verifyToken(token) : null;
    if (!payload) {
        return res.status(401).json({ error: '未登录或登录已过期' });
    }
    // 二次校验用户是否仍存在
    var user = getUserById(payload.userId);
    if (!user) {
        return res.status(401).json({ error: '账号不存在' });
    }
    req.userId = user.id;
    req.username = user.username;
    next();
}
/** 在响应里取当前用户 id（需放在 authMiddleware 之后） */
export function requireUserId(req) {
    if (!req.userId)
        throw new Error('缺少用户身份');
    return req.userId;
}
