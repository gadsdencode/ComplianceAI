import { ReactNode, useState } from "react";
import UnifiedSidebar from "@/components/common/UnifiedSidebar";
import EnhancedHeader from "@/components/common/EnhancedHeader";

type UnifiedLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  showSearch?: boolean;
  showNotifications?: boolean;
};

export default function UnifiedLayout({
  children,
  pageTitle,
  onSearch,
  notificationCount = 0,
  showSearch = true,
  showNotifications = true,
}: UnifiedLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <UnifiedSidebar />
      
      <main className="flex-1 flex flex-col min-h-screen w-full">
        <EnhancedHeader 
          pageTitle={pageTitle} 
          onSearchChange={showSearch ? onSearch : undefined}
          notificationCount={showNotifications ? notificationCount : 0}
          toggleMobileSidebar={toggleMobileSidebar}
          showSearch={showSearch}
          showNotifications={showNotifications}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
