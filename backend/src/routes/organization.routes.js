const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/organization.controller');

const router = express.Router();

// All organization routes require authentication
router.use(authenticate);

// GET /organizations       → List organizations (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/', requirePermission('report', 'read'), ctrl.listOrganizations);

// GET /organizations/:id/report → Generate PDF organization report (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/:id/report', requirePermission('report', 'read'), ctrl.generateReportPdf);

module.exports = router;
