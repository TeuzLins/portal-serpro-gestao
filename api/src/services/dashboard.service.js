'use strict';

const dashboardRepository = require('../repositories/dashboard.repository');

const dashboardService = {
  async getMetrics() {
    return dashboardRepository.getMetrics();
  },
};

module.exports = dashboardService;
