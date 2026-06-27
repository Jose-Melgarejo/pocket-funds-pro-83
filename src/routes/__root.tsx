import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BottomNav } from "@/components/BottomNav";
import { EntitySwitcher } from "@/components/EntitySwitcher";
import { EntityProvider } from "@/lib/entity-context";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página no encontrada.</p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Intentá nuevamente.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Control de Finanzas" },
      { name: "description", content: "Registrá ingresos y gastos personales con resúmenes y reportes." },
      { name: "theme-color", content: "#2f6fed" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Finanzas" },
      { property: "og:title", content: "Control de Finanzas" },
      { property: "og:description", content: "Registrá ingresos y gastos personales con resúmenes y reportes." },
      { name: "twitter:title", content: "Control de Finanzas" },
      { name: "twitter:description", content: "Registrá ingresos y gastos personales con resúmenes y reportes." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d862402-35b8-4318-a2f2-8c73addefd86/id-preview-85aa9a5c--a8ded9ae-c4ca-4c27-aac9-49493a2f1760.lovable.app-1782433439216.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d862402-35b8-4318-a2f2-8c73addefd86/id-preview-85aa9a5c--a8ded9ae-c4ca-4c27-aac9-49493a2f1760.lovable.app-1782433439216.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
      { rel: "icon", href: "/app-icon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Pages where the entity switcher is visible in the header
const ENTITY_PAGES = new Set(["/", "/movimientos", "/registrar"]);

function AppFrame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const titles: Record<string, string> = {
    "/registrar": "Registrar movimiento",
    "/reportes": "Reportes",
    "/categorias": "Categorías",
    "/perfil": "Perfil",
  };
  const title = titles[pathname];
  const showSwitcher = ENTITY_PAGES.has(pathname);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          {showSwitcher ? (
            <EntitySwitcher />
          ) : (
            <h1 className="truncate text-base font-semibold tracking-tight">
              {title ?? "Control de Finanzas"}
            </h1>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <EntityProvider>
        <AppFrame />
      </EntityProvider>
    </QueryClientProvider>
  );
}
