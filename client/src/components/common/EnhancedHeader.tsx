import { useState, useEffect } from "react";
import { Bell, Search, Menu, User, Settings, LogOut, Zap, Target, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import NotificationDropdown from "./NotificationDropdown";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

type EnhancedHeaderProps = {
  pageTitle: string;
  onSearchChange?: (query: string) => void;
  notificationCount?: number;
  toggleMobileSidebar?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
};

export default function EnhancedHeader({
  pageTitle,
  onSearchChange,
  notificationCount = 0,
  toggleMobileSidebar,
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
}: EnhancedHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, logoutMutation } = useAuth();

  // Fetch notification counts for the badge
  const { data: notificationCounts } = useQuery<{ total: number; unread: number }>({
    queryKey: ['/api/notifications/counts'],
    staleTime: 30 * 1000, // 30 seconds
  });

  const unreadCount = notificationCounts?.unread || 0;

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    return user.name
      .split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const getPageIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'dashboard':
        return <Target className="h-5 w-5" />;
      case 'documents':
        return <Search className="h-5 w-5" />;
      case 'analytics':
        return <TrendingUp className="h-5 w-5" />;
      case 'calendar':
        return <Bell className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <header className={`bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-10 shadow-sm transition-transform duration-300 ease-in-out ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Page title and breadcrumb */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                {getPageIcon(pageTitle)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
                <p className="text-sm text-slate-500">Compliance360 Platform</p>
              </div>
            </div>
          </div>
          
          {/* Center - Search (if enabled) */}
          {showSearch && (
            <div className="flex-1 max-w-lg mx-12 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search actions, documents, deadlines, or type a command..."
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          )}
          
          {/* Right side - Actions and user menu */}
          <div className="flex items-center space-x-3">
            {/* Mobile search button */}
            {showSearch && (
              <Button 
                variant="ghost" 
                size="sm"
                className="lg:hidden"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            
            {/* Notifications */}
            {showNotifications && (
              <NotificationDropdown>
                <Button 
                  title="Notifications"
                  className="relative"
                  variant="ghost"
                  size="sm"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -right-1 -top-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full p-0"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </NotificationDropdown>
            )}
            
            {/* User menu */}
            {showUserMenu && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role === "admin" ? "Administrator" : 
                         user.role === "compliance_officer" ? "Compliance Officer" : 
                         "Employee"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile menu button */}
            <Button 
              title="Toggle mobile sidebar"
              className="md:hidden text-slate-700"
              variant="ghost"
              size="sm"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile search bar */}
        {showSearch && (
          <div className="mt-4 lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search actions, documents, deadlines, or type a command..."
                className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all duration-200"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
