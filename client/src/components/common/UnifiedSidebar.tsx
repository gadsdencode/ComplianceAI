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
  Star,
  Bell,
  Search,
  Plus,
  FolderOpen,
  PenTool,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { useQuery } from "@tanstack/react-query";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
  isCollapsed?: boolean;
};

const SidebarLink = ({ href, icon, label, isActive, onClick, badge, isCollapsed }: SidebarLinkProps) => (
  <li className="px-2 py-1">
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center p-3 rounded-xl transition-all duration-200 relative group",
        isActive
          ? "text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg"
          : "text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md"
      )}
      title={isCollapsed ? label : undefined}
    >
      <span className={cn("text-lg", isCollapsed ? "mx-auto" : "mr-3")}>{icon}</span>
      {!isCollapsed && (
        <>
          <span className="font-medium flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <Badge className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-semibold">
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  </li>
);

export default function UnifiedSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  // Fetch notification counts
  const { data: notificationCounts } = useQuery<{ total: number; unread: number }>({
    queryKey: ['/api/notifications/counts'],
    staleTime: 30 * 1000,
  });

  const unreadCount = notificationCounts?.unread || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  // Main navigation structure with clear hierarchy
  const primaryLinks = [
    { 
      href: "/", 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard",
      badge: undefined
    },
    { 
      href: "/documents", 
      icon: <FileText size={20} />, 
      label: "Documents",
      badge: undefined
    },
    { 
      href: "/analytics", 
      icon: <BarChart3 size={20} />, 
      label: "Analytics",
      badge: undefined
    },
    { 
      href: "/calendar", 
      icon: <Calendar size={20} />, 
      label: "Calendar",
      badge: undefined
    },
  ];

  // Secondary navigation (admin only)
  const adminLinks = [
    { 
      href: "/users", 
      icon: <Users size={20} />, 
      label: "Users",
      badge: undefined
    },
  ];

  // Settings always at bottom
  const settingsLinks = [
    { 
      href: "/settings", 
      icon: <Settings size={20} />, 
      label: "Settings",
      badge: undefined
    },
  ];

  const allLinks = [
    ...primaryLinks,
    ...(user.role === "admin" || user.role === "compliance_officer" ? adminLinks : []),
    ...settingsLinks
  ];

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
        className="md:hidden fixed top-4 right-4 z-30 bg-slate-800 text-white p-2 rounded-md shadow-lg"
        onClick={toggleMobileSidebar}
        title="Toggle mobile sidebar"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
      
      {/* Sidebar */}
      <nav 
        className={cn(
          "bg-slate-800 text-white flex-shrink-0 min-h-screen transition-all duration-300 ease-in-out z-30",
          "fixed md:static md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="px-4 py-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <CheckSquare className="text-white" size={22} />
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-xl font-bold">ComplianceAI</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex text-white hover:bg-slate-700 rounded-lg"
                onClick={toggleCollapse}
                title="Collapse sidebar"
              >
                <Menu size={16} />
              </Button>
            )}
            <Button 
              className="md:hidden text-white focus:outline-none hover:bg-slate-700 rounded-lg" 
              onClick={toggleMobileSidebar} 
              title="Close sidebar"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="py-5 px-4 border-b border-slate-700">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-sm font-semibold shadow-lg">
              {getUserInitials()}
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-300">
                  {user.role === "admin" ? "Administrator" : 
                   user.role === "compliance_officer" ? "Compliance Officer" : 
                   "Employee"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-b border-slate-700">
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
                onClick={() => window.location.href = '/documents?action=create'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Links */}
        <div className="py-4 custom-scrollbar overflow-y-auto h-[calc(100vh-280px)]">
          <ul>
            {allLinks.map((link) => (
              <SidebarLink 
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
                onClick={() => setIsMobileOpen(false)}
                badge={link.badge}
                isCollapsed={isCollapsed}
              />
            ))}
          </ul>
        </div>
        
        {/* Footer with Notifications and Logout */}
        <div className="border-t border-slate-700 p-4 mt-auto">
          <div className="space-y-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
              title={isCollapsed ? "Notifications" : undefined}
            >
              <Bell className={cn("text-lg", isCollapsed ? "mx-auto" : "mr-3")} size={20} />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-semibold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </>
              )}
            </Button>
            
            {/* Logout */}
            <button 
              className={cn(
                "flex items-center text-slate-300 hover:text-white text-sm w-full p-3 rounded-xl hover:bg-slate-700 transition-all duration-200 group",
                isCollapsed && "justify-center"
              )}
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className={cn("text-lg", isCollapsed ? "" : "mr-3")} size={20} />
              {!isCollapsed && (
                <>
                  <span className="font-medium">Sign Out</span>
                  {logoutMutation.isPending && <span className="ml-auto spinner"></span>}
                </>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
