import { Badge } from './ui/Badge';
import type { BadgeProps } from './ui/Badge';

type StatusVariant = BadgeProps['variant'];

// Map any known status string to a badge variant
const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // Vehicle statuses
  Available: 'success',
  'On Trip': 'default',
  'In Shop': 'warning',
  Retired: 'secondary',

  // Driver statuses
  'Off Duty': 'secondary',
  Suspended: 'destructive',

  // Trip statuses
  Draft: 'secondary',
  Dispatched: 'default',
  Completed: 'success',
  Cancelled: 'destructive',

  // Maintenance statuses
  Open: 'warning',
  'In Progress': 'default',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant: StatusVariant = STATUS_VARIANT_MAP[status] ?? 'secondary';
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
