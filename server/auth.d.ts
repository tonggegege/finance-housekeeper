import type { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    username: string;
}
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload | null;
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            username?: string;
        }
    }
}
/** 鉴权中间件：从 Authorization: Bearer <token> 解析用户 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/** 在响应里取当前用户 id（需放在 authMiddleware 之后） */
export declare function requireUserId(req: Request): string;
