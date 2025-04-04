import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type HeaderProps = {
  pageTitle: string;
  onSearchChange?: (query: string) => void;
  notificationCount?: number;
  toggleMobileSidebar?: () => void;
};

export default function Header({
  pageTitle,
  onSearchChange,
  notificationCount = 0,
  toggleMobileSidebar,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{pageTitle}</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 w-48 md:w-64"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <button className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -right-1 -top-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full p-0"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </button>
          
          <button 
            className="md:hidden text-slate-700"
            onClick={toggleMobileSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
