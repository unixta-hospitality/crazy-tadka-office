import { ClipboardList } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function BookingsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
          Bookings
        </h1>
        <p className="text-sm mt-0.5 text-[var(--muted)]">Reservations and private dining bookings</p>
      </div>
      <EmptyState
        icon={<ClipboardList className="w-7 h-7" />}
        title="Bookings coming soon"
        description="The bookings module will track reservations, catering enquiries, and private dining requests."
      />
    </div>
  );
}
