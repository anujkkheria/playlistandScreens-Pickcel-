import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
	const start = process.hrtime.bigint();
	const { method, originalUrl } = req;
	res.on('finish', () => {
		const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
		logger.info('%s %s %d %dms', method, originalUrl, res.statusCode, durationMs.toFixed(1), {
			ip: req.ip,
			userAgent: req.get('user-agent') || '',
			contentLength: res.getHeader('content-length') || 0
		});
	});
	return next();
}

export function errorLogger(err: unknown, req: Request, res: Response, next: NextFunction): void {
	logger.error('Unhandled error on %s %s: %o', req.method, req.originalUrl, err);
	next(err);
}

