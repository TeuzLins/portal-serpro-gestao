/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Portal SERPRO – Guia de Integração Front-end ↔ Back-end
 *
 *  Cole este bloco <script> no portal-serpro.html, logo antes de </body>,
 *  substituindo qualquer lógica de fetch/mock existente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── 1. Configuração central da API ───────────────────────────────────────────
const API = {
  // Em desenvolvimento aponte para http://localhost:3000/api/v1
  // Em produção com nginx, /api/v1 é roteado automaticamente (sem porta)
  BASE_URL: '/api/v1',

  /**
   * Método utilitário: monta headers padrão com JWT (se disponível).
   */
  headers(extra = {}) {
    const token = localStorage.getItem('serpro_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...extra,
    };
  },

  /**
   * Wrapper fetch com tratamento de erro padronizado.
   * @returns {Promise<object>} - Corpo da resposta parseado
   */
  async request(method, path, body = null) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(this.BASE_URL + path, opts);

    // Sessão expirada → força novo login
    if (res.status === 401) {
      localStorage.removeItem('serpro_token');
      localStorage.removeItem('serpro_user');
      window.location.reload();
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro na requisição.');
    return data;
  },
};

// ── 2. Autenticação ───────────────────────────────────────────────────────────
async function login(username, password) {
  const { data } = await API.request('POST', '/auth/login', { username, password });
  localStorage.setItem('serpro_token', data.token);
  localStorage.setItem('serpro_user',  data.user.username);
}

async function register(username, password) {
  await API.request('POST', '/auth/register', { username, password });
}

function logout() {
  localStorage.removeItem('serpro_token');
  localStorage.removeItem('serpro_user');
  window.location.reload();
}

// ── 3. Empregados ─────────────────────────────────────────────────────────────
async function fetchEmpregados({ nome = '', cpf = '', regional = '', status = '', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ nome, cpf, regional, status, page, limit });
  return API.request('GET', `/empregados?${params}`);
  // Retorna: { success, data: [...], pagination: { total, page, limit, pages } }
}

async function createEmpregado(payload) {
  return API.request('POST', '/empregados', payload);
}

async function updateEmpregado(id, payload) {
  return API.request('PUT', `/empregados/${id}`, payload);
}

async function deleteEmpregado(id) {
  return API.request('DELETE', `/empregados/${id}`);
}

async function importEmpregadosCSV(file) {
  const token = localStorage.getItem('serpro_token');
  const form  = new FormData();
  form.append('file', file);

  const res = await fetch(`${API.BASE_URL}/empregados/importar-csv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
  // data.data = { total, inserted, rejected: [...] }
}

// ── 4. Dossiês ────────────────────────────────────────────────────────────────
async function fetchDossies({ depto = '', status = '', busca = '', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ depto, status, busca, page, limit });
  return API.request('GET', `/dossies?${params}`);
}

async function createDossie(payload) {
  return API.request('POST', '/dossies', payload);
}

async function updateDossie(id, payload) {
  return API.request('PUT', `/dossies/${id}`, payload);
}

async function deleteDossie(id) {
  return API.request('DELETE', `/dossies/${id}`);
}

// ── 5. Dashboard ──────────────────────────────────────────────────────────────
async function fetchMetrics() {
  const { data } = await API.request('GET', '/dashboard/metrics');
  // data = {
  //   empregados:  { total, ativos, inativos },
  //   dossies:     { total, pendentes },
  //   recentes:    { empregados: [...], dossies: [...] },
  //   distribuicaoPorRegional: [{ regional, total }, ...]
  // }
  return data;
}

// ── 6. Exemplo de uso nas funções existentes do front-end ─────────────────────
//
// Substitua blocos como:
//
//   const empregados = mockData;  ← REMOVER
//
// Por:
//
//   const { data: empregados, pagination } = await fetchEmpregados({ nome: searchTerm });
//   renderTable(empregados);
//   renderPagination(pagination);
//
// Para o login, onde existir handleLogin(), substitua por:
//
//   try {
//     await login(usernameInput.value, passwordInput.value);
//     showDashboard();
//   } catch (err) {
//     showError(err.message);
//   }
