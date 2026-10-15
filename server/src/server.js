import app from './app.js';
import env from './config/env.js';
import { checkDbConnection, closePool } from './config/db.js';

async function startServer() {
  console.log('\n========================================');
  console.log('🚀 QuikInvoice API Server Initializing...');
  console.log('========================================');

  // Verify MySQL connection
  const dbHealth = await checkDbConnection();
  if (!dbHealth.connected) {
    console.error(`❌ Database connection failed on ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
    console.error(`   Reason: ${dbHealth.error}`);
    console.error('Please ensure MySQL is running and the database exists.');
    process.exit(1);
  }

  console.log(`✅ Connected to MySQL database: [${dbHealth.database}]`);

  const server = app.listen(env.PORT, () => {
    console.log(`🌐 Server running in [${env.NODE_ENV}] mode on port [${env.PORT}]`);
    console.log(`   Healthcheck: http://localhost:${env.PORT}/api/health`);
    console.log(`   CORS Origin: ${env.CORS_ORIGIN}`);
    console.log('========================================\n');
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('   HTTP server closed.');
      try {
        await closePool();
        console.log('   MySQL connection pool drained.');
      } catch (err) {
        console.error('   Error draining connection pool:', err.message);
      }
      console.log('🏁 Process terminated gracefully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
