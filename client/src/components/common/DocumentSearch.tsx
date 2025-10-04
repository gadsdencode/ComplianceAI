import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
  Plus,
  Settings,
  Users,
  Calendar,
  BarChart3,
  Star,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Share
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Document } from '@/types';


interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  category: 'documents' | 'navigation' | 'tools';
  keywords: string[];
}

interface SearchResult {
  type: 'document' | 'action';
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: () => void;
  document?: Document;
  category?: string;
}

interface DocumentSearchProps {
  placeholder?: string;
  className?: string;
  onDocumentSelect?: (document: Document) => void;
  showResults?: boolean;
  maxResults?: number;
  showQuickActions?: boolean;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: FileText }
};

// Quick actions configuration
const getQuickActions = (navigate: (path: string) => void): QuickAction[] => [
  {
    id: 'create-document',
    title: 'Create Document',
    description: 'Start a new compliance document',
    icon: Plus,
    category: 'documents',
    keywords: ['create', 'new', 'document', 'add'],
    action: () => navigate('/documents/new')
  },
  {
    id: 'view-documents',
    title: 'View All Documents',
    description: 'Browse all documents in the system',
    icon: FileText,
    category: 'navigation',
    keywords: ['view', 'all', 'documents', 'browse', 'list'],
    action: () => navigate('/documents')
  },
  {
    id: 'pending-reviews',
    title: 'Pending Reviews',
    description: 'Documents awaiting your review',
    icon: Clock,
    category: 'navigation',
    keywords: ['pending', 'review', 'approval', 'waiting'],
    action: () => navigate('/documents?status=pending_approval')
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'View compliance metrics and reports',
    icon: BarChart3,
    category: 'navigation',
    keywords: ['analytics', 'dashboard', 'reports', 'metrics', 'stats'],
    action: () => navigate('/analytics')
  },
  {
    id: 'calendar',
    title: 'Compliance Calendar',
    description: 'View upcoming deadlines and events',
    icon: Calendar,
    category: 'navigation',
    keywords: ['calendar', 'deadlines', 'events', 'schedule'],
    action: () => navigate('/calendar')
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Manage users and permissions',
    icon: Users,
    category: 'navigation',
    keywords: ['users', 'management', 'permissions', 'team'],
    action: () => navigate('/users')
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system settings',
    icon: Settings,
    category: 'tools',
    keywords: ['settings', 'config', 'preferences', 'setup'],
    action: () => navigate('/settings')
  },
  {
    id: 'starred-documents',
    title: 'Starred Documents',
    description: 'View your starred documents',
    icon: Star,
    category: 'navigation',
    keywords: ['starred', 'favorites', 'bookmarked', 'saved'],
    action: () => navigate('/documents?starred=true')
  }
];

export default function DocumentSearch({ 
  placeholder = "Search actions, documents, deadlines, or type a command...",
  className,
  onDocumentSelect,
  showResults = true,
  maxResults = 10,
  showQuickActions = true
}: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [, navigate] = useLocation();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Fetch search results
  const { data: documentResults = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents/search', { q: debouncedQuery }],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return [];
      }
      
      const params = new URLSearchParams({ q: debouncedQuery });
      const response = await fetch(`/api/documents/search?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get quick actions
  const quickActions = getQuickActions(navigate);

  // Combine and filter search results
  const getCombinedResults = useCallback((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Add document results
    documentResults.forEach(doc => {
      results.push({
        type: 'document',
        id: `doc-${doc.id}`,
        title: doc.title,
        description: `Status: ${doc.status} • Updated ${formatDistanceToNow(new Date(doc.updatedAt))} ago`,
        document: doc,
        category: 'Documents'
      });
    });

    // Add quick actions (always show if no query or if query matches)
    if (showQuickActions) {
      const queryLower = debouncedQuery.toLowerCase();
      
      quickActions.forEach(action => {
        const matchesQuery = !queryLower || 
          action.title.toLowerCase().includes(queryLower) ||
          action.description.toLowerCase().includes(queryLower) ||
          action.keywords.some(keyword => keyword.toLowerCase().includes(queryLower));

        if (matchesQuery) {
          results.push({
            type: 'action',
            id: `action-${action.id}`,
            title: action.title,
            description: action.description,
            icon: action.icon,
            action: action.action,
            category: action.category === 'documents' ? 'Quick Actions' : 
                     action.category === 'navigation' ? 'Navigation' : 'Tools'
          });
        }
      });
    }

    return results.slice(0, maxResults);
  }, [documentResults, debouncedQuery, showQuickActions, quickActions, maxResults]);

  const combinedResults = getCombinedResults();

  // Helper functions
  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : "bg-slate-100 text-slate-800";
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config ? config.icon : FileText;
    return <IconComponent className="h-3 w-3" />;
  };

  const getStatusLabel = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.label : status;
  };

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Check if dropdown would go off-screen vertically
      const dropdownHeight = 384; // max-h-96 = 24rem = 384px
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + 4; // Default: below input (relative to viewport)
      
      // If not enough space below but enough above, position above
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      let left = rect.left;
      const dropdownWidth = rect.width;
      
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 16; // 16px margin from edge
      }
      
      if (left < 16) {
        left = 16; // 16px margin from left edge
      }
      
      setDropdownPosition({
        top,
        left,
        width: rect.width
      });
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2 || showQuickActions);
    setSelectedIndex(-1);
    if (value.length >= 2 || showQuickActions) {
      calculateDropdownPosition();
    }
  };

  // Handle result selection (documents or actions)
  const handleResultSelect = useCallback((result: SearchResult) => {
    if (result.type === 'document' && result.document) {
      if (onDocumentSelect) {
        onDocumentSelect(result.document);
      } else {
        navigate(`/documents/${result.document.id}`);
      }
    } else if (result.type === 'action' && result.action) {
      result.action();
    }
    
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onDocumentSelect, navigate]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || combinedResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < combinedResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : combinedResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < combinedResults.length) {
          handleResultSelect(combinedResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside and position updates
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        // Use requestAnimationFrame for smooth position updates during scroll
        requestAnimationFrame(() => {
          calculateDropdownPosition();
        });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, calculateDropdownPosition]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        calculateDropdownPosition();
      }
      
      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, calculateDropdownPosition]);

  // Clear search
  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative isolate", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 || showQuickActions) {
              setIsOpen(true);
              calculateDropdownPosition();
            }
          }}
          className="pl-10 pr-20"
        />
        {/* Keyboard shortcut indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-slate-400">
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 rounded border">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 rounded border">K</kbd>
        </div>
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown - Rendered via Portal */}
      {isOpen && showResults && createPortal(
        <>
          {/* Backdrop for better visibility */}
          <div 
            className="fixed inset-0 z-dropdown-backdrop bg-black/5"
            onClick={() => setIsOpen(false)}
          />
          {/* Visual connector triangle */}
          <div
            className="fixed z-dropdown w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white drop-shadow-sm"
            ref={(el) => {
              if (el) {
                el.style.top = `${dropdownPosition.top - 4}px`;
                el.style.left = `${dropdownPosition.left + 20}px`;
              }
            }}
          />
          <div
            ref={(el) => {
              if (el) {
                el.style.top = `${dropdownPosition.top}px`;
                el.style.left = `${dropdownPosition.left}px`;
                el.style.width = `${dropdownPosition.width}px`;
                el.style.borderTopLeftRadius = '0.5rem';
                el.style.borderTopRightRadius = '0.5rem';
              }
            }}
            className="fixed z-dropdown min-h-32 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl isolate animate-in fade-in-0 zoom-in-95 duration-200"
          >
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-slate-600">Searching...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <span className="text-sm text-red-600">Error searching documents</span>
            </div>
          )}

          {!isLoading && !error && combinedResults.length > 0 && (
            <div className="py-2">
              {combinedResults.map((result, index) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                    selectedIndex === index && "bg-slate-100"
                  )}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    result.type === 'action' 
                      ? "bg-blue-100" 
                      : "bg-slate-100"
                  )}>
                    {result.type === 'action' && result.icon ? (
                      <result.icon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 truncate">
                        {result.title}
                      </h4>
                      {result.type === 'document' && result.document && (
                        <Badge className={cn("text-xs", getStatusColor(result.document.status))}>
                          {getStatusIcon(result.document.status)}
                          <span className="ml-1">
                            {statusConfig[result.document.status as keyof typeof statusConfig]?.label || result.document.status}
                          </span>
                        </Badge>
                      )}
                      {result.category && (
                        <Badge variant="outline" className="text-xs text-slate-500">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      {result.description}
                    </p>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
              
              {documentResults.length > maxResults && (
                <div className="px-3 py-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-slate-600"
                    onClick={() => {
                      navigate(`/documents?search=${encodeURIComponent(query)}`);
                      setIsOpen(false);
                    }}
                  >
                    View all {documentResults.length} document results
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && combinedResults.length === 0 && debouncedQuery.length >= 2 && (
            <div className="p-4 text-center">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No results found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for a different term or use the quick actions above
              </p>
            </div>
          )}

          {!isLoading && !error && combinedResults.length === 0 && debouncedQuery.length < 2 && showQuickActions && (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Type to search or use quick actions</p>
              <p className="text-xs text-slate-500 mt-1">
                Try "create", "analytics", or "settings"
              </p>
            </div>
          )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
