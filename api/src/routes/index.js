'use strict';

const { Router } = require('express');
const authRoutes      = require('./auth.routes');
const empregadoRoutes = require('./empregado.routes');
const dossieRoutes    = require('./dossie.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = Router();

router.use('/auth',       authRoutes);
router.use('/empregados', empregadoRoutes);
router.use('/dossies',    dossieRoutes);
router.use('/dashboard',  dashboardRoutes);

module.exports = router;
