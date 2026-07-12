const prisma = require('../prisma/client');

/**
 * List all organizations.
 */
async function listOrganizations() {
  return prisma.organization.findMany({
    orderBy: { name: 'asc' }
  });
}

/**
 * Get report data for a specific organization.
 */
async function getOrganizationReportData(id) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' }
      },
      members: {
        orderBy: { joinedAt: 'asc' }
      }
    }
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  // Compute jobs summary
  const totalJobs = org.jobs.length;
  const totalApplications = org.jobs.reduce((sum, job) => sum + job.appliedCount, 0);

  const jobsSummary = {
    totalJobs,
    openJobs: totalJobs, // All seeded jobs are considered open
    totalApplications
  };

  // Compute members summary
  const totalMembers = org.members.length;
  const admins = org.members.filter(m => m.role.toLowerCase() === 'admin').length;
  const managers = org.members.filter(m => m.role.toLowerCase() === 'manager').length;
  const members = org.members.filter(m => m.role.toLowerCase() === 'member').length;

  const membersSummary = {
    totalMembers,
    admins,
    managers,
    members
  };

  return {
    organization: {
      id: org.id,
      name: org.name,
      email: org.email,
      phone: org.phone,
      website: org.website,
      address: org.address,
      orgType: org.orgType,
      foundedYear: org.foundedYear,
      teamSize: org.teamSize,
      domainsOfWork: org.domainsOfWork,
      subscriptionPlan: org.subscriptionPlan,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    },
    jobsSummary,
    jobs: org.jobs.map(j => ({
      title: j.title,
      employmentType: j.employmentType,
      workType: j.workType,
      contractType: j.contractType,
      mode: j.mode,
      location: j.location,
      domain: j.domain,
      visibility: j.visibility,
      createdAt: j.createdAt,
      appliedCount: j.appliedCount,
      shortlistedCount: j.shortlistedCount,
      offersCount: j.offersCount
    })),
    membersSummary,
    members: org.members.map(m => ({
      name: m.name,
      email: m.email,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt
    }))
  };
}

module.exports = {
  listOrganizations,
  getOrganizationReportData
};
