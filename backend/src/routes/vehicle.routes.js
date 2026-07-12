const express              = require('express');
const { authenticate }     = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl                 = require('../controllers/vehicle.controller');

const router = express.Router();

// All vehicle routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /vehicles          → create (FLEET_MANAGER only)
router.post(  '/',    requirePermission('vehicle', 'create'), ctrl.createVehicle);

// GET    /vehicles          → list with filters (FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST)
router.get(   '/',    requirePermission('vehicle', 'read'),   ctrl.listVehicles);

// GET    /vehicles/:id      → single vehicle
router.get(   '/:id', requirePermission('vehicle', 'read'),   ctrl.getVehicle);

// PATCH  /vehicles/:id      → update fields or status (FLEET_MANAGER only)
router.patch( '/:id', requirePermission('vehicle', 'update'), ctrl.updateVehicle);

// DELETE /vehicles/:id      → remove (FLEET_MANAGER only)
router.delete('/:id', requirePermission('vehicle', 'delete'), ctrl.deleteVehicle);

module.exports = router;
