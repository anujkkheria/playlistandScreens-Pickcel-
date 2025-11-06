import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
	userId: string;
	roles: string[];
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) {
		res.status(401).json({ message: 'Unauthorized' });
		return;
	}
	try {
		const secret = process.env.JWT_SECRET || '';
		const payload = jwt.verify(token, secret) as AuthUser;
		req.user = { userId: payload.userId, roles: payload.roles };
		next();
	} catch {
		res.status(401).json({ message: 'Invalid token' });
	}
}

export function requireRole(required: 'EDITOR' | 'ADMIN') {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const roles = req.user.roles || [];
		if (required === 'EDITOR') {
			if (roles.includes('EDITOR') || roles.includes('ADMIN')) {
				return next();
			}
		} else if (required === 'ADMIN') {
			if (roles.includes('ADMIN')) {
				return next();
			}
		}
		res.status(403).json({ message: 'Forbidden' });
	};
}

