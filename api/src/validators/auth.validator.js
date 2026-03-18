'use strict';

const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username é obrigatório.')
    .isLength({ min: 3, max: 50 }).withMessage('Username deve ter entre 3 e 50 caracteres.')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username contém caracteres inválidos.'),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
];

const loginValidator = [
  body('username').trim().notEmpty().withMessage('Username é obrigatório.'),
  body('password').notEmpty().withMessage('Senha é obrigatória.'),
];

module.exports = { registerValidator, loginValidator };
