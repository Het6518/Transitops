const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/dashboard.controller');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /dashboard → Get dashboard KPIs (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get('/', requirePermission('dashboard', 'read'), ctrl.getDashboard);

module.exports = router;
