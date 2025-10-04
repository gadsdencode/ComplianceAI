import { ReactNode } from "react";
import UnifiedSidebar from "@/components/common/UnifiedSidebar";

type UnifiedLayoutProps = {
  children: ReactNode;
  pageTitle?: string;
};

export default function UnifiedLayout({
  children,
  pageTitle,
}: UnifiedLayoutProps) {

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <UnifiedSidebar />
      
      <main className="flex-1 flex flex-col min-h-screen w-full">
        <div className="flex-1 px-4 pb-4 md:px-6 md:pb-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
