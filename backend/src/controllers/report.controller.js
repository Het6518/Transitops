const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/report.service');

const alertQuerySchema = z.object({
  withinDays: z.coerce.number().int().positive().default(30),
});

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** GET /reports */
const getReports = asyncHandler(async (req, res) => {
  const data = await svc.getVehicleReportData();
  return res.status(200).json(data);
});

/** GET /reports/license-alerts */
const getLicenseAlerts = asyncHandler(async (req, res) => {
  const parsed = alertQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: zodMessage(parsed.error) } });
  }

  const alerts = await svc.getLicenseAlerts(parsed.data.withinDays);
  return res.status(200).json(alerts);
});

/** GET /reports/maintenance-summary */
const getMaintenanceSummary = asyncHandler(async (req, res) => {
  const summary = await svc.getMaintenanceSummary();
  return res.status(200).json(summary);
});

/** GET /reports/export.csv */
const exportCSV = asyncHandler(async (req, res) => {
  const data = await svc.getVehicleReportData();

  // Define headers
  const headers = [
    'Vehicle ID',
    'Registration No',
    'Name',
    'Type',
    'Total Distance Driven',
    'Total Fuel Consumed',
    'Fuel Efficiency',
    'Total Fuel Cost',
    'Total Maintenance Cost',
    'Operational Cost',
    'Vehicle ROI'
  ];

  // Map rows
  const rows = data.map((v) => [
    v.vehicleId,
    v.regNo,
    v.name,
    v.type,
    v.totalDistanceDriven,
    v.totalFuelConsumed,
    v.fuelEfficiency,
    v.totalFuelCost,
    v.totalMaintenanceCost,
    v.operationalCost,
    v.vehicleROI
  ]);

  // Convert to CSV string, escaping quotes
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          if (typeof val === 'string') {
            const escaped = val.replace(/"/g, '""');
            return `"${escaped}"`;
          }
          return val === null || val === undefined ? '' : String(val);
        })
        .join(',')
    )
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vehicle_report.csv');
  return res.status(200).send(csvContent);
});

module.exports = {
  getReports,
  getLicenseAlerts,
  getMaintenanceSummary,
  exportCSV
};
