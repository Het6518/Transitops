import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expenseCategories = ['MAINTENANCE', 'TOLL', 'PARKING', 'MISC', 'REPAIR'];
const fuelTypes = ['Diesel', 'Petrol', 'Electric'];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding 100 Fuel Logs and 80 Expenses...');

  const vehicles = await prisma.vehicle.findMany();
  const drivers = await prisma.driver.findMany();
  const trips = await prisma.trip.findMany();
  const admin = await prisma.user.findFirst({ where: { email: 'admin@transitops.com' } });

  if (!vehicles.length || !drivers.length || !trips.length || !admin) {
    console.error('❌ Missing prerequisite data (Vehicles, Drivers, Trips, or Admin). Run core seeds first.');
    return;
  }

  // Clear existing data
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();

  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 1. Seed 100 Fuel Logs
  let fuelCount = 0;
  for (let i = 0; i < 100; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const trip = Math.random() > 0.5 ? trips[Math.floor(Math.random() * trips.length)] : null;
    const liters = randomBetween(20, 150);
    const costPerLiter = randomBetween(1.2, 2.5);

    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        driverId: driver.id,
        tripId: trip?.id || null,
        userId: admin.id,
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        liters: parseFloat(liters.toFixed(2)),
        cost: parseFloat((liters * costPerLiter).toFixed(2)),
        odometer: parseFloat(randomBetween(1000, 150000).toFixed(1)),
        loggedAt: getRandomDate(threeMonthsAgo, now)
      }
    });
    fuelCount++;
  }

  // 2. Seed 80 Expenses
  let expenseCount = 0;
  for (let i = 0; i < 80; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const trip = Math.random() > 0.6 ? trips[Math.floor(Math.random() * trips.length)] : null;
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const amount = randomBetween(10, 500);

    await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        tripId: trip?.id || null,
        category,
        amount: parseFloat(amount.toFixed(2)),
        description: `Random ${category.toLowerCase()} expense for operations`,
        date: getRandomDate(threeMonthsAgo, now)
      }
    });
    expenseCount++;
  }

  console.log(`✅ Successfully seeded ${fuelCount} Fuel Logs and ${expenseCount} Expenses.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
