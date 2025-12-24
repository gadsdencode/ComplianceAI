import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Zap, Clock, Command, Star, BarChart3, Users, Settings, Plus } from 'lucide-react';
import EnhancedDocumentSearch from '@/components/common/EnhancedDocumentSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock document data for demo
const mockDocuments = [
  { id: "1", title: "Product Requirements Document", status: "active", updatedAt: new Date().toISOString() },
  { id: "2", title: "Q4 Marketing Strategy", status: "draft", updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Engineering Roadmap 2024", status: "pending_approval", updatedAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "4", title: "Design System Guidelines", status: "active", updatedAt: new Date(Date.now() - 604800000).toISOString() },
  { id: "5", title: "Customer Feedback Analysis", status: "archived", updatedAt: new Date(Date.now() - 1209600000).toISOString() },
];

export default function EnhancedSearchbarDemo() {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    if (!searchHistory.includes(document.title)) {
      setSearchHistory(prev => [document.title, ...prev.slice(0, 4)]);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Enhanced Search Bar
              </h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience the next generation of document search with enhanced visual design, 
              smooth animations, and intuitive interactions.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>Press</span>
              <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold">
                ⌘K
              </kbd>
              <span>to focus the search</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Bar Demo */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Enhanced Search Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <EnhancedDocumentSearch
                      placeholder="Search documents, create new ones, or navigate anywhere..."
                      onDocumentSelect={handleDocumentSelect}
                      onSearch={handleSearch}
                      maxResults={8}
                      showQuickActions={true}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-slate-700">Key Features</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Glassmorphism design
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Smooth animations
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Tabbed interface
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Keyboard shortcuts
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-slate-700">Shortcuts</h4>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li className="flex items-center justify-between">
                          <span>Focus search</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">⌘K</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Navigate results</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">↑↓</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Switch tabs</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">Tab</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Close search</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">Esc</kbd>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Selected Document Display */}
            {selectedDocument && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Selected Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{selectedDocument.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedDocument.status}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          ID: {selectedDocument.id}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-primary" />
                      Recent Searches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {searchHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Search className="h-3 w-3 text-slate-400" />
                          <span className="text-sm text-slate-700 truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Quick Actions Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Plus, label: "Create", shortcut: "⌘N" },
                      { icon: BarChart3, label: "Analytics", shortcut: "⌘A" },
                      { icon: Users, label: "Users", shortcut: "⌘U" },
                      { icon: Settings, label: "Settings", shortcut: "⌘," },
                    ].map((action, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <action.icon className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-700">{action.label}</span>
                        <kbd className="px-1 py-0.5 rounded bg-slate-100 text-xs">{action.shortcut}</kbd>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Visual Enhancements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-primary" />
                    Visual Enhancements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span>Subtle glow effects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span>Backdrop blur</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span>Micro-interactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span>Enhanced typography</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" />
                      <span>Improved spacing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

