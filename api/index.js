const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const multer  = require('multer');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');

const app    = express();
const pool   = new Pool({ connectionString: process.env.DATABASE_URL });
const SECRET = process.env.JWT_SECRET || 'serpro_dev_secret';
const PORT   = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch(e) {
    res.status(401).json({ error: 'Token invalido' });
  }
}

app.get('/health', function(req, res) { res.json({ ok: true }); });

app.post('/auth/register', async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password || password.length < 4)
    return res.status(400).json({ error: 'Dados invalidos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (username, password) VALUES ($1, $2) RETURNING id, username',
      [username.trim(), hash]
    );
    res.status(201).json({ message: 'Usuario criado', user: result.rows[0] });
  } catch(e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Usuario ja existe' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (!result.rows.length) return res.status(401).json({ error: 'Usuario nao encontrado' });
    const ok = await bcrypt.compare(password, result.rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });
    const token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, SECRET, { expiresIn: '8h' });
    res.json({ token: token, username: result.rows[0].username });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/empregados', auth, async function(req, res) {
  const nome     = req.query.nome     || '';
  const cpf      = req.query.cpf      || '';
  const regional = req.query.regional || '';
  const status   = req.query.status   || '';
  const page     = parseInt(req.query.page  || '1');
  const limit    = parseInt(req.query.limit || '50');
  const offset   = (page - 1) * limit;
  try {
    const rows = await pool.query(
      'SELECT * FROM empregados WHERE nm_pessoa ILIKE $1 AND cd_cpf ILIKE $2 AND nm_regional ILIKE $3 AND ($4 = \'\' OR status = $4) ORDER BY nm_pessoa LIMIT $5 OFFSET $6',
      ['%' + nome + '%', '%' + cpf + '%', '%' + regional + '%', status, limit, offset]
    );
    const cnt = await pool.query(
      'SELECT COUNT(*) FROM empregados WHERE nm_pessoa ILIKE $1 AND cd_cpf ILIKE $2 AND nm_regional ILIKE $3 AND ($4 = \'\' OR status = $4)',
      ['%' + nome + '%', '%' + cpf + '%', '%' + regional + '%', status]
    );
    res.json({ data: rows.rows, total: parseInt(cnt.rows[0].count), page: page, limit: limit });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/empregados', auth, async function(req, res) {
  const b = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO empregados (cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [b.cd_cpf, b.cd_matricula, b.nm_pessoa, b.nm_regional, b.dt_admissao || null, b.dt_desligamento || null, b.status || 'Ativo']
    );
    res.status(201).json(r.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/empregados/:id', auth, async function(req, res) {
  const b = req.body;
  try {
    const r = await pool.query(
      'UPDATE empregados SET cd_cpf=$1, cd_matricula=$2, nm_pessoa=$3, nm_regional=$4, dt_admissao=$5, dt_desligamento=$6, status=$7 WHERE id=$8 RETURNING *',
      [b.cd_cpf, b.cd_matricula, b.nm_pessoa, b.nm_regional, b.dt_admissao || null, b.dt_desligamento || null, b.status, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Nao encontrado' });
    res.json(r.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/empregados/:id', auth, async function(req, res) {
  try {
    await pool.query('DELETE FROM empregados WHERE id = $1', [req.params.id]);
    res.json({ message: 'Removido' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/empregados/importar', auth, upload.single('file'), async function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const records = parse(req.file.buffer.toString('utf8'), {
      columns: true, skip_empty_lines: true, trim: true
    });
    let inseridos = 0;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.nm_pessoa) continue;
      await pool.query(
        'INSERT INTO empregados (cd_cpf, cd_matricula, nm_pessoa, nm_regional, dt_admissao, dt_desligamento, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [r.cd_cpf || null, r.cd_matricula || null, r.nm_pessoa, r.nm_regional || null, r.dt_admissao || null, r.dt_desligamento || null, r.dt_desligamento ? 'Inativo' : 'Ativo']
      );
      inseridos++;
    }
    res.json({ message: inseridos + ' empregado(s) importado(s)' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/dossies', auth, async function(req, res) {
  const depto  = req.query.depto  || '';
  const status = req.query.status || '';
  const busca  = req.query.busca  || '';
  const page   = parseInt(req.query.page  || '1');
  const limit  = parseInt(req.query.limit || '50');
  const offset = (page - 1) * limit;
  try {
    const rows = await pool.query(
      'SELECT * FROM dossies WHERE departamento ILIKE $1 AND ($2 = \'\' OR status = $2) AND (descricao ILIKE $3 OR num_documento ILIKE $3) ORDER BY id LIMIT $4 OFFSET $5',
      ['%' + depto + '%', status, '%' + busca + '%', limit, offset]
    );
    const cnt = await pool.query(
      'SELECT COUNT(*) FROM dossies WHERE departamento ILIKE $1 AND ($2 = \'\' OR status = $2) AND (descricao ILIKE $3 OR num_documento ILIKE $3)',
      ['%' + depto + '%', status, '%' + busca + '%']
    );
    res.json({ data: rows.rows, total: parseInt(cnt.rows[0].count), page: page, limit: limit });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/dossies', auth, async function(req, res) {
  const b = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO dossies (num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [b.num, b.etiqueta_caixa, b.etiqueta_documento, b.caixa_serpro, b.num_documento, b.departamento, b.descricao, b.status || 'Pendente']
    );
    res.status(201).json(r.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/dossies/:id', auth, async function(req, res) {
  const b = req.body;
  try {
    const r = await pool.query(
      'UPDATE dossies SET num=$1, etiqueta_caixa=$2, etiqueta_documento=$3, caixa_serpro=$4, num_documento=$5, departamento=$6, descricao=$7, status=$8 WHERE id=$9 RETURNING *',
      [b.num, b.etiqueta_caixa, b.etiqueta_documento, b.caixa_serpro, b.num_documento, b.departamento, b.descricao, b.status, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Nao encontrado' });
    res.json(r.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/dossies/:id', auth, async function(req, res) {
  try {
    await pool.query('DELETE FROM dossies WHERE id = $1', [req.params.id]);
    res.json({ message: 'Removido' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/dossies/importar', auth, upload.single('file'), async function(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  try {
    const records = parse(req.file.buffer.toString('utf8'), {
      columns: true, skip_empty_lines: true, trim: true
    });
    let inseridos = 0;
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const num = r['N'] || r['num'] || '';
      if (!num) continue;
      await pool.query(
        'INSERT INTO dossies (num, etiqueta_caixa, etiqueta_documento, caixa_serpro, num_documento, departamento, descricao, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [num, r['Etiqueta caixa'] || '', r['Etiqueta documento'] || '', r['Caixa SERPRO'] || '', r['Documento'] || '', r['Departamento'] || '', r['Descricao'] || '', 'Pendente']
      );
      inseridos++;
    }
    res.json({ message: inseridos + ' dossie(s) importado(s)' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/stats', auth, async function(req, res) {
  try {
    const r1 = await pool.query('SELECT COUNT(*) FROM empregados');
    const r2 = await pool.query("SELECT COUNT(*) FROM empregados WHERE status = 'Ativo'");
    const r3 = await pool.query('SELECT COUNT(*) FROM dossies');
    const r4 = await pool.query("SELECT COUNT(*) FROM dossies WHERE status = 'Pendente'");
    res.json({
      totalEmpregados:  parseInt(r1.rows[0].count),
      empregadosAtivos: parseInt(r2.rows[0].count),
      totalDossies:     parseInt(r3.rows[0].count),
      dossiesPendentes: parseInt(r4.rows[0].count)
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, function() { console.log('API SERPRO rodando na porta ' + PORT); });
