import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FileText, 
  Copy, 
  PenTool, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
};

const SidebarLink = ({ href, icon, label, isActive, onClick }: SidebarLinkProps) => (
  <li className="px-4 py-2 text-sm">
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center p-2 rounded-md transition-colors",
        isActive
          ? "text-white bg-slate-700"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"
      )}
    >
      <span className="mr-2 text-lg">{icon}</span>
      {label}
    </Link>
  </li>
);

export default function Sidebar() {
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

  const links = [
    { href: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/document-repository", icon: <FileText size={20} />, label: "Documents" },
    { href: "/templates", icon: <Copy size={20} />, label: "Templates" },
    { href: "/signatures", icon: <PenTool size={20} />, label: "Signatures" },
    { href: "/audit", icon: <CheckSquare size={20} />, label: "Audit Trails" },
  ];

  // Add admin links if user is admin
  if (user.role === "admin" || user.role === "compliance_officer") {
    links.push({ href: "/users", icon: <Users size={20} />, label: "Users" });
  }

  links.push({ href: "/settings", icon: <Settings size={20} />, label: "Settings" });

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
        <div className="px-4 py-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary-600 flex items-center justify-center">
              <CheckSquare className="text-white" size={20} />
            </div>
            <span className="ml-2 text-xl font-semibold">ComplianceAI</span>
          </div>
          <Button className="md:hidden text-white focus:outline-none" onClick={toggleMobileSidebar} title="Close sidebar">
            <X size={20} />
          </Button>
        </div>
        
        <div className="py-4 px-4 border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-medium">
              {getUserInitials()}
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate-400">
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
              />
            ))}
          </ul>
        </div>
        
        <div className="border-t border-slate-700 p-4 mt-auto">
          <button 
            className="flex items-center text-slate-300 hover:text-white text-sm w-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="text-lg mr-2" size={20} />
            Sign Out
            {logoutMutation.isPending && <span className="ml-2 spinner"></span>}
          </button>
        </div>
      </nav>
    </>
  );
}
