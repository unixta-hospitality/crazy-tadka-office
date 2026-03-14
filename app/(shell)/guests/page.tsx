import { Users } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function GuestsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
          Guests
        </h1>
        <p className="text-sm mt-0.5 text-[var(--muted)]">Returning customers, VIPs, and walk-ins</p>
      </div>
      <EmptyState
        icon={<Users className="w-7 h-7" />}
        title="Guests coming soon"
        description="The guests module tracks regulars, VIP preferences, allergies, and visit history."
      />
    </div>
  );
}
