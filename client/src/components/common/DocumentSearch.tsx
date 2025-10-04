import { useState, useRef, useEffect, useCallback } from 'react';
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
  Loader2
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'pending_approval' | 'active' | 'expired' | 'archived';
  category?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface DocumentSearchProps {
  placeholder?: string;
  className?: string;
  onDocumentSelect?: (document: Document) => void;
  showResults?: boolean;
  maxResults?: number;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-800", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: FileText }
};

export default function DocumentSearch({ 
  placeholder = "Search documents, deadlines...",
  className,
  onDocumentSelect,
  showResults = true,
  maxResults = 10
}: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [navigate] = useLocation();
  
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
  const { data: searchResults = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents/search', { q: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle document selection
  const handleDocumentSelect = useCallback((document: Document) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    } else {
      navigate(`/documents/${document.id}`);
    }
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onDocumentSelect, navigate]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleDocumentSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <config.icon size={14} /> : <FileText size={14} />;
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : "bg-slate-100 text-slate-800";
  };

  return (
    <div className={cn("relative", className)}>
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
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && showResults && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg"
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

          {!isLoading && !error && debouncedQuery.length >= 2 && searchResults.length === 0 && (
            <div className="p-4 text-center">
              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">No documents found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for a different term
              </p>
            </div>
          )}

          {!isLoading && !error && searchResults.length > 0 && (
            <div className="py-2">
              {searchResults.slice(0, maxResults).map((document, index) => (
                <div
                  key={document.id}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                    selectedIndex === index && "bg-slate-100"
                  )}
                  onClick={() => handleDocumentSelect(document)}
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 truncate">
                        {document.title}
                      </h4>
                      <Badge className={cn("text-xs", getStatusColor(document.status))}>
                        {getStatusIcon(document.status)}
                        <span className="ml-1">
                          {statusConfig[document.status as keyof typeof statusConfig]?.label || document.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>v{document.version}</span>
                      <span>•</span>
                      <span>{document.category || 'General'}</span>
                      <span>•</span>
                      <span>Updated {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
              
              {searchResults.length > maxResults && (
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
                    View all {searchResults.length} results
                  </Button>
                </div>
              )}
            </div>
          )}

          {debouncedQuery.length < 2 && (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
