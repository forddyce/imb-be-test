import { config, validateConfig } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, closeDatabase } from './config/database';
import { FcmJobModel } from './models/FcmJob';
import { firebaseService } from './services/firebase.service';
import { rabbitmqService } from './services/rabbitmq.service';
import { notificationController } from './controllers/notification.controller';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
    try {
        logger.info('Validating configuration...');
        validateConfig();

        logger.info('Connecting to database...');
        await connectDatabase();

        logger.info('Setting up database tables...');
        await FcmJobModel.createTable();

        logger.info('Initializing Firebase...');
        await firebaseService.initialize();

        logger.info('Connecting to RabbitMQ...');
        await rabbitmqService.connect();

        logger.info('Starting message consumer...');
        await rabbitmqService.consume(
            notificationController.processMessage.bind(notificationController)
        );

        const app = createApp();
        const server = app.listen(config.port, () => {
            logger.info(`Server started on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            logger.info('Service is ready to process notifications');
        });

        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, shutting down gracefully...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                try {
                    await rabbitmqService.close();
                    await closeDatabase();
                    logger.info('All connections closed');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during shutdown', { error });
                    process.exit(1);
                }
            });

            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error('Failed to start application', { error });
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
});

bootstrap();
