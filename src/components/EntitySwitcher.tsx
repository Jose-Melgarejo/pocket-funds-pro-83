import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Check, Building2, User } from "lucide-react";
import { listEntities, type Entity } from "@/lib/finance-api";
import { useEntity } from "@/lib/entity-context";
import { cn } from "@/lib/utils";

export function EntitySwitcher() {
  const { activeEntityId, setActiveEntityId } = useEntity();
  const [open, setOpen] = useState(false);

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: listEntities,
    staleTime: 60_000,
  });

  const active: Entity | undefined = activeEntityId
    ? entities.find((e) => e.id === activeEntityId)
    : entities[0];

  if (entities.length === 0) return null;

  // Ensure context is initialized
  if (!activeEntityId && entities[0]) {
    setActiveEntityId(entities[0].id);
  }

  const handleSelect = (id: string) => {
    setActiveEntityId(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition hover:bg-muted active:scale-95"
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: active?.color ?? "#3b82f6" }}
        >
          {active?.name?.[0] ?? "?"}
        </span>
        <span className="max-w-[140px] truncate text-sm font-semibold">{active?.name ?? "—"}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {entities.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => handleSelect(e.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: e.color }}
                >
                  {e.type === "personal" ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.type === "personal" ? "Personal" : "Negocio"}</p>
                </div>
                {(activeEntityId ?? entities[0]?.id) === e.id && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
