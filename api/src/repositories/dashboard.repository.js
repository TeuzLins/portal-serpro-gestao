'use strict';

const db = require('../config/database');

/**
 * Repositório do Dashboard.
 * Agrega métricas do sistema em queries otimizadas.
 */
const dashboardRepository = {
  /**
   * Coleta todas as métricas em paralelo para máxima performance.
   */
  async getMetrics() {
    const [
      empTotal,
      empAtivos,
      empInativados,
      dossieTotal,
      dossiePendentes,
      recentesEmp,
      recentesDossie,
      regionalDist,
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM empregados"),
      db.query("SELECT COUNT(*) AS total FROM empregados WHERE status = 'Ativo'"),
      db.query("SELECT COUNT(*) AS total FROM empregados WHERE status = 'Inativo'"),
      db.query("SELECT COUNT(*) AS total FROM dossies"),
      db.query("SELECT COUNT(*) AS total FROM dossies WHERE status = 'Pendente'"),
      db.query("SELECT id, nm_pessoa, status, created_at FROM empregados ORDER BY created_at DESC LIMIT 5"),
      db.query("SELECT id, num, departamento, status, created_at FROM dossies ORDER BY created_at DESC LIMIT 5"),
      db.query(`
        SELECT nm_regional AS regional, COUNT(*) AS total
          FROM empregados
         WHERE nm_regional IS NOT NULL
         GROUP BY nm_regional
         ORDER BY total DESC
         LIMIT 8
      `),
    ]);

    return {
      empregados: {
        total:    parseInt(empTotal.rows[0].total, 10),
        ativos:   parseInt(empAtivos.rows[0].total, 10),
        inativos: parseInt(empInativados.rows[0].total, 10),
      },
      dossies: {
        total:     parseInt(dossieTotal.rows[0].total, 10),
        pendentes: parseInt(dossiePendentes.rows[0].total, 10),
      },
      recentes: {
        empregados: recentesEmp.rows,
        dossies:    recentesDossie.rows,
      },
      distribuicaoPorRegional: regionalDist.rows,
    };
  },
};

module.exports = dashboardRepository;
