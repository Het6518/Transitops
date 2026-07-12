const { z } = require('zod');
const { zodMessage } = require('../utils/zodMessage');
const svc = require('../services/report.service');
const puppeteer = require('puppeteer');
const prisma = require('../prisma/client');

function formatLongDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

const alertQuerySchema = z.object({
  withinDays: z.coerce.number().int().positive().default(30),
});

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/** GET /reports */
const getReports = asyncHandler(async (req, res) => {
  const data = await svc.getVehicleReportData();

  // Calculate aggregates
  const totalDistance = data.reduce((sum, v) => sum + v.totalDistanceDriven, 0);
  const totalFuel = data.reduce((sum, v) => sum + v.totalFuelConsumed, 0);
  const fuelEfficiency = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0;

  const totalOperationalCost = data.reduce((sum, v) => sum + v.operationalCost, 0);

  const vehicleROI = data.length > 0 ? parseFloat((data.reduce((sum, v) => sum + v.vehicleROI, 0) / data.length).toFixed(2)) : 0;

  const costliestVehicles = [...data]
    .sort((a, b) => b.operationalCost - a.operationalCost)
    .slice(0, 5)
    .map(v => ({
      vehicleId: v.vehicleId,
      regNo: v.regNo,
      totalCost: v.operationalCost
    }));

  const vehicleROIs = [...data]
    .sort((a, b) => b.vehicleROI - a.vehicleROI)
    .slice(0, 5)
    .map(v => ({
      vehicleId: v.vehicleId,
      regNo: v.regNo,
      roi: v.vehicleROI
    }));

  // Fetch fleet utilization
  const prisma = require('../prisma/client');
  const totalVehicles = await prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } });
  const vehiclesOnTrip = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
  const fleetUtilization = totalVehicles > 0 ? parseFloat(((vehiclesOnTrip / totalVehicles) * 100).toFixed(2)) : 0;

  // Fetch fuel logs for trend and vehicle graphs
  const fuelLogs = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: 'asc' }
  });

  return res.status(200).json({
    fuelEfficiency,
    fleetUtilization,
    totalOperationalCost,
    vehicleROI,
    costliestVehicles,
    vehicleROIs,
    fuelLogs
  });
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

/** GET /reports/export.pdf */
const exportPDF = asyncHandler(async (req, res) => {
  const data = await svc.getFleetPdfReportData();

  // Get generating user details
  const requestingUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { role: true }
  });

  const roleNameMap = {
    FLEET_MANAGER: 'Fleet Manager',
    DRIVER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst'
  };

  const userRoleLabel = roleNameMap[requestingUser?.role?.name] || requestingUser?.role?.name || 'System User';
  const generatedByLabel = `${userRoleLabel} (${requestingUser?.email || req.user.email})`;
  const generatedAtLabel = formatLongDate(new Date());

  // Determine license expiry flag helper
  const now = new Date();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TransitOps Fleet Operations Report</title>
      <style>
        @page {
          size: A4;
          margin: 20mm 15mm 20mm 15mm;
        }
        @page :first {
          margin: 0;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Cover Page */
        .cover-page {
          background-color: rgb(55, 19, 103);
          color: #ffffff;
          width: 210mm;
          height: 297mm;
          padding: 75mm 20mm 30mm 20mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          page-break-after: always;
        }
        .cover-center {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cover-badge {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .cover-badge svg {
          width: 32px;
          height: 32px;
          color: #ffffff;
        }
        .cover-title {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #ffffff;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        .cover-subtitle {
          font-size: 18px;
          font-weight: 500;
          color: #ede8f5;
          margin: 0 0 40px 0;
        }
        .cover-meta {
          font-size: 13px;
          color: #ede8f5;
          opacity: 0.8;
          margin: 4px 0;
        }
        .cover-footer {
          font-size: 16px;
          font-weight: 700;
          color: #ede8f5;
          opacity: 0.6;
          letter-spacing: 0.05em;
        }

        /* Content Pages */
        .content-page {
          page-break-after: always;
          padding-top: 5mm;
        }
        .content-page:last-child {
          page-break-after: avoid;
        }
        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e1b4b;
          margin: 0 0 4px 0;
        }
        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 8mm 0;
        }

        /* Stats Cards Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stats-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stats-grid-7 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 4px solid rgb(55, 19, 103);
          border-radius: 8px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 2px;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        thead {
          display: table-header-group;
        }
        tr {
          break-inside: avoid;
        }
        th {
          background-color: rgb(55, 19, 103);
          color: #ffffff;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 10px;
          text-align: left;
        }
        td {
          padding: 9px 10px;
          font-size: 10px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .status-available { background-color: #dcfce7; color: #15803d; }
        .status-ontrip { background-color: #dbeafe; color: #1d4ed8; }
        .status-inshop { background-color: #fee2e2; color: #b91c1c; }
        .status-retired { background-color: #f1f5f9; color: #475569; }
        .status-suspended { background-color: #fef9c3; color: #854d0e; }
        
        .status-dispatched { background-color: #dbeafe; color: #1d4ed8; }
        .status-completed { background-color: #dcfce7; color: #15803d; }
        .status-cancelled { background-color: #f1f5f9; color: #475569; }

        .empty-state {
          text-align: center;
          padding: 32px;
          color: #64748b;
          font-size: 12px;
          border: 1px dashed #e2e8f0;
          border-radius: 8px;
          margin-top: 12px;
        }
        
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .font-semibold {
          font-weight: 600;
        }
        .flag-expired {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .flag-expired-cell {
          background-color: #fee2e2;
          color: #b91c1c;
          font-weight: 600;
        }
        .caption-text {
          font-size: 11px;
          color: #64748b;
          margin-top: 8px;
          font-style: italic;
        }
      </style>
    </head>
    <body>

      <!-- Page 1: Cover Page -->
      <div class="cover-page">
        <div class="cover-center">
          <div class="cover-badge">
            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 class="cover-title">TransitOps</h1>
          <h2 class="cover-subtitle">Fleet Operations Report</h2>
          
          <div class="cover-meta" style="margin-top: 24px;">Generated on ${generatedAtLabel}</div>
          <div class="cover-meta">Generated by ${generatedByLabel}</div>
        </div>
        <div class="cover-footer">TransitOps</div>
      </div>

      <!-- Page 2: Fleet Overview -->
      <div class="content-page">
        <h1 class="section-title">Fleet Overview</h1>
        <p class="section-subtitle">Snapshot as of ${generatedAtLabel}</p>
        
        <div class="stats-grid-7">
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.activeVehicles}</span>
            <span class="stat-label">Active Vehicles</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.availableVehicles}</span>
            <span class="stat-label">Available Vehicles</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.vehiclesInMaintenance}</span>
            <span class="stat-label">In Maintenance</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.activeTrips}</span>
            <span class="stat-label">Active Trips</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.pendingTrips}</span>
            <span class="stat-label">Pending Trips</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.driversOnDuty}</span>
            <span class="stat-label">Drivers on Duty</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.dashboard.fleetUtilization}%</span>
            <span class="stat-label">Fleet Utilization</span>
          </div>
        </div>
      </div>

      <!-- Page 3: Vehicles -->
      <div class="content-page">
        <h1 class="section-title">Vehicles</h1>
        <p class="section-subtitle">Full vehicle registry (${data.vehicles.length} total)</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.vehicles.length}</span>
            <span class="stat-label">Total Vehicles</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.vehicles.filter(v => v.status === 'AVAILABLE').length}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.vehicles.filter(v => v.status === 'IN_SHOP').length}</span>
            <span class="stat-label">In Shop</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.vehicles.filter(v => v.status === 'RETIRED').length}</span>
            <span class="stat-label">Retired</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name / Model</th>
              <th>Type</th>
              <th class="text-right">Max Capacity (kg)</th>
              <th class="text-right">Odometer (km)</th>
              <th class="text-right">Acquisition Cost</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.vehicles.map(v => `
              <tr>
                <td class="font-semibold">${v.regNo}</td>
                <td>${v.name}</td>
                <td>${v.type ? v.type.charAt(0).toUpperCase() + v.type.slice(1) : '—'}</td>
                <td class="text-right">${Number(v.maxLoadKg).toLocaleString()}</td>
                <td class="text-right">${Number(v.odometer).toLocaleString()}</td>
                <td class="text-right">${formatCurrency(v.acquisitionCost)}</td>
                <td class="text-center">
                  <span class="status-badge status-${v.status.toLowerCase().replace('_', '')}">${v.status.replace('_', ' ')}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Page 4: Drivers -->
      <div class="content-page">
        <h1 class="section-title">Drivers</h1>
        <p class="section-subtitle">Full driver roster (${data.drivers.length} total)</p>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.drivers.length}</span>
            <span class="stat-label">Total Drivers</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.drivers.filter(d => d.status === 'AVAILABLE').length}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.drivers.filter(d => d.status === 'ON_TRIP').length}</span>
            <span class="stat-label">On Trip</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.drivers.filter(d => d.status === 'SUSPENDED').length}</span>
            <span class="stat-label">Suspended</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>License No</th>
              <th>Category</th>
              <th>Expiry</th>
              <th>Contact</th>
              <th class="text-center">Safety Score</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.drivers.map(d => {
              const isExpired = new Date(d.licenseExpiry) < now;
              return `
                <tr class="${isExpired ? 'flag-expired' : ''}">
                  <td class="font-semibold">${d.name}</td>
                  <td>${d.licenseNo}</td>
                  <td>${d.licenseCategory}</td>
                  <td class="${isExpired ? 'flag-expired-cell' : ''}">${formatDate(d.licenseExpiry)}</td>
                  <td>${d.phone}</td>
                  <td class="text-center font-semibold">${d.safetyScore}/100</td>
                  <td class="text-center">
                    <span class="status-badge status-${d.status.toLowerCase()}">${d.status}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Page 5: Trips -->
      <div class="content-page">
        <h1 class="section-title">Trips</h1>
        <p class="section-subtitle">Trip activity (${data.trips.length} total in reporting period)</p>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.trips.length}</span>
            <span class="stat-label">Total Trips</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.trips.filter(t => t.status === 'DISPATCHED').length}</span>
            <span class="stat-label">Dispatched/Active</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.trips.filter(t => t.status === 'COMPLETED').length}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.trips.filter(t => t.status === 'CANCELLED').length}</span>
            <span class="stat-label">Cancelled</span>
          </div>
        </div>

        <p class="caption-text" style="margin-bottom: 12px; margin-top: -10px;">Note: Table displays active & completed trips dispatched within the last 30 days.</p>

        ${data.trips.length === 0 ? `
          <div class="empty-state">No trips recorded in the last 30 days</div>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Vehicle (Reg No)</th>
                <th>Driver</th>
                <th class="text-right">Cargo Wt (kg)</th>
                <th class="text-right">Distance (km)</th>
                <th class="text-center">Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.trips.map(t => `
                <tr>
                  <td class="font-semibold">${t.source}</td>
                  <td class="font-semibold">${t.destination}</td>
                  <td>${t.vehicle?.regNo || '—'}</td>
                  <td>${t.driver?.name || '—'}</td>
                  <td class="text-right">${Number(t.cargoWeightKg).toLocaleString()}</td>
                  <td class="text-right">${Number(t.plannedDistance).toLocaleString()}</td>
                  <td class="text-center">
                    <span class="status-badge status-${t.status.toLowerCase()}">${t.status}</span>
                  </td>
                  <td>${formatDate(t.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <!-- Page 6: Maintenance -->
      <div class="content-page">
        <h1 class="section-title">Maintenance</h1>
        <p class="section-subtitle">Service records (${data.maintenance.length} total)</p>

        <div class="stats-grid-3">
          <div class="stat-card">
            <span class="stat-value">${data.maintenance.length}</span>
            <span class="stat-label">Total Records</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.maintenance.filter(m => m.isActive).length}</span>
            <span class="stat-label">Currently In Shop</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.maintenance.filter(m => !m.isActive).length}</span>
            <span class="stat-label">Closed Records</span>
          </div>
        </div>

        ${data.maintenance.length === 0 ? `
          <div class="empty-state">No maintenance records logged</div>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Vehicle (Reg No)</th>
                <th>Service Description</th>
                <th>Opened Date</th>
                <th>Closed Date</th>
                <th class="text-right">Cost</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.maintenance.map(m => `
                <tr>
                  <td class="font-semibold">${m.vehicle?.regNo || '—'}</td>
                  <td>${m.description}</td>
                  <td>${formatDate(m.startDate)}</td>
                  <td>${m.endDate ? formatDate(m.endDate) : '—'}</td>
                  <td class="text-right">${formatCurrency(m.cost)}</td>
                  <td class="text-center">
                    <span class="status-badge status-${m.isActive ? 'inshop' : 'completed'}">${m.isActive ? 'IN SHOP' : 'CLOSED'}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <!-- Page 7: Fuel & Expenses -->
      <div class="content-page">
        <h1 class="section-title">Fuel & Expenses</h1>
        <p class="section-subtitle">Operational cost breakdown</p>

        <div class="stats-grid-3">
          <div class="stat-card">
            <span class="stat-value">${formatCurrency(data.fuelAndExpenses.filter(x => x.type === 'Fuel').reduce((sum, x) => sum + x.cost, 0))}</span>
            <span class="stat-label">Total Fuel Cost</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${formatCurrency(data.fuelAndExpenses.filter(x => x.type !== 'Fuel').reduce((sum, x) => sum + x.cost, 0))}</span>
            <span class="stat-label">Total Other Expenses</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${formatCurrency(data.analytics.totalOperationalCost)}</span>
            <span class="stat-label">Total Operational Cost</span>
          </div>
        </div>

        ${data.fuelAndExpenses.length === 0 ? `
          <div class="empty-state">No operational transactions logged</div>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle (Reg No)</th>
                <th>Type</th>
                <th class="text-right">Liters</th>
                <th class="text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${data.fuelAndExpenses.map(x => `
                <tr>
                  <td>${formatDate(x.date)}</td>
                  <td class="font-semibold">${x.regNo}</td>
                  <td>${x.type}</td>
                  <td class="text-right">${x.liters ? `${x.liters} L` : '—'}</td>
                  <td class="text-right font-semibold">${formatCurrency(x.cost)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>

      <!-- Page 8: Analytics & ROI -->
      <div class="content-page">
        <h1 class="section-title">Analytics & ROI</h1>
        <p class="section-subtitle">Computed performance metrics</p>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">${data.analytics.fuelEfficiency} km/L</span>
            <span class="stat-label">Fuel Efficiency</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.analytics.fleetUtilization}%</span>
            <span class="stat-label">Fleet Utilization</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${formatCurrency(data.analytics.totalOperationalCost)}</span>
            <span class="stat-label">Operational Cost</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${data.analytics.vehicleROI}%</span>
            <span class="stat-label">Vehicle ROI</span>
          </div>
        </div>

        <p class="caption-text" style="margin-bottom: 24px;">ROI formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost &times; 100</p>

        <h2 class="section-title" style="font-size: 16px; margin-bottom: 12px;">Top Costliest Vehicles</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 80px;">Rank</th>
              <th>Vehicle (Reg No)</th>
              <th class="text-right">Total Operational Cost</th>
            </tr>
          </thead>
          <tbody>
            ${data.analytics.costliestVehicles.map((v, i) => `
              <tr>
                <td class="font-semibold text-center">${i + 1}</td>
                <td class="font-semibold">${v.regNo}</td>
                <td class="text-right font-semibold">${formatCurrency(v.totalCost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

    </body>
    </html>
  `;

  // Launch Puppeteer to print PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 45px; box-sizing: border-box; margin-top: 5px;">
        <span style="font-weight: 700; color: rgb(55, 19, 103);">TransitOps</span>
        <span>Fleet Operations Report</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 45px; box-sizing: border-box; margin-bottom: 5px;">
        <span>TransitOps Fleet Report &middot; Generated ${formatDate(new Date())}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();

  const fileName = `transitops-report-${new Date().toISOString().split('T')[0]}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.send(pdfBuffer);
});

module.exports = {
  getReports,
  getLicenseAlerts,
  getMaintenanceSummary,
  exportCSV,
  exportPDF
};
