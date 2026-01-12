import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './config/logger';
import { FcmJobModel } from './models/FcmJob';
import { rabbitmqService } from './services/rabbitmq.service';
import { firebaseService } from './services/firebase.service';

export function createApp(): express.Application {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    const limiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);

    app.use((req: Request, res: Response, next: NextFunction) => {
        logger.debug(`${req.method} ${req.path}`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
        next();
    });

    app.get('/health', (req: Request, res: Response) => {
        const status = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                rabbitmq: rabbitmqService.getConnectionStatus(),
                firebase: firebaseService.isInitialized(),
            },
        };

        const httpStatus = status.services.rabbitmq && status.services.firebase ? 200 : 503;
        res.status(httpStatus).json(status);
    });

    app.get('/api/jobs', async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 100;
            const jobs = await FcmJobModel.findAll(limit);
            res.json({
                success: true,
                count: jobs.length,
                data: jobs,
            });
        } catch (error) {
            logger.error('Error fetching jobs', { error });
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    });

    app.get('/api/jobs/:identifier', async (req: Request, res: Response) => {
        try {
            const job = await FcmJobModel.findByIdentifier(req.params.identifier);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }
            res.json({
                success: true,
                data: job,
            });
        } catch (error) {
            logger.error('Error fetching job', { error });
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    });

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: 'Not found',
        });
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error('Unhandled error', { error: err });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    });

    return app;
}
