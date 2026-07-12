const puppeteer = require('puppeteer');
const prisma = require('../prisma/client');
const svc = require('../services/organization.service');

// Helper to format date as "Mon D, YYYY" (e.g. "Jul 7, 2026")
function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper to handle empty/null values as em-dash
function val(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '—';
  }
  return value;
}

/**
 * GET /organizations
 * List all organizations.
 */
const listOrganizations = async (req, res, next) => {
  try {
    const orgs = await svc.listOrganizations();
    return res.status(200).json(orgs);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /organizations/:id/report
 * Generate A4 PDF Report.
 */
const generateReportPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgData = await svc.getOrganizationReportData(id);

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
    const generatedAtLabel = formatDate(new Date());

    // Construct the HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Organization Report - ${orgData.organization.name}</title>
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
            background-color: #0f172a;
            color: #ffffff;
            width: 210mm;
            height: 297mm;
            padding: 70mm 20mm 30mm 20mm;
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
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: rgb(30, 41, 59);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
          }
          .cover-badge svg {
            width: 28px;
            height: 28px;
            color: #94a3b8;
          }
          .cover-title {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.1em;
            color: #94a3b8;
            text-transform: uppercase;
            margin: 0 0 8px 0;
          }
          .cover-subtitle {
            font-size: 18px;
            font-weight: 500;
            color: #cbd5e1;
            margin: 0 0 16px 0;
          }
          .cover-org-name {
            font-size: 36px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 40px 0;
          }
          .cover-meta {
            font-size: 12px;
            color: #94a3b8;
            margin: 4px 0;
          }
          .cover-footer {
            font-size: 16px;
            font-weight: 700;
            color: #475569;
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
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .section-subtitle {
            font-size: 12px;
            color: #64748b;
            margin: 0 0 8mm 0;
          }

          /* Info Grid (Page 2) */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .info-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            word-break: break-word;
          }

          /* Stats Summary Row (Pages 3, 4) */
          .stats-row {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            flex: 1;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
          }
          .stat-label {
            font-size: 11px;
            font-weight: 500;
            color: #64748b;
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
            background-color: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1.5px solid #e2e8f0;
          }
          td {
            padding: 10px 10px;
            font-size: 11px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          .empty-state {
            text-align: center;
            padding: 32px;
            color: #64748b;
            font-size: 13px;
            border: 1px dashed #e2e8f0;
            border-radius: 8px;
            margin-top: 12px;
          }
        </style>
      </head>
      <body>

        <!-- Page 1: Cover Page -->
        <div class="cover-page">
          <div class="cover-center">
            <div class="cover-badge">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h1 class="cover-title">ORGANIZATION REPORT</h1>
            <h2 class="cover-subtitle">Organization Report</h2>
            <div class="cover-org-name">${orgData.organization.name}</div>
            
            <div class="cover-meta" style="margin-top: 24px;">Generated on ${generatedAtLabel}</div>
            <div class="cover-meta">Generated by ${generatedByLabel}</div>
          </div>
          <div class="cover-footer">Serin</div>
        </div>

        <!-- Page 2: Organization Information -->
        <div class="content-page">
          <h1 class="section-title">Organization Information</h1>
          <p class="section-subtitle">Complete profile summary for ${orgData.organization.name}</p>
          
          <div class="info-grid">
            <div class="info-card">
              <span class="info-label">Organization Name</span>
              <span class="info-value">${val(orgData.organization.name)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Email</span>
              <span class="info-value">${val(orgData.organization.email)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Phone</span>
              <span class="info-value">${val(orgData.organization.phone)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Website</span>
              <span class="info-value">${val(orgData.organization.website)}</span>
            </div>
            <div class="info-card" style="grid-column: span 2;">
              <span class="info-label">Address</span>
              <span class="info-value">${val(orgData.organization.address)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Organization Type</span>
              <span class="info-value">${val(orgData.organization.orgType)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Founded Year</span>
              <span class="info-value">${val(orgData.organization.foundedYear)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Team Size</span>
              <span class="info-value">${val(orgData.organization.teamSize)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Domains of Work</span>
              <span class="info-value">${orgData.organization.domainsOfWork && orgData.organization.domainsOfWork.length > 0 ? orgData.organization.domainsOfWork.join(', ') : '—'}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Subscription Plan</span>
              <span class="info-value">${val(orgData.organization.subscriptionPlan)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Organization ID</span>
              <span class="info-value" style="font-family: monospace; font-size: 11px;">${val(orgData.organization.id)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Created Date</span>
              <span class="info-value">${formatDate(orgData.organization.createdAt)}</span>
            </div>
            <div class="info-card">
              <span class="info-label">Last Updated</span>
              <span class="info-value">${formatDate(orgData.organization.updatedAt)}</span>
            </div>
          </div>
        </div>

        <!-- Page 3: Jobs -->
        <div class="content-page">
          <h1 class="section-title">Jobs</h1>
          <p class="section-subtitle">Organization job postings with application pipeline counts</p>

          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-value">${orgData.jobsSummary.totalJobs}</span>
              <span class="stat-label">Total Jobs</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${orgData.jobsSummary.openJobs}</span>
              <span class="stat-label">Open Jobs</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${orgData.jobsSummary.totalApplications}</span>
              <span class="stat-label">Total Applications</span>
            </div>
          </div>

          ${orgData.jobs.length === 0 ? `
            <div class="empty-state">No jobs posted yet</div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Location</th>
                  <th>Domain</th>
                  <th>Visibility</th>
                  <th>Created</th>
                  <th>Applied</th>
                  <th>Short Intv.</th>
                  <th>Offers</th>
                </tr>
              </thead>
              <tbody>
                ${orgData.jobs.map(j => `
                  <tr>
                    <td style="font-weight: 600; color: #0f172a;">${j.title}</td>
                    <td>${[j.workType, j.employmentType, j.contractType].filter(Boolean).join(' · ')}</td>
                    <td>${j.mode}</td>
                    <td>${val(j.location)}</td>
                    <td>${j.domain}</td>
                    <td>${j.visibility}</td>
                    <td>${formatDate(j.createdAt)}</td>
                    <td style="font-weight: 600; text-align: center;">${j.appliedCount}</td>
                    <td style="text-align: center;">${j.shortlistedCount}</td>
                    <td style="text-align: center;">${j.offersCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <!-- Page 4: Current Members -->
        <div class="content-page">
          <h1 class="section-title">Current Members</h1>
          <p class="section-subtitle">Active organization members and roles</p>

          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-value">${orgData.membersSummary.totalMembers}</span>
              <span class="stat-label">Total Members</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${orgData.membersSummary.admins}</span>
              <span class="stat-label">Admins</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${orgData.membersSummary.managers}</span>
              <span class="stat-label">Managers</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${orgData.membersSummary.members}</span>
              <span class="stat-label">Members</span>
            </div>
          </div>

          ${orgData.members.length === 0 ? `
            <div class="empty-state">No members found</div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                ${orgData.members.map(m => `
                  <tr>
                    <td style="font-weight: 600; color: #0f172a;">${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.role}</td>
                    <td>
                      <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; 
                        background-color: ${m.status === 'Active' ? '#dcfce7' : '#fef9c3'}; 
                        color: ${m.status === 'Active' ? '#15803d' : '#854d0e'};">
                        ${m.status}
                      </span>
                    </td>
                    <td>${formatDate(m.joinedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
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
          <span style="font-weight: 700; color: #475569;">Serin</span>
          <span>Organization Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 45px; box-sizing: border-box; margin-bottom: 5px;">
          <span>Organization Report &middot; ${orgData.organization.name}</span>
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

    const fileName = `organization-report-${orgData.organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listOrganizations,
  generateReportPdf
};
