'use strict';

const bcrypt         = require('bcryptjs');
const { sign }       = require('../config/jwt');
const authRepository = require('../repositories/auth.repository');
const AppError       = require('../utils/AppError');

/**
 * Service de Autenticação.
 * Contém toda a lógica de negócio para registro e login.
 * Não conhece req/res – apenas opera sobre dados.
 */
const authService = {
  /**
   * Registra um novo usuário.
   * @param {string} username
   * @param {string} password
   * @returns {{ user: object }} Usuário criado (sem senha)
   */
  async register(username, password) {
    const existing = await authRepository.findByUsername(username);
    if (existing) {
      throw new AppError('Username já está em uso.', 409, 'DUPLICATE_USERNAME');
    }

    const hashedPassword = await bcrypt.hash(password, 12); // custo 12 = padrão corporativo
    const user = await authRepository.create(username.trim(), hashedPassword);

    return { user };
  },

  /**
   * Autentica um usuário e retorna um token JWT.
   * @param {string} username
   * @param {string} password
   * @returns {{ token: string, user: object }}
   */
  async login(username, password) {
    const usuario = await authRepository.findByUsername(username);

    // Mensagem genérica para não revelar se o usuário existe
    if (!usuario) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      throw new AppError('Credenciais inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const payload = { id: usuario.id, username: usuario.username };
    const token   = sign(payload);

    return {
      token,
      user: { id: usuario.id, username: usuario.username },
    };
  },
};

module.exports = authService;
