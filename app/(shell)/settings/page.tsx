import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5 text-[var(--muted)]">Restaurant profile and preferences</p>
      </div>
      <div className="rounded-xl border p-6 bg-[var(--card-bg)] border-[var(--card-border)] space-y-4">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-[var(--muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text)]">Restaurant settings coming soon</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          This section will allow you to update your restaurant details, business hours,
          online ordering settings, and notification preferences.
        </p>
      </div>
    </div>
  );
}
