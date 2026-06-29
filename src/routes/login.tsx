import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "login" | "register" | "forgot";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/" });
  };

  const handleRegister = async () => {
    if (password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("¡Cuenta creada! Ya podés ingresar.");
    setMode("login");
  };

  const handleForgot = async () => {
    if (!email) { toast.error("Ingresá tu email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Te enviamos un email para restablecer tu contraseña");
    setMode("login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / título */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground font-bold">
            $
          </div>
          <h1 className="text-xl font-bold">Control de Finanzas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" && "Ingresá a tu cuenta"}
            {mode === "register" && "Creá tu cuenta"}
            {mode === "forgot" && "Recuperar contraseña"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
              />
            </div>
          )}

          {mode === "login" && (
            <>
              <Button onClick={handleLogin} disabled={loading} className="h-12 w-full text-base font-semibold">
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
              <button
                onClick={() => setMode("forgot")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {mode === "register" && (
            <Button onClick={handleRegister} disabled={loading} className="h-12 w-full text-base font-semibold">
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          )}

          {mode === "forgot" && (
            <Button onClick={handleForgot} disabled={loading} className="h-12 w-full text-base font-semibold">
              {loading ? "Enviando…" : "Enviar email de recuperación"}
            </Button>
          )}
        </div>

        {/* Switch mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>¿No tenés cuenta?{" "}
              <button onClick={() => setMode("register")} className="font-semibold text-primary">Registrate</button>
            </>
          ) : (
            <>¿Ya tenés cuenta?{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-primary">Ingresá</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
