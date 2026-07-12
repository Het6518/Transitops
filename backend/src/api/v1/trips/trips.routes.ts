import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './trips.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Special stats route (must declare before /:id)
router.get('/routes', requirePermission('trips:read'), controller.getRoutes);
router.get('/statistics', requirePermission('trips:read'), controller.getTripStatistics);

/**
 * @swagger
 * /trips:
 *   get:
 *     tags: [Trips]
 *     summary: Retrieve a paginated list of trips
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requirePermission('trips:read'), controller.getTrips);

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     tags: [Trips]
 *     summary: Get detailed view of a trip
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requirePermission('trips:read'), controller.getTripById);

/**
 * @swagger
 * /trips:
 *   post:
 *     tags: [Trips]
 *     summary: Log a new trip (DRAFT status)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requirePermission('trips:create'), controller.createTrip);

/**
 * @swagger
 * /trips/{id}:
 *   put:
 *     tags: [Trips]
 *     summary: Update draft trip parameters
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requirePermission('trips:update'), controller.updateTrip);

/**
 * @swagger
 * /trips/{id}/dispatch:
 *   post:
 *     tags: [Trips]
 *     summary: Dispatch trip to start execution
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/dispatch', requirePermission('trips:update'), controller.dispatchTrip);

/**
 * @swagger
 * /trips/{id}/complete:
 *   post:
 *     tags: [Trips]
 *     summary: Log completion of a trip
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/complete', requirePermission('trips:update'), controller.completeTrip);

/**
 * @swagger
 * /trips/{id}/cancel:
 *   post:
 *     tags: [Trips]
 *     summary: Cancel a trip
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/cancel', requirePermission('trips:update'), controller.cancelTrip);

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     tags: [Trips]
 *     summary: Delete a draft or cancelled trip
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePermission('trips:delete'), controller.deleteTrip);

export default router;
