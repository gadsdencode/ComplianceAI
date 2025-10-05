import { ReactNode } from 'react';
import MinimizedSidebar from '../common/MinimizedSidebar';

interface SimplifiedLayoutProps {
  children: ReactNode;
}

export default function SimplifiedLayout({ children }: SimplifiedLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <MinimizedSidebar />
      
      {/* Main Content */}
      <main className="lg:ml-16 transition-all duration-300 ease-in-out">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
