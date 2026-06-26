import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MovementForm } from "@/components/MovementForm";

export const Route = createFileRoute("/registrar")({
  component: RegistrarPage,
});

function RegistrarPage() {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
      <MovementForm
        onSaved={() => navigate({ to: "/" })}
        onSavedAndNew={() => {/* stay on page, form resets itself */}}
      />
    </div>
  );
}
