import admin from 'firebase-admin';
import { config } from '../config/env';
import { logger } from '../config/logger';
import fs from 'fs';

export class FirebaseService {
    private app: admin.app.App | null = null;

    initialize(): void {
        try {
            let serviceAccount: admin.ServiceAccount;

            if (
                config.firebase.serviceAccountPath &&
                fs.existsSync(config.firebase.serviceAccountPath)
            ) {
                const fileContent = fs.readFileSync(config.firebase.serviceAccountPath, 'utf-8');
                serviceAccount = JSON.parse(fileContent) as admin.ServiceAccount;
            } else if (config.firebase.serviceAccountJson) {
                serviceAccount = JSON.parse(
                    config.firebase.serviceAccountJson
                ) as admin.ServiceAccount;
            } else {
                throw new Error('Firebase service account not configured');
            }

            this.app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: config.firebase.projectId,
            });

            logger.info('Firebase Admin SDK initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK', { error });
            throw error;
        }
    }

    async sendNotification(deviceToken: string, title: string, body: string): Promise<string> {
        if (!this.app) {
            throw new Error('Firebase not initialized');
        }

        try {
            const message: admin.messaging.Message = {
                token: deviceToken,
                notification: {
                    title,
                    body,
                },
                android: {
                    priority: 'high',
                },
                apns: {
                    headers: {
                        'apns-priority': '10',
                    },
                },
            };

            const response = await admin.messaging().send(message);
            logger.info('FCM notification sent successfully', {
                messageId: response,
                deviceToken: deviceToken.substring(0, 20) + '...',
            });

            return response;
        } catch (error) {
            logger.error('Failed to send FCM notification', {
                error,
                deviceToken: deviceToken.substring(0, 20) + '...',
            });
            throw error;
        }
    }

    isInitialized(): boolean {
        return this.app !== null;
    }
}

export const firebaseService = new FirebaseService();
