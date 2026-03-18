'use strict';

const dossieService              = require('../services/dossie.service');
const { ok, created, paginated } = require('../utils/response');

const dossieController = {
  async listar(req, res) {
    const { depto, status, busca, page, limit } = req.query;
    const { rows, total } = await dossieService.listar({ depto, status, busca, page, limit });
    const p = parseInt(page  || 1,  10);
    const l = parseInt(limit || 50, 10);
    return paginated(res, rows, total, p, l);
  },

  async buscarPorId(req, res) {
    const dossie = await dossieService.buscarPorId(req.params.id);
    return ok(res, dossie);
  },

  async criar(req, res) {
    const dossie = await dossieService.criar(req.body);
    return created(res, dossie, 'Dossiê criado com sucesso.');
  },

  async atualizar(req, res) {
    const dossie = await dossieService.atualizar(req.params.id, req.body);
    return ok(res, dossie, 'Dossiê atualizado com sucesso.');
  },

  async remover(req, res) {
    await dossieService.remover(req.params.id);
    return ok(res, null, 'Dossiê removido com sucesso.');
  },

  async importarCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado.',
      });
    }
    const resultado = await dossieService.importarCSV(req.file.buffer);
    return ok(res, resultado, `Importação concluída: ${resultado.inserted} inserido(s).`);
  },
};

module.exports = dossieController;
