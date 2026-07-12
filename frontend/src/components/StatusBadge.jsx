/**
 * StatusBadge
 * ───────────
 * Maps backend enum values to flat-fill Tailwind status colors.
 * Never uses raw hex — always the custom palette from tailwind.config.js.
 */

const STATUS_MAP = {
  // Vehicle
  AVAILABLE:   { cls: 'bg-status-available text-white',   label: 'Available' },
  ON_TRIP:     { cls: 'bg-status-ontrip text-white',      label: 'On Trip' },
  IN_SHOP:     { cls: 'bg-status-inshop text-white',      label: 'In Shop' },
  RETIRED:     { cls: 'bg-status-retired text-white',     label: 'Retired' },
  // Trip
  DRAFT:       { cls: 'bg-status-draft text-white',       label: 'Draft' },
  DISPATCHED:  { cls: 'bg-status-dispatched text-white',  label: 'Dispatched' },
  COMPLETED:   { cls: 'bg-status-completed text-white',   label: 'Completed' },
  CANCELLED:   { cls: 'bg-status-cancelled text-white',   label: 'Cancelled' },
  // Driver
  OFF_DUTY:    { cls: 'bg-status-offduty text-white',     label: 'Off Duty' },
  SUSPENDED:   { cls: 'bg-status-suspended text-white',   label: 'Suspended' },
  // Maintenance
  ACTIVE:      { cls: 'bg-status-inshop text-white',      label: 'Active' },
  CLOSED:      { cls: 'bg-status-completed text-white',   label: 'Closed' },
};

export default function StatusBadge({ status }) {
  const entry = STATUS_MAP[status] ?? { cls: 'bg-status-draft text-white', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${entry.cls}`}>
      {entry.label}
    </span>
  );
}
