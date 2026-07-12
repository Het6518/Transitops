import { ReportsRepository } from './reports.repository';

export class ReportsService {
  private repo = new ReportsRepository();

  async getOverview() {
    return this.repo.getOverviewStats();
  }

  async getFleetReports() {
    return this.repo.getFleetStats();
  }

  async getExpensesReports() {
    return this.repo.getExpensesStats();
  }

  async getFuelReports() {
    return this.repo.getFuelStats();
  }

  async getDriverReports() {
    return this.repo.getDriverStats();
  }

  async getTripReports() {
    return this.repo.getTripStats();
  }

  async exportCSV() {
    const stats = await this.repo.getOverviewStats();
    let csv = 'Metric,Value\n';
    csv += `Total Vehicles,${stats.vehicles}\n`;
    csv += `Total Drivers,${stats.drivers}\n`;
    csv += `Total Trips,${stats.trips}\n`;
    csv += `Total Estimated Revenue ($),${stats.revenue.toFixed(2)}\n`;
    csv += `Total Operational Expenses ($),${stats.expenses.toFixed(2)}\n`;
    csv += `Net Profit ($),${stats.profit.toFixed(2)}\n`;
    return csv;
  }

  async exportPDF() {
    // Generate text/JSON-based outline which the client or print view can format into a clean layout
    const stats = await this.repo.getOverviewStats();
    return {
      title: 'Executive Financial & Operations Report',
      generatedAt: new Date().toISOString(),
      metrics: [
        { label: 'Total Vehicles', value: stats.vehicles },
        { label: 'Total Drivers', value: stats.drivers },
        { label: 'Total Trips', value: stats.trips },
        { label: 'Estimated Revenue', value: `$${stats.revenue.toFixed(2)}` },
        { label: 'Operational Costs', value: `$${stats.expenses.toFixed(2)}` },
        { label: 'Net Operations Income', value: `$${stats.profit.toFixed(2)}` }
      ]
    };
  }
}
