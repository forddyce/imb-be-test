import { FcmMessage, validateFcmMessage, NotificationResult } from '../types/message';
import { firebaseService } from '../services/firebase.service';
import { rabbitmqService } from '../services/rabbitmq.service';
import { FcmJobModel } from '../models/FcmJob';
import { logger } from '../config/logger';

export class NotificationController {
    async processMessage(messageData: any, ack: () => void, nack: () => void): Promise<void> {
        try {
            if (!validateFcmMessage(messageData)) {
                logger.warn('Invalid message format, rejecting', { messageData });
                ack();
                return;
            }

            const message: FcmMessage = messageData;
            logger.info('Processing FCM message', { identifier: message.identifier });

            ack();

            await this.sendFcmNotification(message);
        } catch (error) {
            logger.error('Error processing message', { error, messageData });
            nack();
        }
    }

    private async sendFcmNotification(message: FcmMessage): Promise<void> {
        try {
            const title = 'Incoming message';
            const body = message.text;

            await firebaseService.sendNotification(message.deviceId, title, body);

            const deliverAt = new Date().toISOString();

            await FcmJobModel.create({
                identifier: message.identifier,
                deliverAt,
            });

            const result: NotificationResult = {
                identifier: message.identifier,
                deliverAt,
            };

            await rabbitmqService.publish(result);

            logger.info('FCM notification processed successfully', {
                identifier: message.identifier,
                deliverAt,
            });
        } catch (error) {
            logger.error('Failed to send FCM notification', { error, message });
            throw error;
        }
    }
}

export const notificationController = new NotificationController();
