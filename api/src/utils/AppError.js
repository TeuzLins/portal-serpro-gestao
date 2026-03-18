'use strict';

/**
 * Erro HTTP tipado com statusCode.
 * Use este em vez de lançar Error genérico nos services/controllers.
 *
 * @example
 *   throw new AppError('Empregado não encontrado.', 404);
 */
class AppError extends Error {
  /**
   * @param {string}  message    - Mensagem legível ao consumidor da API
   * @param {number}  statusCode - Código HTTP (4xx ou 5xx)
   * @param {string}  [code]     - Código interno de erro (ex: 'DUPLICATE_CPF')
   */
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name       = 'AppError';
    this.statusCode = statusCode;
    this.code       = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
