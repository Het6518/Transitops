import { ExpenseRepository } from './expenses.repository';
import { Prisma } from '@prisma/client';

export class ExpenseService {
  private repo = new ExpenseRepository();

  async getExpenses(params: {
    page: number;
    limit: number;
    vehicleId?: string;
    category?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.ExpenseWhereInput = {};
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.category) where.category = params.category;

    const { data, total } = await this.repo.findAll({
      skip,
      take: params.limit,
      where,
      orderBy: { date: 'desc' }
    });

    return {
      data,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
        hasNext: params.page < Math.ceil(total / params.limit),
        hasPrev: params.page > 1
      }
    };
  }

  async getExpenseById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) throw new Error('Expense not found');
    return record;
  }

  async getStatistics() {
    return this.repo.getStatistics();
  }

  async createExpense(data: {
    vehicleId: string;
    tripId?: string | null;
    category: string;
    amount: number;
    date?: string;
    description?: string | null;
  }) {
    return this.repo.create({
      vehicle: { connect: { id: data.vehicleId } },
      trip: data.tripId ? { connect: { id: data.tripId } } : undefined,
      category: data.category,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description || null
    });
  }

  async updateExpense(id: string, data: {
    vehicleId?: string;
    tripId?: string | null;
    category?: string;
    amount?: number;
    date?: string;
    description?: string | null;
  }) {
    const updateData: Prisma.ExpenseUpdateInput = {};
    if (data.vehicleId) updateData.vehicle = { connect: { id: data.vehicleId } };
    if (data.tripId !== undefined) {
      updateData.trip = data.tripId ? { connect: { id: data.tripId } } : { disconnect: true };
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date) updateData.date = new Date(data.date);
    if (data.description !== undefined) updateData.description = data.description;

    return this.repo.update(id, updateData);
  }

  async deleteExpense(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Expense not found');
    await this.repo.delete(id);
    return true;
  }
}
