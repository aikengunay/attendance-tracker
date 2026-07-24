"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

function titleForPath(pathname: string): string {
  if (pathname.startsWith("/teacher/settings")) return "Settings";
  if (pathname.startsWith("/teacher/import")) return "Import";
  if (pathname.startsWith("/teacher/sections")) return "Section";
  if (pathname.includes("/roster")) return "Roster";
  if (pathname.includes("/projector") || pathname.includes("/board")) {
    return "Presence";
  }
  if (pathname.includes("/export")) return "Export";
  if (pathname.includes("/sessions")) return "Session";
  if (pathname === "/teacher") return "Sections";
  return "Teacher";
}

export function TeacherSiteHeader() {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="font-heading text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
