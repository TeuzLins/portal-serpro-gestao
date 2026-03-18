'use strict';

const { parse }        = require('csv-parse/sync');
const dossieRepository = require('../repositories/dossie.repository');
const AppError         = require('../utils/AppError');

const dossieService = {
  async listar(filtros) {
    const page  = Math.max(1, parseInt(filtros.page  || 1,  10));
    const limit = Math.min(200, Math.max(1, parseInt(filtros.limit || 50, 10)));
    return dossieRepository.findAll({ ...filtros, page, limit });
  },

  async buscarPorId(id) {
    const dossie = await dossieRepository.findById(id);
    if (!dossie) {
      throw new AppError(`Dossiê com ID ${id} não encontrado.`, 404, 'NOT_FOUND');
    }
    return dossie;
  },

  async criar(dados) {
    return dossieRepository.create(dados);
  },

  async atualizar(id, dados) {
    await this.buscarPorId(id);
    return dossieRepository.update(id, dados);
  },

  async remover(id) {
    await this.buscarPorId(id);
    await dossieRepository.remove(id);
  },

  async importarCSV(fileBuffer) {
    let records;

    try {
      records = parse(fileBuffer.toString('utf8'), {
        columns:          true,
        skip_empty_lines: true,
        trim:             true,
        bom:              true,
      });
    } catch (parseErr) {
      throw new AppError(`Arquivo CSV inválido: ${parseErr.message}`, 400, 'INVALID_CSV');
    }

    if (!records.length) {
      throw new AppError('O arquivo CSV está vazio.', 400, 'EMPTY_CSV');
    }

    // Normaliza nomes de colunas para o padrão interno
    // (suporta cabeçalhos tanto em português quanto nos nomes de campo)
    const normalized = records.map((r) => ({
      num:               r['num']              || r['N']                  || '',
      etiqueta_caixa:    r['etiqueta_caixa']   || r['Etiqueta caixa']     || '',
      etiqueta_documento:r['etiqueta_documento']|| r['Etiqueta documento'] || '',
      caixa_serpro:      r['caixa_serpro']     || r['Caixa SERPRO']       || '',
      num_documento:     r['num_documento']    || r['Documento']          || '',
      departamento:      r['departamento']     || r['Departamento']       || '',
      descricao:         r['descricao']        || r['Descricao']          || '',
    }));

    const validos   = normalized.filter((r) => r.num && r.num.trim());
    const invalidos = normalized.length - validos.length;

    if (!validos.length) {
      throw new AppError('Nenhum registro válido. O campo num é obrigatório.', 400, 'NO_VALID_RECORDS');
    }

    const { inserted, rejected } = await dossieRepository.bulkInsert(validos);

    return {
      total:    records.length,
      inserted,
      rejected: [
        ...Array(invalidos).fill({ registro: '(sem num)', motivo: 'Campo num ausente.' }),
        ...rejected,
      ],
    };
  },
};

module.exports = dossieService;
