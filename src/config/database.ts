import mysql from 'mysql2/promise';
import { config } from '../config/env';
import { logger } from '../config/logger';

let pool: mysql.Pool | null = null;

export async function connectDatabase(): Promise<mysql.Pool> {
    if (pool) {
        return pool;
    }

    try {
        pool = mysql.createPool({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });

        const connection = await pool.getConnection();
        logger.info('Database connected successfully');
        connection.release();

        return pool;
    } catch (error) {
        logger.error('Failed to connect to database', { error });
        throw error;
    }
}

export function getDatabase(): mysql.Pool {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDatabase() first.');
    }
    return pool;
}

export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Database connection closed');
    }
}
