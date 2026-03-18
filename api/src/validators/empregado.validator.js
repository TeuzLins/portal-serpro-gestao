'use strict';

const { body, query, param } = require('express-validator');

const VALID_STATUS = ['Ativo', 'Inativo', 'Afastado'];

const createEmpregadoValidator = [
  body('nm_pessoa')
    .trim()
    .notEmpty().withMessage('Nome do empregado é obrigatório.')
    .isLength({ max: 200 }).withMessage('Nome deve ter no máximo 200 caracteres.'),

  body('cd_cpf')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).withMessage('CPF inválido.'),

  body('cd_matricula')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 30 }).withMessage('Matrícula deve ter no máximo 30 caracteres.'),

  body('nm_regional')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Regional deve ter no máximo 200 caracteres.'),

  body('dt_admissao')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Data de admissão inválida. Use o formato YYYY-MM-DD.'),

  body('dt_desligamento')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Data de desligamento inválida. Use o formato YYYY-MM-DD.'),

  body('status')
    .optional()
    .isIn(VALID_STATUS).withMessage(`Status deve ser um de: ${VALID_STATUS.join(', ')}.`),
];

const updateEmpregadoValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido.'),
  ...createEmpregadoValidator,
];

const listEmpregadosValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um inteiro positivo.'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit deve ser entre 1 e 200.'),
];

module.exports = { createEmpregadoValidator, updateEmpregadoValidator, listEmpregadosValidator };
