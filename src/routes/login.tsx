import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: LoginPage });

type Mode = "login" | "register" | "forgot";

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos";
  if (msg.includes("Email not confirmed")) return "Confirmá tu email antes de ingresar";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con ese email";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres";
  if (msg.includes("Unable to validate email")) return "El email no es válido";
  if (msg.includes("Email rate limit")) return "Demasiados intentos. Esperá unos minutos";
  if (msg.includes("For security purposes")) return "Esperá unos segundos antes de intentar de nuevo";
  return msg;
}

function Alert({ type, msg }: { type: "error" | "success"; msg: string }) {
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
      type === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
    )}>
      {type === "error"
        ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        : <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
      <span>{msg}</span>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleLogin = async () => {
    clearMessages();
    if (!email.trim()) { setError("Ingresá tu email"); return; }
    if (!password) { setError("Ingresá tu contraseña"); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (e) { setError(translateError(e.message)); return; }
    navigate({ to: "/" });
  };

  const handleRegister = async () => {
    clearMessages();
    if (!name.trim()) { setError("Ingresá tu nombre"); return; }
    if (!email.trim()) { setError("Ingresá tu email"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (e) { setError(translateError(e.message)); return; }
    setSuccess("¡Cuenta creada! Ya podés ingresar.");
    setPassword("");
    setName("");
    setMode("login");
  };

  const handleForgot = async () => {
    clearMessages();
    if (!email.trim()) { setError("Ingresá tu email"); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (e) { setError(translateError(e.message)); return; }
    setSuccess("Te enviamos un email con el link para restablecer tu contraseña");
  };

  const switchMode = (m: Mode) => { clearMessages(); setMode(m); };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg">
            $
          </div>
          <h1 className="text-xl font-bold">Control de Finanzas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" && "Ingresá a tu cuenta"}
            {mode === "register" && "Creá tu cuenta"}
            {mode === "forgot" && "Recuperar contraseña"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">

          {/* Alerts */}
          {error && <Alert type="error" msg={error} />}
          {success && <Alert type="success" msg={success} />}

          {/* Name (register only) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => { setName(e.target.value); clearMessages(); }}
                className="h-12"
                autoComplete="name"
                autoFocus
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
              className={cn("h-12", error && !password && "border-destructive focus-visible:ring-destructive")}
              autoComplete="email"
              autoFocus={mode !== "register"}
            />
          </div>

          {/* Password */}
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                  className={cn("h-12 pr-11", error && "border-destructive focus-visible:ring-destructive")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? handleLogin() : handleRegister())}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "register" && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-destructive">Mínimo 6 caracteres</p>
              )}
            </div>
          )}

          {/* Actions */}
          {mode === "login" && (
            <>
              <Button onClick={handleLogin} disabled={loading} className="h-12 w-full text-base font-semibold">
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
              <button
                onClick={() => switchMode("forgot")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
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
            <>
              <Button onClick={handleForgot} disabled={loading} className="h-12 w-full text-base font-semibold">
                {loading ? "Enviando…" : "Enviar email de recuperación"}
              </Button>
              <button
                onClick={() => switchMode("login")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Volver al login
              </button>
            </>
          )}
        </div>

        {/* Switch login/register */}
        {mode !== "forgot" && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>¿No tenés cuenta?{" "}
                <button onClick={() => switchMode("register")} className="font-semibold text-primary hover:underline">
                  Registrate
                </button>
              </>
            ) : (
              <>¿Ya tenés cuenta?{" "}
                <button onClick={() => switchMode("login")} className="font-semibold text-primary hover:underline">
                  Ingresá
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
