import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
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
  Share,
  Command,
  Zap,
  Tag
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
  shortcut?: string;
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
  shortcut?: string;
}

interface EnhancedDocumentSearchProps {
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

// Quick actions configuration - EXACT COPY from original DocumentSearch
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


export default function EnhancedDocumentSearch({ 
  placeholder = "Search documents, create new ones, or navigate anywhere...",
  className,
  onDocumentSelect,
  showResults = true,
  maxResults = 10,
  showQuickActions = true
}: EnhancedDocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 100, left: 100, width: 400 });
  const [activeTab, setActiveTab] = useState<'documents' | 'actions'>('actions');
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

  // Fetch search results when there's a query
  const { data: searchResults = [], isLoading: isSearchLoading, error: searchError } = useQuery<Document[]>({
    queryKey: ['/api/documents/search', { q: debouncedQuery }],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        return [];
      }
      
      const params = new URLSearchParams({ 
        q: debouncedQuery,
        limit: maxResults.toString()
      });
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

  // Fetch recent documents when there's no search query
  const { data: recentDocuments = [], isLoading: isRecentLoading, error: recentError } = useQuery<Document[]>({
    queryKey: ['/api/documents/recent'],
    queryFn: async () => {
      const response = await fetch('/api/documents/recent', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent documents: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: debouncedQuery.length < 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use search results if there's a query, otherwise use recent documents
  const documentResults = debouncedQuery.length >= 2 ? searchResults : recentDocuments;
  const isLoading = debouncedQuery.length >= 2 ? isSearchLoading : isRecentLoading;
  const error = debouncedQuery.length >= 2 ? searchError : recentError;

  // Get quick actions
  const quickActions = getQuickActions(navigate);

  // Combine and filter search results - EXACT COPY from original DocumentSearch
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
  
  // Filter results by tab
  const documentResults_filtered = combinedResults.filter(result => result.type === 'document');
  const actionResults_filtered = combinedResults.filter(result => result.type === 'action');

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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return "outline";
    
    // Map status colors to badge variants
    if (config.color.includes("red")) return "destructive";
    if (config.color.includes("yellow")) return "secondary";
    if (config.color.includes("green")) return "default";
    if (config.color.includes("gray")) return "outline";
    
    return "outline";
  };

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Check if dropdown would go off-screen vertically
      const dropdownHeight = 500; // Increased height for better visibility
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + 8; // Default: below input (relative to viewport)
      
      // If not enough space below but enough above, position above
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 8;
      }
      
      // Ensure dropdown doesn't go off-screen horizontally
      let left = rect.left;
      const dropdownWidth = Math.max(rect.width, 500); // Increased minimum width
      
      if (left + dropdownWidth > viewportWidth - 20) {
        left = viewportWidth - dropdownWidth - 20; // 20px margin from edge
      }
      
      if (left < 20) {
        left = 20; // 20px margin from left edge
      }
      
      setDropdownPosition({
        top,
        left,
        width: dropdownWidth
      });
      
      console.log('Dropdown position calculated:', { top, left, width: dropdownWidth, rect: rect });
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true); // Always open when typing
    setSelectedIndex(0); // Reset to first item
    calculateDropdownPosition();
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
    if (!isOpen) return;

    const currentResults = activeTab === 'documents' ? documentResults_filtered : actionResults_filtered;
    
    if (currentResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < currentResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : currentResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
          handleResultSelect(currentResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        e.preventDefault();
        setActiveTab(prev => prev === 'documents' ? 'actions' : 'documents');
        setSelectedIndex(0);
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
        setSelectedIndex(0);
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

  // Get current results based on active tab
  const currentResults = activeTab === 'documents' ? documentResults_filtered : actionResults_filtered;

  // Ensure dropdown position is calculated when isOpen changes
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition]);
  
  

  return (
    <div className={cn("relative isolate", className)}>
      {/* Enhanced Search Input */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="relative group">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Main search container */}
          <div className="relative backdrop-blur-xl bg-background/80 border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300">
            <div className="flex items-center gap-3 px-5 py-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </motion.div>
              
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  console.log('Search input focused - opening dropdown');
                  setIsOpen(true);
                  setSelectedIndex(0);
                  calculateDropdownPosition();
                }}
                onClick={() => {
                  console.log('Search input clicked - opening dropdown');
                  setIsOpen(true);
                  setSelectedIndex(0);
                  calculateDropdownPosition();
                }}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60 font-medium"
              />

              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClear}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Enhanced keyboard shortcut indicator */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/30">
                <Command className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">K</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Search Results Dropdown */}
      {isOpen && createPortal(
        <AnimatePresence>
          <>
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/5"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top || 200}px`,
                left: `${dropdownPosition.left || 200}px`,
                width: `${dropdownPosition.width || 500}px`,
                maxHeight: '500px',
                zIndex: 9999
              }}
              className="backdrop-blur-xl bg-white/95 border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <p className="text-sm font-semibold text-gray-800">Search Results</p>
                <p className="text-xs text-gray-500">isOpen: {isOpen.toString()} | activeTab: {activeTab} | results: {currentResults.length}</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 bg-gray-50/30">
                <button
                  onClick={() => {
                    setActiveTab('documents');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'documents'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Documents
                </button>
                <button
                  onClick={() => {
                    setActiveTab('actions');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'actions'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  Quick Actions
                </button>
              </div>

              {/* Results Content */}
              <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {isLoading && (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-sm text-gray-600">Searching...</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center p-8 text-red-600">
                    <span className="text-sm">Search failed. Please try again.</span>
                  </div>
                )}

                {!isLoading && !error && currentResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {activeTab === 'documents' 
                        ? (debouncedQuery.length >= 2 ? 'No documents found' : 'No recent documents')
                        : 'No quick actions available'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeTab === 'documents' 
                        ? (debouncedQuery.length >= 2 ? 'Try adjusting your search terms' : 'Recent documents will appear here')
                        : 'Quick actions will appear here when available'
                      }
                    </p>
                  </div>
                )}

                {!isLoading && !error && currentResults.length > 0 && (
                  <div className="space-y-1">
                    {currentResults.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          selectedIndex === index
                            ? 'bg-blue-50 border border-blue-200 shadow-sm'
                            : 'hover:bg-gray-50 border border-transparent hover:shadow-sm'
                        }`}
                        onClick={() => handleResultSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        {result.type === 'document' && result.document ? (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {result.document.title}
                                </h4>
                                <Badge 
                                  variant={getStatusVariant(result.document.status)}
                                  className="text-xs"
                                >
                                  {getStatusLabel(result.document.status)}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {result.document.content?.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(result.document.createdAt).toLocaleDateString()}
                                </span>
                                {result.document.category && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {result.document.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              {result.icon && <result.icon className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {result.title}
                                </h4>
                                {result.category && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                                    {result.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                {result.description}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 font-semibold">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 font-semibold">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 font-semibold">Tab</kbd>
                      Switch
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 font-semibold">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
