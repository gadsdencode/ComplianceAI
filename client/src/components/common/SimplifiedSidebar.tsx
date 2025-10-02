import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  CheckSquare,
  BarChart3,
  Calendar,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
};

const SidebarLink = ({ href, icon, label, isActive, onClick, badge }: SidebarLinkProps) => (
  <li className="px-3 py-1">
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center p-3 rounded-xl transition-all duration-200 relative group",
        isActive
          ? "text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg"
          : "text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md"
      )}
    >
      <span className="mr-3 text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-semibold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  </li>
);

export default function SimplifiedSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.name) return "";
    return user.name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Simplified navigation structure
  const links = [
    { 
      href: "/", 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard"
    },
    { 
      href: "/documents", 
      icon: <FileText size={20} />, 
      label: "Documents"
    },
    { 
      href: "/analytics", 
      icon: <BarChart3 size={20} />, 
      label: "Analytics"
    },
    { 
      href: "/calendar", 
      icon: <Calendar size={20} />, 
      label: "Calendar"
    },
  ];

  // Add admin links if user is admin
  if (user.role === "admin" || user.role === "compliance_officer") {
    links.push({ 
      href: "/users", 
      icon: <Users size={20} />, 
      label: "Users"
    });
  }

  links.push({ 
    href: "/settings", 
    icon: <Settings size={20} />, 
    label: "Settings"
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleMobileSidebar}
        />
      )}
      
      {/* Mobile Toggle Button */}
      <Button 
        className="md:hidden fixed top-4 right-4 z-30 bg-slate-800 text-white p-2 rounded-md"
        onClick={toggleMobileSidebar}
        title="Toggle mobile sidebar"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
      
      {/* Sidebar */}
      <nav 
        className={cn(
          "bg-slate-800 text-white w-64 flex-shrink-0 min-h-screen transition-all duration-300 ease-in-out z-30",
          "fixed md:static md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <CheckSquare className="text-white" size={22} />
            </div>
            <span className="ml-3 text-xl font-bold">ComplianceAI</span>
          </div>
          <Button className="md:hidden text-white focus:outline-none hover:bg-slate-700 rounded-lg" onClick={toggleMobileSidebar} title="Close sidebar">
            <X size={20} />
          </Button>
        </div>
        
        <div className="py-5 px-4 border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-sm font-semibold shadow-lg">
              {getUserInitials()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-300">
                {user.role === "admin" ? "Administrator" : 
                 user.role === "compliance_officer" ? "Compliance Officer" : 
                 "Employee"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="py-4 custom-scrollbar overflow-y-auto h-[calc(100vh-160px)]">
          <ul>
            {links.map((link) => (
              <SidebarLink 
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
                onClick={() => setIsMobileOpen(false)}
                badge={link.badge}
              />
            ))}
          </ul>
        </div>
        
        <div className="border-t border-slate-700 p-4 mt-auto">
          <button 
            className="flex items-center text-slate-300 hover:text-white text-sm w-full p-3 rounded-xl hover:bg-slate-700 transition-all duration-200 group"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="text-lg mr-3" size={20} />
            <span className="font-medium">Sign Out</span>
            {logoutMutation.isPending && <span className="ml-auto spinner"></span>}
          </button>
        </div>
      </nav>
    </>
  );
}
