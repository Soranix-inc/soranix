import AppSidebar from '@/components/AppSidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider >
      <AppSidebar />
      <SidebarInset >
        <div className="flex flex-1 flex-col gap-4 p-0 pt-0 ">
          {children}  
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
