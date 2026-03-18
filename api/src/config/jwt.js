'use strict';

const jwt = require('jsonwebtoken');

const SECRET     = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!SECRET || SECRET.length < 32) {
  // Bloqueia inicialização com segredo fraco em produção
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[JWT] JWT_SECRET ausente ou muito curto. Defina um valor seguro em produção.');
  }
  console.warn('[JWT] AVISO: usando segredo padrão. Defina JWT_SECRET no .env!');
}

/**
 * Gera um token JWT para o payload informado.
 * @param {object} payload - Dados a incluir no token (id, username, etc.)
 * @returns {string} Token JWT assinado
 */
function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verifica e decodifica um token JWT.
 * Lança JsonWebTokenError ou TokenExpiredError em caso de falha.
 * @param {string} token
 * @returns {object} Payload decodificado
 */
function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
