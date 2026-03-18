'use strict';

/**
 * Padrão de resposta bem-sucedida.
 * Todas as respostas de sucesso seguem { success, message?, data? }.
 */
function ok(res, data = null, message = null, statusCode = 200) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
}

/**
 * Resposta 201 Created com dados.
 */
function created(res, data, message = 'Recurso criado com sucesso.') {
  return ok(res, data, message, 201);
}

/**
 * Resposta paginada padronizada.
 */
function paginated(res, data, total, page, limit) {
  return res.status(200).json({
    success:    true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

module.exports = { ok, created, paginated };
