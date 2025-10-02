import { ReactNode, useState } from "react";
import SimplifiedSidebar from "@/components/common/SimplifiedSidebar";
import Header from "@/components/common/Header";

type DashboardLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
};

export default function DashboardLayout({
  children,
  pageTitle,
  onSearch,
  notificationCount = 0,
}: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <SimplifiedSidebar />
      
      <main className="flex-1 flex flex-col min-h-screen w-full">
        <Header 
          pageTitle={pageTitle} 
          onSearchChange={onSearch}
          notificationCount={notificationCount}
          toggleMobileSidebar={toggleMobileSidebar}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
