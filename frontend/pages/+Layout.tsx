import "./Layout.css";
import "./tailwind.css";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div id="page-container" className="flex-1">
        <div id="page-content" className="min-h-screen p-5 pb-12">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
