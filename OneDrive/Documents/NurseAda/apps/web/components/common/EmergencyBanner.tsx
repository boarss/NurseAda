type Props = {
  show: boolean;
};

export function EmergencyBanner({ show }: Props) {
  if (!show) return null;
  return (
    <div className="mb-2 rounded-md border border-red-500/60 bg-red-950/60 px-3 py-2 text-xs text-red-100">
      This could be serious. If you have chest pain, trouble breathing, confusion, or heavy bleeding, please go to the
      nearest emergency room or call your local emergency number now.
    </div>
  );
}

