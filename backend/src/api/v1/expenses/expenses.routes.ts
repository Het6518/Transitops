import { Router } from 'express';
import { authenticate } from '../../../middleware/auth.middleware';
import { requirePermission } from '../../../middleware/permission.middleware';
import * as controller from './expenses.controller';

const router = Router();

router.use(authenticate);

router.get('/statistics', requirePermission('expenses:read'), controller.getExpenseStatistics);
router.get('/', requirePermission('expenses:read'), controller.getExpenses);
router.post('/', requirePermission('expenses:write'), controller.createExpense);
router.get('/:id', requirePermission('expenses:read'), controller.getExpenseById);
router.put('/:id', requirePermission('expenses:write'), controller.updateExpense);
router.delete('/:id', requirePermission('expenses:delete'), controller.deleteExpense);

export default router;
