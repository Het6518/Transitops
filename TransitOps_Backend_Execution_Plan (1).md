# TransitOps — Backend Execution Plan
**Stack:** Node.js + Express + PostgreSQL + Prisma ORM
**Purpose of this file:** This is a phase-wise execution spec for an 8-hour hackathon backend build. It is meant to be fed to an LLM coding agent (e.g. Claude Code) ONE PHASE AT A TIME.

## How to use this file (instructions for the executing LLM)

1. Execute **only the phase explicitly requested** — never jump ahead, even if later phases look trivial.
2. Before writing code for a phase, restate the phase's acceptance criteria back to the user.
3. After finishing a phase, run the "Definition of Done" checklist for that phase and report pass/fail per item. Do not silently mark a phase complete.
4. If a business rule is ambiguous or a prerequisite from an earlier phase is missing, STOP and ask — do not assume.
5. Every state-changing operation (dispatch, complete, cancel, maintenance open/close) MUST be wrapped in a single DB transaction. This is a hard constraint, not a suggestion — partial updates are the most common bug in this domain.
6. Do not build frontend code as part of this plan — this file is backend-only.

---

## Phase 0 — Project Setup
**Goal:** Runnable Express server with DB connectivity, nothing else.

**Tasks:**
- `npm init`, install `express`, `prisma`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `dotenv`, `zod` (request validation), `cors`
- `.env` with `DATABASE_URL`, `JWT_SECRET`
- `prisma init` → connect to Postgres
- Express skeleton: `app.js`, centralized error-handling middleware, `/health` route
- Folder structure:
```
src/
  routes/
  controllers/
  services/
  middleware/
  prisma/schema.prisma
```

**Definition of Done:**
- [ ] `GET /health` returns 200
- [ ] Prisma connects to DB without error

---

## Phase 1 — Schema & Migrations
**Goal:** Full DB schema in one migration. No app logic yet.

**Prisma schema (entities from spec section 6):**

```prisma
enum RoleName {
  FLEET_MANAGER
  DRIVER
  SAFETY_OFFICER
  FINANCIAL_ANALYST
}

enum VehicleStatus {
  AVAILABLE
  ON_TRIP
  IN_SHOP
  RETIRED
}

enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  SUSPENDED
}

enum TripStatus {
  DRAFT
  DISPATCHED
  COMPLETED
  CANCELLED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         RoleName
  createdAt    DateTime @default(now())
}

model Vehicle {
  id              String        @id @default(uuid())
  regNo           String        @unique
  name            String
  type            String
  maxLoadKg       Float
  odometer        Float         @default(0)
  acquisitionCost Float
  status          VehicleStatus @default(AVAILABLE)
  trips           Trip[]
  maintenanceLogs MaintenanceLog[]
  fuelLogs        FuelLog[]
  expenses        Expense[]
}

model Driver {
  id              String       @id @default(uuid())
  name            String
  licenseNo       String       @unique
  licenseCategory String
  licenseExpiry   DateTime
  contact         String
  safetyScore     Float        @default(100)
  status          DriverStatus @default(AVAILABLE)
  trips           Trip[]
}

model Trip {
  id              String     @id @default(uuid())
  source          String
  destination     String
  vehicleId       String
  driverId        String
  vehicle         Vehicle    @relation(fields: [vehicleId], references: [id])
  driver          Driver     @relation(fields: [driverId], references: [id])
  cargoWeightKg   Float
  plannedDistance Float
  actualOdometer  Float?
  fuelConsumed    Float?
  status          TripStatus @default(DRAFT)
  createdAt       DateTime   @default(now())
  dispatchedAt    DateTime?
  completedAt     DateTime?
}

model MaintenanceLog {
  id          String    @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  description String
  cost        Float     @default(0)
  startDate   DateTime  @default(now())
  endDate     DateTime?
  isActive    Boolean   @default(true)
}

model FuelLog {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  liters    Float
  cost      Float
  date      DateTime @default(now())
}

model Expense {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  type      String   // toll, misc, etc. (maintenance/fuel tracked separately)
  amount    Float
  date      DateTime @default(now())
}
```

**Definition of Done:**
- [ ] `prisma migrate dev` runs clean
- [ ] All 7 entities from spec section 6 present
- [ ] Unique constraints on `Vehicle.regNo` and `Driver.licenseNo`

---

## Phase 1.5 — Schema Patch: Audit Log + DB Constraints (NEW — run this before Phase 3)
**Goal:** Cover rules-doc §7 (DB-level constraints) and §10 (audit log entity) that were not in the original Phase 1 migration. This is additive — do not touch existing tables from Phase 1, just add a new migration on top.

**Add to `schema.prisma`:**
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  entityType String   // "Trip", "Vehicle", "Driver", "MaintenanceLog"
  entityId   String
  action     String   // "DISPATCH", "COMPLETE", "CANCEL", "MAINTENANCE_OPEN", "MAINTENANCE_CLOSE", "RETIRE"
  performedBy String  // userId from JWT
  beforeStatus String?
  afterStatus  String?
  createdAt  DateTime @default(now())
}
```

**DB-level check constraints** (raw SQL in a migration, Prisma doesn't express these natively — add via `prisma/migrations/.../migration.sql` post-generate, or a `@@check` if your Prisma version supports it):
```sql
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_maxload_positive CHECK ("maxLoadKg" > 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_acqcost_positive CHECK ("acquisitionCost" > 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT chk_odometer_nonneg CHECK ("odometer" >= 0);
ALTER TABLE "Driver" ADD CONSTRAINT chk_safetyscore_range CHECK ("safetyScore" BETWEEN 0 AND 100);
ALTER TABLE "Trip" ADD CONSTRAINT chk_cargo_positive CHECK ("cargoWeightKg" > 0);
ALTER TABLE "Trip" ADD CONSTRAINT chk_distance_positive CHECK ("plannedDistance" > 0);
ALTER TABLE "FuelLog" ADD CONSTRAINT chk_liters_positive CHECK ("liters" > 0);
ALTER TABLE "FuelLog" ADD CONSTRAINT chk_fuelcost_positive CHECK ("cost" > 0);
```

**Definition of Done:**
- [ ] Migration runs clean without touching existing Phase 1 tables
- [ ] Inserting a negative `maxLoadKg` or `cargoWeightKg` fails at the DB layer, not just app validation
- [ ] AuditLog table exists and is ready to be written to from Phase 5/6

---

## Phase 2 — Auth + RBAC
**Goal:** All routes below this point are protected and role-aware.

**Business logic:**
- Signup: hash password with bcrypt (cost 10), store role
- Login: verify password, issue JWT `{ userId, role }`, expiry 8h
- Middleware `authenticate`: verify JWT, attach `req.user`
- Middleware `authorize(...roles)`: reject 403 if `req.user.role` not in list

**Role → permission mapping (derive from spec section 2):**
| Action | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Vehicle CRUD | ✅ | ❌ | 👁 read | 👁 read |
| Driver CRUD | ✅ | ❌ | ✅ | 👁 read |
| Create/dispatch trip | 👁 | ✅ | 👁 | 👁 |
| Maintenance | ✅ | ❌ | 👁 | 👁 |
| Fuel/Expense logging | ✅ | ✅ | ❌ | 👁 |
| Reports/Dashboard | ✅ | ❌ | ✅ (safety-related) | ✅ |

(✅ = full access, 👁 = read-only, ❌ = no access — flag to user if this table needs adjusting per their exact mockup)

**Endpoints:**
- `POST /auth/signup`
- `POST /auth/login`

**Definition of Done:**
- [ ] Cannot hit any Phase 3+ route without valid JWT
- [ ] Wrong-role request returns 403, not 401
- [ ] Passwords never returned in any response payload

---

## Phase 3 — Vehicle CRUD
**Endpoints:** `POST/GET/PATCH/DELETE /vehicles`, `GET /vehicles/:id`

**Business rules:**
- `regNo` uniqueness enforced at DB + friendly 409 error at API level
- Default status on creation = `AVAILABLE`
- Manual status edit via PATCH allowed only for Fleet Manager (e.g. marking `RETIRED`)
- `GET /vehicles?status=AVAILABLE&type=truck` — fil터support for Dashboard (Phase 8 reuses this)

**Field validation (zod, rules-doc §5) — reject with 400 before hitting DB:**
- `regNo`: required, normalize to uppercase + trim, then check uniqueness
- `name`, `type`: required, non-empty string
- `maxLoadKg`: required, positive number
- `odometer`: required, number >= 0
- `acquisitionCost`: required, positive number
- `status`: must be one of the 4 valid enum values if provided

**Retire guard (rules-doc §11 edge case — "vehicle becomes retired during ongoing operation"):**
- `PATCH /vehicles/:id` setting `status: RETIRED` must be rejected with 409 if current `status === ON_TRIP`. A vehicle must be Available or In Shop before it can be retired.
- Every successful status change made through this endpoint writes an `AuditLog` row (`entityType: "Vehicle"`, `action: "RETIRE"` or similar, `beforeStatus`, `afterStatus`, `performedBy: req.user.id`).

**Definition of Done:**
- [ ] Duplicate regNo → 409 with clear message
- [ ] Filters work via query params
- [ ] Negative `maxLoadKg` or `acquisitionCost` rejected at 400 (app layer) — confirm DB constraint from Phase 1.5 also catches it if app validation is bypassed
- [ ] Retiring an ON_TRIP vehicle rejected with 409
- [ ] AuditLog row created on every status change

---

## Phase 4 — Driver CRUD
**Endpoints:** `POST/GET/PATCH/DELETE /drivers`, `GET /drivers/:id`

**Business rules:**
- `licenseNo` unique
- Default status = `AVAILABLE`
- Store `licenseExpiry` as DateTime; expose a computed field `isLicenseValid` (server-side, `licenseExpiry > now()`) on every GET — Phase 5 depends on this check

**Field validation (zod, rules-doc §5):**
- `name`, `licenseCategory`: required, non-empty string
- `licenseNo`: required, unique
- `licenseExpiry`: required, valid date
- `contact`: required, valid phone format (e.g. `/^\+?[0-9]{10,15}$/` — adjust to your locale's expected format)
- `safetyScore`: required, number between 0 and 100 inclusive
- `status`: must be one of the 4 valid enum values if provided

**Definition of Done:**
- [ ] Expired-license driver still visible in list but flagged `isLicenseValid: false`
- [ ] `safetyScore` outside 0–100 rejected at 400
- [ ] Malformed `contact` number rejected at 400

---

## Phase 5 — Trip Management (core logic — budget the most time here)

**State machine:**
```
DRAFT --dispatch()--> DISPATCHED --complete()--> COMPLETED
    \-- cancel() [only from DRAFT] --> CANCELLED
              DISPATCHED -- cancel() --> CANCELLED
```

### 5a. `POST /trips` (create, status=DRAFT)
No side effects on Vehicle/Driver yet, but rules-doc §6 requires checking availability at creation too, not just at dispatch — otherwise a Draft can be created against a vehicle that's already on another trip, which is confusing even if harmless until dispatch:
- vehicle and driver must exist → else 404
- Vehicle.status === AVAILABLE → else 409 "vehicle not available"
- Driver.status === AVAILABLE, license not expired, not Suspended → else 409/403
- `cargoWeightKg <= vehicle.maxLoadKg` → else 400

### 5b. `POST /trips/:id/dispatch` — must be race-safe (rules-doc §11: two users dispatching the same vehicle simultaneously)
A plain "read status, then update" is **not** safe under concurrent requests — two requests can both read `AVAILABLE` before either writes. Use a **conditional update** that only succeeds if the row still matches the expected state, and check the affected row count:

```js
await prisma.$transaction(async (tx) => {
  const trip = await tx.trip.findUnique({ where: { id } });
  if (trip.status !== 'DRAFT') throw new ConflictError('trip not in draft state');

  // Conditional update — atomic compare-and-swap at the DB level
  const vehicleUpdate = await tx.vehicle.updateMany({
    where: { id: trip.vehicleId, status: 'AVAILABLE' },
    data: { status: 'ON_TRIP' },
  });
  if (vehicleUpdate.count === 0) throw new ConflictError('vehicle no longer available');

  const driverUpdate = await tx.driver.updateMany({
    where: { id: trip.driverId, status: 'AVAILABLE' },
    data: { status: 'ON_TRIP' },
  });
  if (driverUpdate.count === 0) throw new ConflictError('driver no longer available');

  // Re-check license/suspension/cargo here (same as before), then:
  await tx.trip.update({ where: { id }, data: { status: 'DISPATCHED', dispatchedAt: new Date() }});
  await tx.auditLog.create({ data: { entityType: 'Trip', entityId: id, action: 'DISPATCH', performedBy: req.user.id, beforeStatus: 'DRAFT', afterStatus: 'DISPATCHED' }});
});
```
If the transaction throws partway through, Prisma rolls back everything — no partial state. This `updateMany` + count-check pattern (not a plain `update`) is what actually closes the race condition; a `$transaction` array alone does not.

### 5c. `POST /trips/:id/complete`
Body: `{ actualOdometer, fuelConsumed }`
- Trip.status must be DISPATCHED (else 409)
- Transaction:
  - Trip.status = COMPLETED, completedAt = now, store actualOdometer + fuelConsumed
  - Vehicle.status = AVAILABLE, Vehicle.odometer = actualOdometer
  - Driver.status = AVAILABLE
  - AuditLog row: action `COMPLETE`
- Optionally auto-create a FuelLog entry from `fuelConsumed` if a cost-per-liter is provided (flag to user — spec doesn't specify cost input here, may need a separate fuel log call)

### 5d. `POST /trips/:id/cancel`
- Allowed from DRAFT or DISPATCHED only
- If DRAFT → just set CANCELLED, no entity side effects (nothing was reserved)
- If DISPATCHED → transaction: Trip.status=CANCELLED, Vehicle.status=AVAILABLE, Driver.status=AVAILABLE
- AuditLog row: action `CANCEL`

### 5e. Immutability guard (NEW — rules-doc §6)
- `PATCH /trips/:id` (general field edit, as opposed to the status-transition endpoints above) must be rejected with 409 if `Trip.status` is `COMPLETED` or `CANCELLED` — these are terminal states and must not be edited except through a separate, explicitly-labeled admin-correction endpoint (out of scope for the 8hr build unless you want it — flag to user).
- A `DISPATCHED` trip may only be edited through the `complete`/`cancel` endpoints above, never through a raw field PATCH — this prevents someone quietly changing `vehicleId` mid-trip and breaking the audit trail.

**Definition of Done:**
- [ ] Every transition covered by the example workflow (spec section 5) passes end-to-end
- [ ] Attempting to dispatch an already-OnTrip vehicle fails with 409
- [ ] Attempting cargo > maxLoad fails with 400 at both draft and dispatch time
- [ ] No orphaned states possible (kill the server mid-request in testing — DB should never show Vehicle=OnTrip with no active Trip)
- [ ] Two concurrent dispatch requests against the same vehicle — only one succeeds, the other gets a clean 409, not a double-booked vehicle
- [ ] Editing a COMPLETED or CANCELLED trip via PATCH is rejected
- [ ] AuditLog rows created for dispatch/complete/cancel

---

## Phase 6 — Maintenance Workflow
**Endpoints:** `POST /maintenance`, `PATCH /maintenance/:id/close`, `GET /maintenance?vehicleId=`

**Business rules:**
- `POST /maintenance` (create active log):
  - Reject if Vehicle.status === ON_TRIP (can't service a vehicle mid-trip)
  - Transaction: create MaintenanceLog(isActive=true), Vehicle.status = IN_SHOP
- `PATCH /maintenance/:id/close`:
  - Transaction: MaintenanceLog.isActive=false, endDate=now, Vehicle.status = AVAILABLE **unless** Vehicle.status was manually set to RETIRED (check before reverting — don't un-retire a vehicle)
- A vehicle in `IN_SHOP` must be excluded from `GET /vehicles?status=AVAILABLE` used by Trip dispatch dropdown (already covered by Phase 3 filter — verify here)
- Both create and close operations write an `AuditLog` row (`action: "MAINTENANCE_OPEN"` / `"MAINTENANCE_CLOSE"`)
- Rules-doc §6: "a maintenance record cannot be closed unless it was opened first" — enforced by checking `MaintenanceLog.isActive === true` before allowing close (already implied by your `isActive` field, just make the check explicit and return 409 if already closed)

**Definition of Done:**
- [ ] Creating maintenance on an On-Trip vehicle is rejected
- [ ] Closing maintenance on a Retired vehicle keeps it Retired, not Available
- [ ] Closing an already-closed maintenance record returns 409, not a silent no-op
- [ ] AuditLog rows created on open/close

---

## Phase 7 — Fuel & Expense Management
**Endpoints:** `POST /vehicles/:id/fuel-logs`, `POST /vehicles/:id/expenses`, `GET /vehicles/:id/cost-summary`

**Business logic:**
- FuelLog and Expense are simple append-only records tied to a vehicle
- `GET /vehicles/:id/cost-summary` computes:
  ```
  totalFuelCost = SUM(FuelLog.cost WHERE vehicleId)
  totalMaintenanceCost = SUM(MaintenanceLog.cost WHERE vehicleId)
  totalExpenses = SUM(Expense.amount WHERE vehicleId)
  totalOperationalCost = totalFuelCost + totalMaintenanceCost
  ```
  (Spec 3.7 defines operational cost as Fuel + Maintenance only — Expense/tolls tracked separately unless user confirms otherwise)

> ⚠️ Open decision (rules-doc §11 edge case, not resolved by either doc): should `POST /vehicles/:id/fuel-logs` be **allowed** while `Vehicle.status === IN_SHOP`? Plausible either way — a vehicle could be refueled just before entering the shop, or someone could be back-dating a log. Default to **allow it** (fuel logs are historical records, not availability-affecting), but confirm with the user before assuming.

**Definition of Done:**
- [ ] Cost summary math verified against a manually-computed example
- [ ] Explicit decision made (and documented in code comments) on whether fuel logs are blocked for IN_SHOP vehicles

---

## Phase 8 — Dashboard KPIs & Reports (build last — aggregates everything)

**`GET /dashboard`** — supports `?vehicleType=&status=&region=` filters
```
activeVehicles      = COUNT(Vehicle WHERE status != RETIRED)
availableVehicles   = COUNT(Vehicle WHERE status == AVAILABLE)
inMaintenance       = COUNT(Vehicle WHERE status == IN_SHOP)
activeTrips         = COUNT(Trip WHERE status == DISPATCHED)
pendingTrips        = COUNT(Trip WHERE status == DRAFT)
driversOnDuty       = COUNT(Driver WHERE status == ON_TRIP)
fleetUtilization%   = (Vehicle WHERE status == ON_TRIP) / (total non-retired vehicles) * 100
```

**`GET /reports`** — per-vehicle:
```
fuelEfficiency = totalDistanceDriven / totalFuelConsumed   (from completed trips + fuel logs)
operationalCost = totalFuelCost + totalMaintenanceCost      (from Phase 7)
vehicleROI = ??? — SEE CONFLICT BELOW, DO NOT IMPLEMENT UNTIL RESOLVED
```
> 🛑 **Formula conflict, needs your decision before building this metric:**
> - Original spec (PDF §3.8): `(Revenue - (Maintenance + Fuel)) / AcquisitionCost` — a ratio, ROI as % of what was invested
> - New rules doc (§9): `Revenue - Maintenance - Fuel - AcquisitionCost` — an absolute profit/loss number, not a ratio
> These produce very different numbers and different units (percentage vs currency). Also, neither doc defines where "Revenue" comes from — no revenue/fare field exists on Trip in the current schema. Pick one formula and, if you want ROI at all, add a `revenue` or `farePerTrip` field to Trip in a Phase 1.5-style patch migration. If time is tight, cutting ROI from the 8hr scope and noting it as a stretch goal in your demo is a reasonable call.

**License expiry alerts (NEW — rules-doc §9):**
`GET /reports/license-alerts?withinDays=30` — returns drivers where `licenseExpiry` is between now and now+withinDays, sorted soonest-first. Reuses the `isLicenseValid` logic from Phase 4.

**Maintenance summary (NEW — rules-doc §9):**
`GET /reports/maintenance-summary` — per vehicle: count of maintenance records, total maintenance cost, most recent maintenance date, currently-active maintenance (if any).

**`GET /reports/export.csv`** — stream computed report rows as CSV (use `json2csv` or manual stringify, no need for a heavy lib)

**Definition of Done:**
- [ ] Dashboard numbers match manual DB query on seeded data
- [ ] CSV downloads and opens correctly in Excel/Sheets
- [ ] ROI formula decision made explicitly (or explicitly deferred) before writing the endpoint
- [ ] License alerts and maintenance summary endpoints return correct data against seeded test data

---

## Phase 9 — Seed Data + API Collection
- Seed script: 5 vehicles (mixed statuses), 5 drivers (one with expired license, one suspended), 3 completed trips, 1 active maintenance log, fuel logs
- Export a Postman/Insomnia collection or `requests.http` file covering every endpoint above, so frontend can integrate without reading backend code

**Definition of Done:**
- [ ] `npm run seed` populates a clean DB reproducibly
- [ ] Collection covers all endpoints in Phases 2–8

---

## Cross-cutting rules (apply in every phase)
- All state-changing multi-entity operations → single Prisma `$transaction`
- All input validated with `zod` at the route boundary before hitting service logic
- Consistent error shape: `{ error: { code, message } }`
- Never expose `passwordHash` in any response

## Open questions to resolve with the user before/during Phase 8
1. **ROI formula conflict** — spec PDF says `(Revenue-(Maint+Fuel))/AcquisitionCost`, rules doc says `Revenue-Maintenance-Fuel-AcquisitionCost`. Pick one before implementing.
2. Where does trip "Revenue" for ROI come from — is there a fare field to add to Trip? (blocks #1 either way)
3. Does `region` (used in Dashboard filter) exist anywhere in the current schema — needs adding to Vehicle if required.
4. Should fuel logs be blocked for vehicles currently `IN_SHOP`? (Phase 7 default: allow, unconfirmed)
5. Is an admin-correction endpoint for COMPLETED/CANCELLED trips in scope for the 8hr build, or is hard immutability (Phase 5e) acceptable for the demo?
