'use strict';

const { verify } = require('../config/jwt');
const AppError   = require('../utils/AppError');

/**
 * Middleware de autenticação JWT.
 * Extrai e valida o Bearer Token do cabeçalho Authorization.
 * Injeta req.user com o payload decodificado.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente ou malformado.', 401, 'MISSING_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verify(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Sessão expirada. Faça login novamente.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Token inválido.', 401, 'INVALID_TOKEN');
  }
}

module.exports = authMiddleware;
