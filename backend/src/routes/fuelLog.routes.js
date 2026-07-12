const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/fuelLog.controller');

const router = express.Router();

// All fuel log routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /fuel-logs → Create fuel log (FLEET_MANAGER, DRIVER)
router.post('/', requirePermission('fuelLog', 'create'), ctrl.createFuelLog);

// GET    /fuel-logs → List fuel logs (FLEET_MANAGER, DRIVER, FINANCIAL_ANALYST)
router.get('/', requirePermission('fuelLog', 'read'), ctrl.listFuelLogs);

module.exports = router;
