import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding 20 realistic vehicles...');

  const vehicles = [
    { plateNumber: 'TX-1001', model: 'Volvo 7900 Electric', type: 'Bus', status: VehicleStatus.AVAILABLE, fuelType: 'Electric', fuelCapacity: 350, mileage: 14200.5 },
    { plateNumber: 'TX-1002', model: 'Mercedes-Benz Citaro', type: 'Bus', status: VehicleStatus.ON_TRIP, fuelType: 'Diesel', fuelCapacity: 280, mileage: 48900.2 },
    { plateNumber: 'TX-1003', model: 'Toyota HiAce', type: 'Van', status: VehicleStatus.AVAILABLE, fuelType: 'Petrol', fuelCapacity: 70, mileage: 82500.1 },
    { plateNumber: 'TX-1004', model: 'Ford Transit', type: 'Van', status: VehicleStatus.IN_SHOP, fuelType: 'Diesel', fuelCapacity: 80, mileage: 98150.4 },
    { plateNumber: 'TX-1005', model: 'Scania Citywide', type: 'Bus', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 300, mileage: 154100.8 },
    { plateNumber: 'TX-1006', model: 'BYD K9 Electric', type: 'Bus', status: VehicleStatus.ON_TRIP, fuelType: 'Electric', fuelCapacity: 324, mileage: 23400.0 },
    { plateNumber: 'TX-1007', model: 'Mercedes-Benz Sprinter', type: 'Van', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 75, mileage: 64200.3 },
    { plateNumber: 'TX-1008', model: 'Volvo FH16', type: 'Truck', status: VehicleStatus.IN_SHOP, fuelType: 'Diesel', fuelCapacity: 450, mileage: 191200.9 },
    { plateNumber: 'TX-1009', model: 'Hyundai County', type: 'Bus', status: VehicleStatus.RETIRED, fuelType: 'Diesel', fuelCapacity: 95, mileage: 345000.5 },
    { plateNumber: 'TX-1010', model: 'Isuzu Elf', type: 'Truck', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 100, mileage: 114300.7 },
    { plateNumber: 'TX-1011', model: 'Ford E-Transit', type: 'Van', status: VehicleStatus.AVAILABLE, fuelType: 'Electric', fuelCapacity: 68, mileage: 12100.4 },
    { plateNumber: 'TX-1012', model: 'Chevrolet Express', type: 'Van', status: VehicleStatus.ON_TRIP, fuelType: 'Petrol', fuelCapacity: 117, mileage: 105600.8 },
    { plateNumber: 'TX-1013', model: 'Freightliner Cascadia', type: 'Truck', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 600, mileage: 220100.2 },
    { plateNumber: 'TX-1014', model: 'Tesla Semi', type: 'Truck', status: VehicleStatus.ON_TRIP, fuelType: 'Electric', fuelCapacity: 500, mileage: 42000.5 },
    { plateNumber: 'TX-1015', model: 'Kenworth T680', type: 'Truck', status: VehicleStatus.IN_SHOP, fuelType: 'Diesel', fuelCapacity: 550, mileage: 310500.9 },
    { plateNumber: 'TX-1016', model: 'Gillig Low Floor', type: 'Bus', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 350, mileage: 275300.4 },
    { plateNumber: 'TX-1017', model: 'Proterra Catalyst', type: 'Bus', status: VehicleStatus.ON_TRIP, fuelType: 'Electric', fuelCapacity: 440, mileage: 51200.6 },
    { plateNumber: 'TX-1018', model: 'Ram ProMaster', type: 'Van', status: VehicleStatus.AVAILABLE, fuelType: 'Petrol', fuelCapacity: 90, mileage: 73400.1 },
    { plateNumber: 'TX-1019', model: 'Hino 268', type: 'Truck', status: VehicleStatus.AVAILABLE, fuelType: 'Diesel', fuelCapacity: 190, mileage: 148900.3 },
    { plateNumber: 'TX-1020', model: 'Mack Anthem', type: 'Truck', status: VehicleStatus.RETIRED, fuelType: 'Diesel', fuelCapacity: 500, mileage: 582400.7 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: v,
      create: v,
    });
  }

  console.log('🎉 20 realistic vehicles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
