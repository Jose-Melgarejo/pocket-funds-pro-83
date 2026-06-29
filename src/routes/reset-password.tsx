import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Contraseña actualizada");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresá tu nueva contraseña</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
          </div>
          <Button onClick={handleReset} disabled={loading} className="h-12 w-full text-base font-semibold">
            {loading ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </div>
      </div>
    </div>
  );
}
