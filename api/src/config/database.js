'use strict';

const { Pool } = require('pg');

// Pool único e reutilizável por toda a aplicação
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,              // máximo de conexões simultâneas
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err.message);
});

/**
 * Executa uma query parametrizada e retorna o resultado.
 * Centralizar aqui facilita logs, tracing e testes.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.debug('[DB] query=%s | rows=%d | time=%dms', text.slice(0, 80), result.rowCount, duration);
  }

  return result;
}

/**
 * Obtém uma conexão dedicada do pool (útil para transações).
 * Lembre-se de chamar client.release() após o uso.
 */
async function getClient() {
  return pool.connect();
}

/**
 * Encerra o pool graciosamente (usado no shutdown da aplicação).
 */
async function closePool() {
  await pool.end();
  console.log('[DB] Pool de conexões encerrado.');
}

module.exports = { query, getClient, closePool };
