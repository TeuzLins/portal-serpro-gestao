'use strict';

const AppError = require('../utils/AppError');

/**
 * Handler global de erros Express.
 * Deve ser registrado APÓS todas as rotas como último middleware.
 *
 * Distingue entre AppError (erros controlados) e erros inesperados.
 * Em produção, nunca expõe stack traces ao cliente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // ── Erros de validação do express-validator ──────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(422).json({
      success: false,
      message: 'Dados de entrada inválidos.',
      errors:  err.errors,
    });
  }

  // ── Erros controlados (AppError) ─────────────────────────────────
  if (err instanceof AppError) {
    const body = {
      success: false,
      message: err.message,
    };
    if (err.code)  body.code  = err.code;
    if (isDev)     body.stack = err.stack;
    return res.status(err.statusCode).json(body);
  }

  // ── Erros do PostgreSQL ───────────────────────────────────────────
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado. Verifique os dados informados.',
      code:    'DUPLICATE_ENTRY',
    });
  }

  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Referência inválida entre registros.',
      code:    'FOREIGN_KEY_VIOLATION',
    });
  }

  // ── Erro inesperado ───────────────────────────────────────────────
  console.error('[ERROR]', err);

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.',
    ...(isDev && { detail: err.message, stack: err.stack }),
  });
}

module.exports = errorHandler;
