'use strict';

const db = require('../config/database');

/**
 * Repositório de Empregados.
 * Toda interação com a tabela `empregados` passa por aqui.
 */
const empregadoRepository = {
  /**
   * Lista empregados com filtros opcionais e paginação.
   */
  async findAll({ nome = '', cpf = '', regional = '', status = '', page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const params = [`%${nome}%`, `%${cpf}%`, `%${regional}%`, status, limit, offset];

    const dataQuery = `
      SELECT *
        FROM empregados
       WHERE nm_pessoa    ILIKE $1
         AND cd_cpf       ILIKE $2
         AND nm_regional  ILIKE $3
         AND ($4 = '' OR status = $4)
       ORDER BY nm_pessoa ASC
       LIMIT $5 OFFSET $6
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
        FROM empregados
       WHERE nm_pessoa    ILIKE $1
         AND cd_cpf       ILIKE $2
         AND nm_regional  ILIKE $3
         AND ($4 = '' OR status = $4)
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, params),
      db.query(countQuery, params.slice(0, 4)),
    ]);

    return {
      rows:  dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Busca empregado por ID.
   */
  async findById(id) {
    const result = await db.query('SELECT * FROM empregados WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  /**
   * Insere novo empregado.
   */
  async create({ cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status }) {
    const result = await db.query(
      `INSERT INTO empregados
         (cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cd_cpf || null, cd_matricula || null, nm_pessoa, nm_regional || null,
       dt_admissao || null, dt_desligamento || null, status || 'Ativo'],
    );
    return result.rows[0];
  },

  /**
   * Atualiza empregado existente.
   */
  async update(id, { cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status }) {
    const result = await db.query(
      `UPDATE empregados
          SET cd_cpf          = $1,
              cd_matricula    = $2,
              nm_pessoa       = $3,
              nm_regional     = $4,
              dt_admissao     = $5,
              dt_desligamento = $6,
              status          = $7
        WHERE id = $8
        RETURNING *`,
      [cd_cpf || null, cd_matricula || null, nm_pessoa, nm_regional || null,
       dt_admissao || null, dt_desligamento || null, status, id],
    );
    return result.rows[0] || null;
  },

  /**
   * Exclui empregado. Retorna true se encontrado e excluído.
   */
  async remove(id) {
    const result = await db.query(
      'DELETE FROM empregados WHERE id = $1 RETURNING id',
      [id],
    );
    return result.rowCount > 0;
  },

  /**
   * Inserção em lote via transação (CSV import).
   * @param {Array<object>} records - Registros validados
   * @returns {{ inserted: number, rejected: Array }} Resultado da operação
   */
  async bulkInsert(records) {
    const client = await db.getClient();
    const inserted = [];
    const rejected = [];

    try {
      await client.query('BEGIN');

      for (const rec of records) {
        try {
          await client.query(
            `INSERT INTO empregados
               (cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [rec.cd_cpf || null, rec.cd_matricula || null, rec.nm_pessoa,
             rec.nm_regional || null, rec.dt_admissao || null, rec.dt_desligamento || null,
             rec.dt_desligamento ? 'Inativo' : (rec.status || 'Ativo')],
          );
          inserted.push(rec.nm_pessoa);
        } catch (rowErr) {
          rejected.push({ registro: rec.nm_pessoa, motivo: rowErr.message });
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { inserted: inserted.length, rejected };
  },
};

module.exports = empregadoRepository;
