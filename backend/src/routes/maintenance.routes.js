const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/maintenance.controller');

const router = express.Router();

// All maintenance routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /maintenance           → Open maintenance (FLEET_MANAGER)
router.post('/', requirePermission('maintenance', 'create'), ctrl.openMaintenance);

// PATCH  /maintenance/:id/close → Close maintenance (FLEET_MANAGER)
router.patch('/:id/close', requirePermission('maintenance', 'update'), ctrl.closeMaintenance);

// GET    /maintenance           → List maintenance logs (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/', requirePermission('maintenance', 'read'), ctrl.listMaintenance);

module.exports = router;
