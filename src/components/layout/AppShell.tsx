import type { ReactNode } from "react";
import { PortalSidebar } from "@/components/application/app-navigation/portal-sidebar";
import { navItems } from "@/data/mockData";
import type { NavItem, RouteKey } from "@/types";

interface AppShellProps {
  route: RouteKey;
  onRouteChange: (route: RouteKey) => void;
  activeItem: NavItem;
  children: ReactNode;
}

export function AppShell({ route, onRouteChange, activeItem, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-secondary">
      <PortalSidebar items={navItems} activeRoute={route} onNavigate={onRouteChange} />

      <div className="flex min-h-screen flex-col lg:ml-[280px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-secondary bg-primary/90 px-4 backdrop-blur md:px-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-quaternary">Portal / {activeItem.label}</p>
            <p className="truncate text-sm font-semibold text-primary">{activeItem.description}</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
