import { PrismaClient, MaintenanceStatus, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

const serviceTypes = [
  'Oil Change',
  'Tire Rotation & Alignment',
  'Brake Inspection & Replacement',
  'Engine Diagnostics',
  'Transmission Flush',
  'Battery Replacement',
  'HVAC System Repair',
  'Fluid Top-off',
  'Suspension Check',
  'Annual Fleet Certification'
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding 40 realistic maintenance records...');

  // Fetch all vehicles
  const vehicles = await prisma.vehicle.findMany();
  if (vehicles.length === 0) {
    console.error('❌ No vehicles found. Seed vehicles first.');
    return;
  }

  // Fetch admin user
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@transitops.com' },
  });

  if (!admin) {
    console.error('❌ Admin user not found. Seed users first.');
    return;
  }

  // Clear existing maintenance
  await prisma.maintenance.deleteMany();
  
  // Create 40 records
  let createdCount = 0;
  
  for (let i = 0; i < 40; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const cost = parseFloat(randomBetween(50, 1500).toFixed(2));
    
    // Status distribution: ~60% COMPLETED, ~20% SCHEDULED, ~10% IN_PROGRESS, ~10% CANCELLED
    const rand = Math.random();
    let status: MaintenanceStatus;
    if (rand < 0.6) status = 'COMPLETED';
    else if (rand < 0.8) status = 'SCHEDULED';
    else if (rand < 0.9) status = 'IN_PROGRESS';
    else status = 'CANCELLED';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fifteenDaysAhead = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    let startDate: Date;
    let endDate: Date | null = null;
    let completedById: string | null = null;

    if (status === 'COMPLETED') {
      startDate = getRandomDate(thirtyDaysAgo, new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
      // End date 1-3 days after start date
      endDate = new Date(startDate.getTime() + randomBetween(1, 3) * 24 * 60 * 60 * 1000);
      completedById = admin.id;
    } else if (status === 'SCHEDULED') {
      startDate = getRandomDate(now, fifteenDaysAhead);
    } else if (status === 'IN_PROGRESS') {
      startDate = getRandomDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), now);
    } else {
      // CANCELLED
      startDate = getRandomDate(thirtyDaysAgo, now);
    }

    await prisma.maintenance.create({
      data: {
        vehicleId: vehicle.id,
        serviceType,
        description: `Standard ${serviceType.toLowerCase()} service required for vehicle ${vehicle.plateNumber}.`,
        cost,
        status,
        startDate,
        endDate,
        createdById: admin.id,
        completedById,
      }
    });

    // If IN_PROGRESS, update vehicle status to IN_SHOP (if not already IN_SHOP)
    if (status === 'IN_PROGRESS' && vehicle.status !== 'IN_SHOP') {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: 'IN_SHOP' }
      });
    }

    createdCount++;
  }

  console.log(`✅ Successfully seeded ${createdCount} maintenance records.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
