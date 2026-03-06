import { MedicationsPageClient } from "./MedicationsPageClient";

export default function MedicationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Medication management</h1>
        <p className="text-sm text-slate-400">
          Check drug interactions and manage your medication reminders. Always confirm with your doctor or pharmacist.
        </p>
      </header>
      <MedicationsPageClient />
    </div>
  );
}
