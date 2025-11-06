import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = createLogger({
	level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
	format: format.combine(
		format.timestamp(),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	),
	defaultMeta: { service: 'scpl-backend' },
	transports: [
		new transports.Console({
			format: isProduction
				? format.json()
				: format.combine(
					format.colorize(),
					format.printf(({ level, message, timestamp, stack, ...meta }) => {
						const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
						return `${timestamp} ${level}: ${stack || message}${metaStr}`;
					})
				)
		})
	]
});

export default logger;

