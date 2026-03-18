-- ─────────────────────────────────────────────────────────────────────────────
--  Portal SERPRO – Script de inicialização do banco de dados
--  Executado automaticamente na primeira inicialização do container PostgreSQL
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL       PRIMARY KEY,
  username    VARCHAR(50)  UNIQUE NOT NULL,
  password    TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Tabela de empregados
CREATE TABLE IF NOT EXISTS empregados (
  id              SERIAL       PRIMARY KEY,
  cd_cpf          VARCHAR(20),
  cd_matricula    VARCHAR(30),
  nm_pessoa       VARCHAR(200) NOT NULL,
  nm_regional     VARCHAR(200),
  dt_admissao     DATE,
  dt_desligamento DATE,
  status          VARCHAR(20)  NOT NULL DEFAULT 'Ativo'
                               CHECK (status IN ('Ativo', 'Inativo', 'Afastado')),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- Tabela de dossiês
CREATE TABLE IF NOT EXISTS dossies (
  id                  SERIAL       PRIMARY KEY,
  num                 VARCHAR(20)  NOT NULL,
  etiqueta_caixa      VARCHAR(100),
  etiqueta_documento  VARCHAR(100),
  caixa_serpro        VARCHAR(50),
  num_documento       VARCHAR(100),
  departamento        VARCHAR(100),
  descricao           TEXT,
  status              VARCHAR(30)  NOT NULL DEFAULT 'Pendente'
                                   CHECK (status IN ('Pendente', 'Em andamento', 'Concluído', 'Arquivado')),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Índices para performance nas consultas mais comuns ────────────────────────
CREATE INDEX IF NOT EXISTS idx_empregados_nm_pessoa   ON empregados USING gin(to_tsvector('portuguese', nm_pessoa));
CREATE INDEX IF NOT EXISTS idx_empregados_status      ON empregados(status);
CREATE INDEX IF NOT EXISTS idx_empregados_nm_regional ON empregados(nm_regional);
CREATE INDEX IF NOT EXISTS idx_empregados_cd_cpf      ON empregados(cd_cpf);

CREATE INDEX IF NOT EXISTS idx_dossies_status         ON dossies(status);
CREATE INDEX IF NOT EXISTS idx_dossies_departamento   ON dossies(departamento);
CREATE INDEX IF NOT EXISTS idx_dossies_num            ON dossies(num);

-- ── Trigger para atualizar updated_at automaticamente ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empregados_updated_at
  BEFORE UPDATE ON empregados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_dossies_updated_at
  BEFORE UPDATE ON dossies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Usuário admin padrão (senha: admin123 – ALTERE EM PRODUÇÃO) ──────────────
-- Hash bcrypt de 'admin123' com custo 12
INSERT INTO usuarios (username, password)
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY.5AkGGWiCpEf2')
ON CONFLICT (username) DO NOTHING;
