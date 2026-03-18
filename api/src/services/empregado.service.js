'use strict';

const { parse }            = require('csv-parse/sync');
const empregadoRepository  = require('../repositories/empregado.repository');
const AppError             = require('../utils/AppError');

/**
 * Service de Empregados.
 * Orquestra regras de negócio entre controllers e repositórios.
 */
const empregadoService = {
  async listar(filtros) {
    const page  = Math.max(1, parseInt(filtros.page  || 1,  10));
    const limit = Math.min(200, Math.max(1, parseInt(filtros.limit || 50, 10)));

    return empregadoRepository.findAll({ ...filtros, page, limit });
  },

  async buscarPorId(id) {
    const empregado = await empregadoRepository.findById(id);
    if (!empregado) {
      throw new AppError(`Empregado com ID ${id} não encontrado.`, 404, 'NOT_FOUND');
    }
    return empregado;
  },

  async criar(dados) {
    return empregadoRepository.create(dados);
  },

  async atualizar(id, dados) {
    // Valida existência antes de atualizar
    await this.buscarPorId(id);
    const atualizado = await empregadoRepository.update(id, dados);
    return atualizado;
  },

  async remover(id) {
    await this.buscarPorId(id);
    await empregadoRepository.remove(id);
  },

  /**
   * Processa importação de CSV de empregados.
   * Retorna relatório com registros inseridos e rejeitados.
   *
   * @param {Buffer} fileBuffer - Conteúdo binário do arquivo CSV
   * @returns {{ total, inserted, rejected }}
   */
  async importarCSV(fileBuffer) {
    let records;

    try {
      records = parse(fileBuffer.toString('utf8'), {
        columns:           true,
        skip_empty_lines:  true,
        trim:              true,
        bom:               true, // suporta arquivos com BOM (Excel)
      });
    } catch (parseErr) {
      throw new AppError(`Arquivo CSV inválido: ${parseErr.message}`, 400, 'INVALID_CSV');
    }

    if (!records.length) {
      throw new AppError('O arquivo CSV está vazio.', 400, 'EMPTY_CSV');
    }

    // Filtra registros que não possuem campo obrigatório nm_pessoa
    const validos   = records.filter((r) => r.nm_pessoa && r.nm_pessoa.trim());
    const invalidos = records.length - validos.length;

    if (!validos.length) {
      throw new AppError('Nenhum registro válido encontrado. O campo nm_pessoa é obrigatório.', 400, 'NO_VALID_RECORDS');
    }

    const { inserted, rejected } = await empregadoRepository.bulkInsert(validos);

    return {
      total:    records.length,
      inserted,
      rejected: [
        // Linhas sem nm_pessoa
        ...Array(invalidos).fill({ registro: '(sem nome)', motivo: 'Campo nm_pessoa ausente.' }),
        // Erros de banco (duplicatas, etc.)
        ...rejected,
      ],
    };
  },
};

module.exports = empregadoService;
