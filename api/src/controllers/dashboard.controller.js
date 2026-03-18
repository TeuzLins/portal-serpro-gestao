'use strict';

const dashboardService = require('../services/dashboard.service');
const { ok }           = require('../utils/response');

const dashboardController = {
  /**
   * GET /dashboard/metrics
   */
  async metrics(req, res) {
    const data = await dashboardService.getMetrics();
    return ok(res, data);
  },
};

module.exports = dashboardController;
