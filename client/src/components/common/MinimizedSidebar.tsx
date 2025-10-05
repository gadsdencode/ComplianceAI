import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
  isCollapsed: boolean;
}

const SidebarLink = ({ 
  href, 
  icon, 
  label, 
  isActive, 
  onClick, 
  badge,
  isCollapsed 
}: SidebarLinkProps) => (
  <li className="min-w-0">
    <Link href={href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative min-w-0",
        isActive 
          ? "bg-primary-100 text-primary-700 border border-primary-200" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        isCollapsed && "justify-center px-2"
      )}>
        <span className={cn(
          "flex-shrink-0",
          isActive ? "text-primary-600" : "text-slate-500 group-hover:text-slate-700"
        )}>
          {icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="truncate min-w-0 flex-1">{label}</span>
            {badge && badge > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs flex-shrink-0">
                {badge > 9 ? '9+' : badge}
              </Badge>
            )}
          </>
        )}
        {isCollapsed && badge && badge > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </div>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </div>
    </Link>
  </li>
);

export default function MinimizedSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed

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

  // Main navigation structure
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-30 h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-x-hidden",
        isCollapsed ? "w-16" : "w-64",
        "hidden lg:flex flex-col"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 min-w-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-slate-900 truncate">ComplianceAI</span>
            </div>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">C</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0 hover:bg-slate-100 flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-slate-200 min-w-0">
          <div className={cn(
            "flex items-center gap-3 min-w-0",
            isCollapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role === "admin" ? "Administrator" : 
                   user.role === "compliance_officer" ? "Compliance Officer" : 
                   "Employee"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 min-w-0">
            {allLinks.map((link) => (
              <SidebarLink 
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
                badge={link.badge}
                isCollapsed={isCollapsed}
              />
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={cn(
              "w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && (
              <span className="ml-3">
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </span>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:hidden overflow-x-hidden",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-slate-900 truncate">ComplianceAI</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Mobile User Profile */}
        <div className="p-4 border-b border-slate-200 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {user.role === "admin" ? "Administrator" : 
                 user.role === "compliance_officer" ? "Compliance Officer" : 
                 "Employee"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 min-w-0">
            {allLinks.map((link) => (
              <SidebarLink 
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
                badge={link.badge}
                isCollapsed={false}
                onClick={() => setIsMobileOpen(false)}
              />
            ))}
          </ul>
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-slate-200 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <LogOut size={20} />
            <span className="ml-3">
              {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
            </span>
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-40 lg:hidden h-10 w-10 p-0 bg-white shadow-md border border-slate-200"
      >
        <Menu size={20} />
      </Button>
    </>
  );
}
