import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
            ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
            : '',
        serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    },

    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        queueName: process.env.RABBITMQ_QUEUE_NAME || 'notification.fcm',
        topicName: process.env.RABBITMQ_TOPIC_NAME || 'notification.done',
    },

    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        database: process.env.DB_NAME || 'fcm_notifications',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
};

export function validateConfig(): void {
    const required = ['FIREBASE_PROJECT_ID', 'RABBITMQ_URL', 'DB_HOST', 'DB_NAME', 'DB_USER'];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (!config.firebase.serviceAccountPath && !config.firebase.serviceAccountJson) {
        throw new Error(
            'Either FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON must be provided'
        );
    }
}
