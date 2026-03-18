'use strict';

const db = require('../config/database');

/**
 * Repositório de Dossiês.
 */
const dossieRepository = {
  async findAll({ depto = '', status = '', busca = '', page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const params = [`%${depto}%`, status, `%${busca}%`, limit, offset];

    const dataQuery = `
      SELECT *
        FROM dossies
       WHERE departamento  ILIKE $1
         AND ($2 = '' OR status = $2)
         AND (descricao ILIKE $3 OR num_documento ILIKE $3 OR num ILIKE $3)
       ORDER BY id DESC
       LIMIT $4 OFFSET $5
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
        FROM dossies
       WHERE departamento  ILIKE $1
         AND ($2 = '' OR status = $2)
         AND (descricao ILIKE $3 OR num_documento ILIKE $3 OR num ILIKE $3)
    `;

    const [dataResult, countResult] = await Promise.all([
      db.query(dataQuery, params),
      db.query(countQuery, params.slice(0, 3)),
    ]);

    return {
      rows:  dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM dossies WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status }) {
    const result = await db.query(
      `INSERT INTO dossies
         (num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [num, etiqueta_caixa || null, etiqueta_documento || null, caixa_serpro || null,
       num_documento || null, departamento || null, descricao || null, status || 'Pendente'],
    );
    return result.rows[0];
  },

  async update(id, { num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status }) {
    const result = await db.query(
      `UPDATE dossies
          SET num               = $1,
              etiqueta_caixa    = $2,
              etiqueta_documento= $3,
              caixa_serpro      = $4,
              num_documento     = $5,
              departamento      = $6,
              descricao         = $7,
              status            = $8
        WHERE id = $9
        RETURNING *`,
      [num, etiqueta_caixa || null, etiqueta_documento || null, caixa_serpro || null,
       num_documento || null, departamento || null, descricao || null, status, id],
    );
    return result.rows[0] || null;
  },

  async remove(id) {
    const result = await db.query('DELETE FROM dossies WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  async bulkInsert(records) {
    const client = await db.getClient();
    const inserted = [];
    const rejected = [];

    try {
      await client.query('BEGIN');

      for (const rec of records) {
        try {
          await client.query(
            `INSERT INTO dossies
               (num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [rec.num, rec.etiqueta_caixa || null, rec.etiqueta_documento || null,
             rec.caixa_serpro || null, rec.num_documento || null, rec.departamento || null,
             rec.descricao || null, 'Pendente'],
          );
          inserted.push(rec.num);
        } catch (rowErr) {
          rejected.push({ registro: rec.num, motivo: rowErr.message });
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

module.exports = dossieRepository;
