import { createApp } from './app';
import { config } from './config';
import prisma from './db';

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(`🚀 longwarp-auth running at http://${config.host}:${config.port}`);
  console.log(`   Environment:   ${config.nodeEnv}`);
  console.log(`   Health Check:  http://${config.host}:${config.port}/health`);
  console.log(`   Cookie Domain: ${config.cookie.domain || '(host-only)'}`);
  console.log(`   CORS Origins:  ${config.cors.allowedOrigins.join(', ')}`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
