'use strict';

const { Router } = require('express');
const authController   = require('../controllers/auth.controller');
const authMiddleware   = require('../middlewares/auth.middleware');
const validate         = require('../middlewares/validate.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');

const router = Router();

// POST /auth/register
router.post('/register', registerValidator, validate, authController.register);

// POST /auth/login
router.post('/login', loginValidator, validate, authController.login);

// GET /auth/me  (rota protegida – retorna dados do token)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
