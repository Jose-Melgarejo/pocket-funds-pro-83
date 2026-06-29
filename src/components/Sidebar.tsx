import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PlusCircle, ListOrdered, BarChart3, UserCircle, DollarSign } from "lucide-react";
import { EntitySwitcher } from "@/components/EntitySwitcher";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/" | "/movimientos" | "/registrar" | "/reportes" | "/perfil";
  label: string;
  icon: typeof Home;
  exact?: boolean;
  primary?: boolean;
};

const items: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/movimientos", label: "Movimientos", icon: ListOrdered },
  { to: "/registrar", label: "Registrar", icon: PlusCircle, primary: true },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: UserCircle },
];

const ENTITY_PAGES = new Set(["/", "/movimientos", "/registrar", "/reportes"]);

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showSwitcher = ENTITY_PAGES.has(pathname);

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DollarSign className="h-5 w-5" />
        </div>
        <span className="font-bold text-base tracking-tight">Finanzas</span>
      </div>

      {/* Entity switcher */}
      {showSwitcher && (
        <div className="px-3 pt-4 pb-2">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Entidad activa</p>
          <EntitySwitcher variant="list" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {items.map(({ to, label, icon: Icon, exact, primary }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: !!exact }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "data-[status=active]:bg-primary/10 data-[status=active]:text-primary",
              primary && "mt-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
