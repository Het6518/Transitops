import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './vehicles.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

/**
 * @swagger
 * /vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Retrieve a paginated list of vehicles
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requirePermission('fleet:read'), controller.getVehicles);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get detailed view of a vehicle
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', requirePermission('fleet:read'), controller.getVehicleById);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Register a new vehicle
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requirePermission('fleet:create'), controller.createVehicle);

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     tags: [Vehicles]
 *     summary: Edit details of a vehicle
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requirePermission('fleet:update'), controller.updateVehicle);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Deregister / delete a vehicle
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requirePermission('fleet:delete'), controller.deleteVehicle);

export default router;
