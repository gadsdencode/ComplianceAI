import { ReactNode, useState } from "react";
import { useLocation, Link } from "wouter";
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
  Bell,
  Search,
  Plus,
  ChevronRight,
  Home,
  FolderOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  UserCheck,
  Eye,
  Edit3,
  Trash2,
  Download,
  Share2,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

type ModernLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  showSearch?: boolean;
  showNotifications?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
};

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
  isCollapsed?: boolean;
  children?: Array<{ href: string; label: string; badge?: number }>;
};

const SidebarLink = ({ href, icon, label, isActive, onClick, badge, isCollapsed, children }: SidebarLinkProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location] = useLocation();
  const hasChildren = children && children.length > 0;
  const isParentActive = isActive || (hasChildren && children.some(child => location === child.href));

  return (
    <li className="px-2 py-1">
      <div className="space-y-1">
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
              {hasChildren && (
                <ChevronRight 
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              )}
            </>
          )}
        </Link>
        
        {/* Sub-navigation */}
        {hasChildren && !isCollapsed && isExpanded && (
          <ul className="ml-6 space-y-1">
            {children.map((child) => (
              <li key={child.href}>
                <Link 
                  href={child.href}
                  onClick={onClick}
                  className={cn(
                    "flex items-center p-2 rounded-lg transition-all duration-200 text-sm",
                    location === child.href
                      ? "text-primary-400 bg-primary-900/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  )}
                >
                  <span className="flex-1">{child.label}</span>
                  {child.badge !== undefined && child.badge > 0 && (
                    <Badge className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[16px] text-center">
                      {child.badge > 99 ? '99+' : child.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

export default function ModernLayout({
  children,
  pageTitle,
  onSearch,
  notificationCount = 0,
  showSearch = true,
  showNotifications = true,
  breadcrumbs = [],
  actions
}: ModernLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
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

  // Enhanced navigation structure with clear hierarchy and sub-navigation
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
      badge: undefined,
      children: [
        { href: "/documents", label: "All Documents" },
        { href: "/documents?status=draft", label: "Drafts" },
        { href: "/documents?status=review", label: "In Review" },
        { href: "/documents?status=approved", label: "Approved" },
        { href: "/documents?status=published", label: "Published" }
      ]
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
    <TooltipProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={toggleMobileSidebar}
          />
        )}
        
        {/* Sidebar */}
        <nav 
          className={cn(
            "bg-slate-800 text-white flex-shrink-0 min-h-screen transition-all duration-300 ease-in-out z-30",
            "fixed md:static md:translate-x-0",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hidden md:flex text-white hover:bg-slate-700 rounded-lg"
                      onClick={toggleCollapse}
                    >
                      <Menu size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Collapse sidebar</TooltipContent>
                </Tooltip>
              )}
              <Button 
                className="md:hidden text-white focus:outline-none hover:bg-slate-700 rounded-lg" 
                onClick={toggleMobileSidebar} 
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
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 text-sm bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        onSearch?.(e.target.value);
                      }}
                    />
                  </div>
                )}
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
                  onClick={() => setIsMobileSidebarOpen(false)}
                  badge={link.badge}
                  isCollapsed={isCollapsed}
                  children={link.children}
                />
              ))}
            </ul>
          </div>
          
          {/* Footer with Notifications and Logout */}
          <div className="border-t border-slate-700 p-4 mt-auto">
            <div className="space-y-2">
              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
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
                </TooltipTrigger>
                <TooltipContent>{isCollapsed ? "Notifications" : undefined}</TooltipContent>
              </Tooltip>
              
              {/* Logout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={cn(
                      "flex items-center text-slate-300 hover:text-white text-sm w-full p-3 rounded-xl hover:bg-slate-700 transition-all duration-200 group",
                      isCollapsed && "justify-center"
                    )}
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className={cn("text-lg", isCollapsed ? "" : "mr-3")} size={20} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">Sign Out</span>
                        {logoutMutation.isPending && <span className="ml-auto spinner"></span>}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isCollapsed ? "Sign Out" : undefined}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </nav>
        
        <main className="flex-1 flex flex-col min-h-screen w-full">
          {/* Enhanced Header */}
          <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile menu button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  onClick={toggleMobileSidebar}
                >
                  <Menu size={20} />
                </Button>
                
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm">
                  <Link href="/" className="text-slate-500 hover:text-slate-700">
                    <Home size={16} />
                  </Link>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <ChevronRight size={16} className="text-slate-400" />
                      {crumb.href ? (
                        <Link href={crumb.href} className="text-slate-500 hover:text-slate-700">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-slate-900 font-medium">{crumb.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Page Actions */}
                {actions}
                
                {/* Notifications */}
                {showNotifications && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
