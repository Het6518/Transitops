import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing operational tables to prevent enum migration block...');
  
  // Delete in order to satisfy foreign key constraints
  await prisma.trip.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.vehicle.deleteMany({});

  console.log('✅ Operational tables cleared.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
