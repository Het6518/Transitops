const express               = require('express');
const { authenticate }      = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl                  = require('../controllers/driver.controller');

const router = express.Router();

// All driver routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /drivers        → create (FLEET_MANAGER, SAFETY_OFFICER)
router.post(  '/',    requirePermission('driver', 'create'), ctrl.createDriver);

// POST   /drivers/send-expiry-reminders → trigger notifications (FLEET_MANAGER, SAFETY_OFFICER)
router.post(  '/send-expiry-reminders', requirePermission('driver', 'create'), ctrl.triggerExpiryReminders);

// GET    /drivers        → list with optional ?status= filter
router.get(   '/',    requirePermission('driver', 'read'),   ctrl.listDrivers);

// GET    /drivers/:id    → single driver
router.get(   '/:id', requirePermission('driver', 'read'),   ctrl.getDriver);

// PATCH  /drivers/:id    → update (FLEET_MANAGER, SAFETY_OFFICER)
router.patch( '/:id', requirePermission('driver', 'update'), ctrl.updateDriver);

// DELETE /drivers/:id    → remove (FLEET_MANAGER, SAFETY_OFFICER)
router.delete('/:id', requirePermission('driver', 'delete'), ctrl.deleteDriver);

module.exports = router;
