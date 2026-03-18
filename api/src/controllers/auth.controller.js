'use strict';

const authService = require('../services/auth.service');
const { ok, created } = require('../utils/response');

/**
 * Controller de Autenticação.
 * Responsável apenas por extrair dados da requisição,
 * delegar ao service e formatar a resposta HTTP.
 */
const authController = {
  /**
   * POST /auth/register
   */
  async register(req, res) {
    const { username, password } = req.body;
    const { user } = await authService.register(username, password);
    return created(res, user, 'Usuário registrado com sucesso.');
  },

  /**
   * POST /auth/login
   */
  async login(req, res) {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return ok(res, result, 'Login realizado com sucesso.');
  },

  /**
   * GET /auth/me
   * Retorna dados do usuário autenticado (injetados pelo middleware).
   */
  async me(req, res) {
    return ok(res, req.user);
  },
};

module.exports = authController;
