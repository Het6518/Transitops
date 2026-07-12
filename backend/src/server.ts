import 'dotenv/config';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import app from './app';

async function bootstrap(): Promise<void> {
  try {
    // Connect to PostgreSQL via Prisma
    await connectDatabase();
    logger.info('✅ Database connected');

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info('');
      logger.info('╔══════════════════════════════════════════════╗');
      logger.info('║         TransitOps API Server                ║');
      logger.info('╠══════════════════════════════════════════════╣');
      logger.info(`║  🚀  Running   : http://localhost:${env.PORT}        ║`);
      logger.info(`║  📚  API Docs  : http://localhost:${env.PORT}/api/docs ║`);
      logger.info(`║  🏥  Health    : http://localhost:${env.PORT}/health   ║`);
      logger.info(`║  🌍  Mode      : ${env.NODE_ENV.padEnd(24)}   ║`);
      logger.info('╚══════════════════════════════════════════════╝');
      logger.info('');
    });

    // ── Graceful Shutdown ────────────────────────────────────────────────────
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received — shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('Database disconnected');
        process.exit(0);
      });

      // Force exit after 30s if server hasn't closed
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

    // ── Unhandled errors ─────────────────────────────────────────────────────
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', { reason });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start TransitOps server:', error);
    process.exit(1);
  }
}

void bootstrap();
