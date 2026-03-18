'use strict';

require('express-async-errors'); // Captura erros async sem try/catch em controllers
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const routes      = require('./routes');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

// ── Segurança: cabeçalhos HTTP seguros ───────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting global ─────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
}));

// ── Logging HTTP ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health check (sem autenticação) ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Portal SERPRO API',
    version: process.env.npm_package_version || '2.0.0',
    env:     process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Rotas da API ─────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Rota não encontrada (404) ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ── Handler global de erros (deve ser o último middleware) ───────────────────
app.use(errorHandler);

module.exports = app;
