'use client';

import { useState } from 'react';
import { OrderStatus } from '@/lib/types';
import { updateOrderStatus } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'DELIVERED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  DELIVERED: 'Delivered',
};

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  /** Called by parent (OrdersPage) to update its local orders state on success */
  onSuccess: (newStatus: OrderStatus) => void;
}

export default function StatusSelect({ orderId, currentStatus, onSuccess }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks the optimistically-displayed value during the update
  const [displayedStatus, setDisplayedStatus] = useState<OrderStatus>(currentStatus);

  const handleChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    const typedStatus = newStatus as OrderStatus;
    if (typedStatus === displayedStatus) return;

    // Optimistic UI: show the new value immediately
    const previousStatus = displayedStatus;
    setDisplayedStatus(typedStatus);
    setIsUpdating(true);
    setError(null);

    try {
      await updateOrderStatus(orderId, typedStatus);
      // Notify parent to update its authoritative state
      onSuccess(typedStatus);
    } catch (err) {
      // Revert on failure — the server rejected the update
      setDisplayedStatus(previousStatus);
      setError(
        err instanceof Error ? err.message : 'Update failed. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* Spinner visible during PATCH request */}
        {isUpdating && (
          <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        )}
        <Select
          value={displayedStatus}
          onValueChange={handleChange}
          disabled={isUpdating}
        >
          <SelectTrigger
            className={`w-[140px] h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 
            focus:ring-indigo-500/50 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {ALL_STATUSES.map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="text-slate-200 text-xs focus:bg-slate-700 focus:text-white cursor-pointer"
              >
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inline error message — per-row, doesn't pollute the rest of the UI */}
      {error && (
        <p className="text-[11px] text-red-400 max-w-[140px] text-right leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}
