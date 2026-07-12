const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/report.controller');

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /reports/license-alerts     → Get drivers with expiring licenses (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/license-alerts', requirePermission('report', 'read'), ctrl.getLicenseAlerts);

// GET /reports/maintenance-summary → Maintenance summary per vehicle (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/maintenance-summary', requirePermission('report', 'read'), ctrl.getMaintenanceSummary);

// GET /reports/export.csv         → Export CSV of vehicle report data (FLEET_MANAGER, FINANCIAL_ANALYST - we check 'report:read')
router.get('/export.csv', requirePermission('report', 'read'), ctrl.exportCSV);

// GET /reports                    → Get general vehicle report data (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/', requirePermission('report', 'read'), ctrl.getReports);

module.exports = router;
