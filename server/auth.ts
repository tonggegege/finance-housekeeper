import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getUserByUsername, getUserById } from './financeStore.js';
import { hashPassword, verifyPassword } from './crypto.js';

// 开发环境使用一个固定密钥；生产环境应通过环境变量覆盖
const JWT_SECRET = process.env.JWT_SECRET || 'finance-housekeeper-dev-secret';
const TOKEN_TTL = '30d';

export interface JwtPayload {
  userId: string;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Express 局部声明，挂载 userId / username
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      username?: string;
    }
  }
}

/** 鉴权中间件：从 Authorization: Bearer <token> 解析用户 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  // 二次校验用户是否仍存在
  const user = getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: '账号不存在' });
  }
  req.userId = user.id;
  req.username = user.username;
  next();
}

/** 在响应里取当前用户 id（需放在 authMiddleware 之后） */
export function requireUserId(req: Request): string {
  if (!req.userId) throw new Error('缺少用户身份');
  return req.userId;
}
