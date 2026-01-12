import winston from 'winston';
import { config } from './env';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            if (typeof meta.stack === 'string') {
                metaStr = `\n${meta.stack}`;
            } else {
                metaStr = ` ${JSON.stringify(meta)}`;
            }
        }
        return `${String(timestamp)} [${String(level)}]: ${String(message)}${metaStr}`;
    })
);

export const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
