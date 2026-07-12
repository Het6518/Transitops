const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/requirePermission');
const ctrl = require('../controllers/trip.controller');

const router = express.Router();

// All trip routes require authentication
router.use(authenticate);

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST   /trips            → create DRAFT (DRIVER only in matrix)
router.post('/', requirePermission('trip', 'create'), ctrl.createTrip);

// GET    /trips            → list trips (All roles)
router.get('/', requirePermission('trip', 'read'), ctrl.listTrips);

// GET    /trips/:id        → single trip (All roles)
router.get('/:id', requirePermission('trip', 'read'), ctrl.getTrip);

// PATCH  /trips/:id        → update DRAFT fields (DRIVER only in matrix)
router.patch('/:id', requirePermission('trip', 'update'), ctrl.updateTrip);

// POST   /trips/:id/dispatch → dispatch DRAFT trip (DRIVER only in matrix)
router.post('/:id/dispatch', requirePermission('trip', 'dispatch'), ctrl.dispatchTrip);

// POST   /trips/:id/complete → complete DISPATCHED trip (DRIVER only in matrix)
router.post('/:id/complete', requirePermission('trip', 'complete'), ctrl.completeTrip);

// POST   /trips/:id/cancel   → cancel DRAFT or DISPATCHED trip (DRIVER only in matrix)
router.post('/:id/cancel', requirePermission('trip', 'cancel'), ctrl.cancelTrip);

module.exports = router;
