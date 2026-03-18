'use strict';

const db = require('../config/database');

/**
 * Repositório de autenticação.
 * Responsável exclusivamente pelas queries SQL relacionadas a usuários.
 */
const authRepository = {
  /**
   * Busca usuário pelo username.
   * @param {string} username
   * @returns {object|null} Linha do banco ou null
   */
  async findByUsername(username) {
    const result = await db.query(
      'SELECT id, username, password, created_at FROM usuarios WHERE username = $1',
      [username],
    );
    return result.rows[0] || null;
  },

  /**
   * Insere um novo usuário.
   * @param {string} username
   * @param {string} hashedPassword
   * @returns {object} Usuário criado (sem a senha)
   */
  async create(username, hashedPassword) {
    const result = await db.query(
      'INSERT INTO usuarios (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hashedPassword],
    );
    return result.rows[0];
  },
};

module.exports = authRepository;
