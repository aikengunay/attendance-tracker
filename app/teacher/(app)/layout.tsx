import { TeacherAppSidebar } from "@/components/teacher/app-sidebar";
import { TeacherSiteHeader } from "@/components/teacher/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function TeacherAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TeacherAppSidebar variant="inset" />
      <SidebarInset>
        <TeacherSiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
