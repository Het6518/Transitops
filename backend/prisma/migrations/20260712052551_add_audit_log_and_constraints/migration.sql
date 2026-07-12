-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "beforeStatus" TEXT,
    "afterStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- ─── DB-level CHECK constraints (Phase 1.5) ───────────────────────────────────
-- These are a last-resort safety net at the PostgreSQL layer.
-- App-level Zod validation should catch these first and return a 400.

-- Vehicle constraints
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_maxload_positive      CHECK ("maxLoadKg" > 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_acqcost_positive      CHECK ("acquisitionCost" > 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_odometer_nonneg       CHECK ("odometer" >= 0);

-- Driver constraints
ALTER TABLE "Driver"  ADD CONSTRAINT chk_safetyscore_range     CHECK ("safetyScore" BETWEEN 0 AND 100);

-- Trip constraints
ALTER TABLE "Trip"    ADD CONSTRAINT chk_cargo_positive        CHECK ("cargoWeightKg" > 0);
ALTER TABLE "Trip"    ADD CONSTRAINT chk_distance_positive     CHECK ("plannedDistance" > 0);

-- FuelLog constraints
ALTER TABLE "FuelLog" ADD CONSTRAINT chk_liters_positive       CHECK ("liters" > 0);
ALTER TABLE "FuelLog" ADD CONSTRAINT chk_fuelcost_positive     CHECK ("cost" > 0);
