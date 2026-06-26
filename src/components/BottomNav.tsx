import { Link } from "@tanstack/react-router";
import { Home, PlusCircle, ListOrdered, BarChart3, Tags } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/movimientos", label: "Movimientos", icon: ListOrdered },
  { to: "/registrar", label: "Registrar", icon: PlusCircle, primary: true },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/categorias", label: "Categorías", icon: Tags },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(({ to, label, icon: Icon, primary, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: !!exact }}
              className="group flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              {primary ? (
                <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-card)] ring-4 ring-background">
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={primary ? "mt-0.5" : ""}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
