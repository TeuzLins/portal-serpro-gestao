'use strict';

const empregadoService        = require('../services/empregado.service');
const { ok, created, paginated } = require('../utils/response');

/**
 * Controller de Empregados.
 */
const empregadoController = {
  /**
   * GET /empregados
   */
  async listar(req, res) {
    const { nome, cpf, regional, status, page, limit } = req.query;
    const { rows, total } = await empregadoService.listar({ nome, cpf, regional, status, page, limit });
    const p = parseInt(page || 1, 10);
    const l = parseInt(limit || 50, 10);
    return paginated(res, rows, total, p, l);
  },

  /**
   * GET /empregados/:id
   */
  async buscarPorId(req, res) {
    const empregado = await empregadoService.buscarPorId(req.params.id);
    return ok(res, empregado);
  },

  /**
   * POST /empregados
   */
  async criar(req, res) {
    const empregado = await empregadoService.criar(req.body);
    return created(res, empregado, 'Empregado cadastrado com sucesso.');
  },

  /**
   * PUT /empregados/:id
   */
  async atualizar(req, res) {
    const empregado = await empregadoService.atualizar(req.params.id, req.body);
    return ok(res, empregado, 'Empregado atualizado com sucesso.');
  },

  /**
   * DELETE /empregados/:id
   */
  async remover(req, res) {
    await empregadoService.remover(req.params.id);
    return ok(res, null, 'Empregado removido com sucesso.');
  },

  /**
   * POST /empregados/importar-csv
   */
  async importarCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado. Use o campo "file" no multipart/form-data.',
      });
    }
    const resultado = await empregadoService.importarCSV(req.file.buffer);
    return ok(res, resultado, `Importação concluída: ${resultado.inserted} inserido(s).`);
  },
};

module.exports = empregadoController;
