'use strict';

const { body, param } = require('express-validator');

const VALID_STATUS = ['Pendente', 'Em andamento', 'Concluído', 'Arquivado'];

const createDossieValidator = [
  body('num')
    .trim()
    .notEmpty().withMessage('Número do dossiê é obrigatório.')
    .isLength({ max: 20 }).withMessage('Número deve ter no máximo 20 caracteres.'),

  body('departamento')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Departamento deve ter no máximo 100 caracteres.'),

  body('status')
    .optional()
    .isIn(VALID_STATUS).withMessage(`Status deve ser um de: ${VALID_STATUS.join(', ')}.`),

  body('etiqueta_caixa')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 100 }),

  body('etiqueta_documento')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 100 }),

  body('caixa_serpro')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 50 }),

  body('num_documento')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 100 }),
];

const updateDossieValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
  ...createDossieValidator,
];

module.exports = { createDossieValidator, updateDossieValidator };
