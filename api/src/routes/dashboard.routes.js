'use strict';

const { Router }      = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware      = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

// GET /dashboard/metrics
router.get('/metrics', dashboardController.metrics);

module.exports = router;
