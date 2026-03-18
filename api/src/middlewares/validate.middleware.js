'use strict';

const { validationResult } = require('express-validator');

/**
 * Coleta os erros do express-validator e os retorna em formato padronizado.
 * Deve ser adicionado como último item de um array de middlewares de validação.
 *
 * @example
 *   router.post('/', [body('name').notEmpty(), validate], controller.create);
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dados de entrada inválidos.',
      errors:  errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = validate;
