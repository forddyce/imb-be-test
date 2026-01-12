import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { config } from '../config/env';
import { logger } from '../config/logger';

interface MessageData {
    identifier?: string;
    [key: string]: unknown;
}

export class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private isConnected: boolean = false;

    async connect(): Promise<void> {
        try {
            let connection: Connection;
            try {
                connection = await amqp.connect(config.rabbitmq.url);
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                throw error;
            }

            if (!connection) {
                throw new Error('Failed to establish connection');
            }

            this.connection = connection;
            this.channel = await this.connection.createChannel();

            if (!this.channel) {
                throw new Error('Failed to create channel');
            }

            await this.channel.assertQueue(config.rabbitmq.queueName, {
                durable: true,
            });

            await this.channel.assertExchange(config.rabbitmq.topicName, 'fanout', {
                durable: true,
            });

            this.isConnected = true;
            logger.info('RabbitMQ connected successfully');

            this.connection.on('error', (err: Error) => {
                logger.error('RabbitMQ connection error', { error: err });
                this.isConnected = false;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
                void this.connect().catch((err: unknown) => {
                    logger.error('Failed to reconnect', { error: err });
                });
            });
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ', { error });
            this.isConnected = false;
            throw error;
        }
    }

    async consume(
        onMessage: (message: unknown, ack: () => void, nack: () => void) => Promise<void>
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }

        await this.channel.prefetch(1);

        await this.channel.consume(
            config.rabbitmq.queueName,
            (msg: ConsumeMessage | null) => {
                if (!msg) {
                    return;
                }

                void (async () => {
                    try {
                        const content = msg.content.toString();
                        logger.debug('Received message from queue', { content });

                        const messageData = JSON.parse(content) as MessageData;

                        const ack = () => {
                            if (this.channel) {
                                this.channel.ack(msg);
                                logger.debug('Message acknowledged', {
                                    messageId: messageData.identifier,
                                });
                            }
                        };

                        const nack = () => {
                            if (this.channel) {
                                this.channel.nack(msg, false, true);
                                logger.warn('Message not acknowledged, requeuing', {
                                    messageId: messageData.identifier,
                                });
                            }
                        };

                        await onMessage(messageData, ack, nack);
                    } catch (error) {
                        logger.error('Error processing message', { error });
                        if (this.channel) {
                            this.channel.nack(msg, false, true);
                        }
                    }
                })();
            },
            { noAck: false }
        );

        logger.info(`Started consuming from queue: ${config.rabbitmq.queueName}`);
    }

    publish(message: unknown): void {
        if (!this.channel) {
            throw new Error('Channel not initialized');
        }

        try {
            const content = JSON.stringify(message);
            this.channel.publish(config.rabbitmq.topicName, '', Buffer.from(content), {
                persistent: true,
            });
            logger.debug('Message published to topic', {
                topic: config.rabbitmq.topicName,
                message,
            });
        } catch (error) {
            logger.error('Failed to publish message', { error, message });
            throw error;
        }
    }

    async close(): Promise<void> {
        if (this.channel) {
            try {
                await this.channel.close();
            } catch (err) {
                logger.warn('Error closing channel', { error: err });
            }
        }
        if (this.connection) {
            try {
                await this.connection.close();
            } catch (err) {
                logger.warn('Error closing connection', { error: err });
            }
        }
        this.isConnected = false;
        logger.info('RabbitMQ connection closed');
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export const rabbitmqService = new RabbitMQService();
