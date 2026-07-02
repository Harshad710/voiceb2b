import { Order, OrderItem, Product, User, OrderStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from './StatusBadge';
import StatusSelect from './StatusSelect';

interface Props {
  orders: Order[];
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

// ── Type guard helpers ────────────────────────────────────────────────────────
// The API populates these fields, but TypeScript can't know that at compile time.
// These helpers safely narrow the union type (Object | string) to the object shape.

function getRetailerName(retailerId: User | string): string {
  if (typeof retailerId === 'object' && retailerId !== null) {
    return retailerId.name;
  }
  return `ID: ${retailerId}`;
}

function getRetailerPhone(retailerId: User | string): string {
  if (typeof retailerId === 'object' && retailerId !== null) {
    return retailerId.phone;
  }
  return '—';
}

function formatItems(items: OrderItem[]): string {
  return items
    .map((item) => {
      const name =
        typeof item.productId === 'object' && item.productId !== null
          ? (item.productId as Product).name
          : 'Unknown Product';
      return `${name} ×${item.quantity}`;
    })
    .join(', ');
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function OrdersTable({ orders, onStatusUpdate }: Props) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#111827] overflow-hidden shadow-xl shadow-black/20">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800/60 hover:bg-transparent">
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 pl-6">
              Retailer
            </TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4">
              Items
            </TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4">
              Total
            </TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4">
              Status
            </TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4">
              Placed At
            </TableHead>
            <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider py-4 pr-6 text-right">
              Update Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow
              key={order._id}
              className={`border-slate-800/40 transition-colors hover:bg-slate-800/30 ${
                index % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'
              }`}
            >
              {/* Retailer */}
              <TableCell className="py-4 pl-6">
                <p className="font-semibold text-slate-100 text-sm">
                  {getRetailerName(order.retailerId)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getRetailerPhone(order.retailerId)}
                </p>
              </TableCell>

              {/* Items */}
              <TableCell className="py-4 max-w-xs">
                <p className="text-sm text-slate-300 truncate" title={formatItems(order.items)}>
                  {formatItems(order.items)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {order.items.length} {order.items.length === 1 ? 'SKU' : 'SKUs'}
                </p>
              </TableCell>

              {/* Total Amount */}
              <TableCell className="py-4">
                <span className="font-semibold text-slate-100 text-sm tabular-nums">
                  {formatCurrency(order.totalAmount)}
                </span>
              </TableCell>

              {/* Status Badge (read-only display) */}
              <TableCell className="py-4">
                <StatusBadge status={order.status} />
              </TableCell>

              {/* Created Date */}
              <TableCell className="py-4">
                <span className="text-sm text-slate-400 tabular-nums">
                  {formatDate(order.createdAt)}
                </span>
              </TableCell>

              {/* Status Update Dropdown */}
              <TableCell className="py-4 pr-6 text-right">
                <StatusSelect
                  orderId={order._id}
                  currentStatus={order.status}
                  onSuccess={(newStatus) => onStatusUpdate(order._id, newStatus)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
