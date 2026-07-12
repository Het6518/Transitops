import { Router } from 'express';
import healthRouter from './health/health.routes';
import authRouter from './auth/auth.routes';
import permissionsRouter from './permissions/permissions.routes';
import dashboardRouter from './dashboard/dashboard.routes';
import vehiclesRouter from './vehicles/vehicles.routes';
import driversRouter from './drivers/drivers.routes';
import tripsRouter from './trips/trips.routes';
import maintenanceRouter from './maintenance/maintenance.routes';
import fuelRouter from './fuel/fuel.routes';
import expensesRouter from './expenses/expenses.routes';
import reportsRouter from './reports/reports.routes';
import usersRouter from './users/users.routes';
import rolesRouter from './roles/roles.routes';
import auditRouter from './audit/audit.routes';

const router = Router();

// Mount feature routers
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/drivers', driversRouter);
router.use('/trips', tripsRouter);
router.use('/maintenance', maintenanceRouter);
router.use('/fuel', fuelRouter);
router.use('/expenses', expensesRouter);
router.use('/reports', reportsRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/audit', auditRouter);
router.use('/', permissionsRouter);

export default router;
