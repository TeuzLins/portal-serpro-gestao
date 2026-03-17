CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100) UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empregados (
  id              SERIAL PRIMARY KEY,
  cd_cpf          VARCHAR(20),
  cd_matricula    VARCHAR(30),
  nm_pessoa       VARCHAR(200) NOT NULL,
  nm_regional     VARCHAR(200),
  dt_admissao     DATE,
  dt_desligamento DATE,
  status          VARCHAR(20) DEFAULT 'Ativo',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossies (
  id                  SERIAL PRIMARY KEY,
  num                 VARCHAR(20),
  etiqueta_caixa      VARCHAR(100),
  etiqueta_documento  VARCHAR(100),
  caixa_serpro        VARCHAR(50),
  num_documento       VARCHAR(100),
  departamento        VARCHAR(100),
  descricao           TEXT,
  status              VARCHAR(30) DEFAULT 'Pendente',
  created_at          TIMESTAMP DEFAULT NOW()
);
