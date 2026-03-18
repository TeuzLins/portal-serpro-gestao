'use strict';

require('dotenv').config();

const app            = require('./app');
const { closePool }  = require('./config/database');

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  console.log(`\n✅  Portal SERPRO API iniciada`);
  console.log(`   Ambiente : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Porta    : ${PORT}`);
  console.log(`   Health   : http://localhost:${PORT}/health`);
  console.log(`   API Base : http://localhost:${PORT}/api/v1\n`);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[${signal}] Encerrando servidor...`);
  server.close(async () => {
    await closePool();
    console.log('Servidor encerrado com sucesso.');
    process.exit(0);
  });

  // Força encerramento após 10s caso haja conexões pendentes
  setTimeout(() => {
    console.error('Forçando encerramento após timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Captura rejeições não tratadas
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
