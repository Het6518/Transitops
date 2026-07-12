import { Router } from 'express';
import healthRouter from './health/health.routes';
import authRouter from './auth/auth.routes';
import permissionsRouter from './permissions/permissions.routes';
import dashboardRouter from './dashboard/dashboard.routes';
import vehiclesRouter from './vehicles/vehicles.routes';
import driversRouter from './drivers/drivers.routes';
import tripsRouter from './trips/trips.routes';

const router = Router();

// Mount feature routers
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/drivers', driversRouter);
router.use('/trips', tripsRouter);
router.use('/', permissionsRouter);

// Future modules will be mounted here:
// router.use('/fleet', fleetRouter);
// router.use('/routes', routeRouter);
// router.use('/drivers', driverRouter);
// router.use('/trips', tripRouter);
// router.use('/maintenance', maintenanceRouter);
// router.use('/fuel', fuelRouter);
// router.use('/finance', financeRouter);
// router.use('/reports', reportsRouter);
// router.use('/users', usersRouter);
// router.use('/settings', settingsRouter);

export default router;
