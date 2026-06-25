"use client";

import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { BniLogo } from "@/components/foundations/logo/bni-logo";
import type { NavItem, RouteKey } from "@/types";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "./base-components/mobile-header";
import { PortalNavItem } from "./base-components/portal-nav-item";

const MAIN_SIDEBAR_WIDTH = 280;

interface PortalSidebarProps {
  items: NavItem[];
  activeRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
}

function SidebarContent({ items, activeRoute, onNavigate }: PortalSidebarProps) {
  return (
    <aside
      style={{ "--width": `${MAIN_SIDEBAR_WIDTH}px` } as React.CSSProperties}
      className={cx(
        "flex h-full w-full max-w-full flex-col justify-between overflow-auto border-secondary bg-primary pt-4 lg:w-(--width) lg:border-r lg:pt-5",
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="px-4 lg:px-5">
          <BniLogo />
        </div>

        <nav>
          <ul className="flex flex-col gap-0.5 px-4 lg:px-3">
            {items.map((item) => (
              <li key={item.key}>
                <PortalNavItem
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  current={item.key === activeRoute}
                  onPress={() => onNavigate(item.key)}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-auto px-4 py-4 lg:px-5 lg:py-5">
        <div className="rounded-xl p-3 ring-1 ring-secondary ring-inset">
          <AvatarLabelGroup
            size="md"
            title="Product Ops"
            subtitle="Back office operator"
            initials="PO"
            status="online"
          />
        </div>
      </div>
    </aside>
  );
}

export function PortalSidebar({ items, activeRoute, onNavigate }: PortalSidebarProps) {
  return (
    <>
      <MobileNavigationHeader>
        <SidebarContent items={items} activeRoute={activeRoute} onNavigate={onNavigate} />
      </MobileNavigationHeader>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex">
        <SidebarContent items={items} activeRoute={activeRoute} onNavigate={onNavigate} />
      </div>
    </>
  );
}
