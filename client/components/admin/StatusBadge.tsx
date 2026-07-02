import { OrderStatus } from '@/lib/types';

interface StatusConfig {
  label: string;
  dotColor: string;
  className: string;
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    dotColor: 'bg-amber-400',
    className:
      'bg-amber-500/10 text-amber-400 border border-amber-500/25 ring-1 ring-amber-500/10',
  },
  PROCESSING: {
    label: 'Processing',
    dotColor: 'bg-sky-400',
    className:
      'bg-sky-500/10 text-sky-400 border border-sky-500/25 ring-1 ring-sky-500/10',
  },
  DELIVERED: {
    label: 'Delivered',
    dotColor: 'bg-emerald-400',
    className:
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ring-1 ring-emerald-500/10',
  },
};

interface Props {
  status: OrderStatus;
}

export default function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${config.className}`}
    >
      {/* Animated dot — pulses only for PENDING to signal urgency */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor} ${
          status === 'PENDING' ? 'animate-pulse' : ''
        }`}
      />
      {config.label}
    </span>
  );
}
