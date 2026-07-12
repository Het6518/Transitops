const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/expense.controller');

const router = express.Router();

// All expense routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /expenses → Create expense (FLEET_MANAGER, DRIVER)
router.post('/', requirePermission('expense', 'create'), ctrl.createExpense);

// GET    /expenses → List expenses (FLEET_MANAGER, DRIVER, FINANCIAL_ANALYST)
router.get('/', requirePermission('expense', 'read'), ctrl.listExpenses);

// PATCH  /expenses/:id → Update expense (FLEET_MANAGER, DRIVER)
router.patch('/:id', requirePermission('expense', 'update'), ctrl.updateExpense);

// DELETE /expenses/:id → Delete expense (FLEET_MANAGER, DRIVER)
router.delete('/:id', requirePermission('expense', 'delete'), ctrl.deleteExpense);

module.exports = router;
