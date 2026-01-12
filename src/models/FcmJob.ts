import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getDatabase } from '../config/database';
import { logger } from '../config/logger';

export interface FcmJob {
    id?: number;
    identifier: string;
    deliverAt: string;
    createdAt?: Date;
}

export class FcmJobModel {
    static async createTable(): Promise<void> {
        const db = getDatabase();
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS fcm_job (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL UNIQUE,
        deliverAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_identifier (identifier),
        INDEX idx_deliverAt (deliverAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        try {
            await db.execute(createTableQuery);
            logger.info('Table fcm_job created or already exists');
        } catch (error) {
            logger.error('Failed to create fcm_job table', { error });
            throw error;
        }
    }

    static async create(job: FcmJob): Promise<number> {
        const db = getDatabase();
        const query = `
      INSERT INTO fcm_job (identifier, deliverAt)
      VALUES (?, ?)
    `;

        try {
            const [result] = await db.execute<ResultSetHeader>(query, [
                job.identifier,
                job.deliverAt,
            ]);
            logger.debug('FCM job saved to database', {
                identifier: job.identifier,
                id: result.insertId,
            });
            return result.insertId;
        } catch (error) {
            logger.error('Failed to save FCM job to database', { error, job });
            throw error;
        }
    }

    static async findByIdentifier(identifier: string): Promise<FcmJob | null> {
        const db = getDatabase();
        const query = 'SELECT * FROM fcm_job WHERE identifier = ?';

        try {
            const [rows] = await db.execute<RowDataPacket[]>(query, [identifier]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0] as FcmJob;
        } catch (error) {
            logger.error('Failed to find FCM job', { error, identifier });
            throw error;
        }
    }

    static async findAll(limit: number = 100): Promise<FcmJob[]> {
        const db = getDatabase();
        const query = 'SELECT * FROM fcm_job ORDER BY createdAt DESC LIMIT ?';

        try {
            const [rows] = await db.execute<RowDataPacket[]>(query, [limit]);
            return rows as FcmJob[];
        } catch (error) {
            logger.error('Failed to fetch FCM jobs', { error });
            throw error;
        }
    }
}
