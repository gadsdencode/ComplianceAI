import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, 
  Edit3, 
  Share2, 
  Download, 
  Copy, 
  Settings, 
  Archive,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Star,
  Folder,
  ChevronRight
} from 'lucide-react';
import { UserDocument, Document } from '@/types';

interface DocumentMoreOptionsProps {
  document: UserDocument | Document;
  onEdit?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  onChangeStatus?: (status: string) => void;
  onArchive?: () => void;
}

export default function DocumentMoreOptions({
  document,
  onEdit,
  onShare,
  onDownload,
  onDuplicate,
  onChangeStatus,
  onArchive
}: DocumentMoreOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isUserDocument = 'userId' in document;
  const canEdit = isUserDocument || document.status === 'draft';

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollX = window.pageXOffset || window.document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || window.document.documentElement.scrollTop;
      
      setDropdownPosition({
        top: rect.bottom + scrollY + 8, // 8px gap
        left: rect.right + scrollX - 256 // 256px is dropdown width, align to right edge
      });
    }
  };

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      const handlePositionUpdate = () => updateDropdownPosition();
      
      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);
      
      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowStatusSubmenu(false);
      }
    };

    if (isOpen) {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const statusOptions = isUserDocument 
    ? [
        { 
          value: 'draft', 
          label: 'Draft', 
          icon: <Edit3 className="w-4 h-4" />, 
          color: 'text-amber-600 bg-amber-50',
          description: 'Work in progress'
        },
        { 
          value: 'review', 
          label: 'In Review', 
          icon: <Clock className="w-4 h-4" />, 
          color: 'text-blue-600 bg-blue-50',
          description: 'Under review'
        },
        { 
          value: 'approved', 
          label: 'Approved', 
          icon: <CheckCircle className="w-4 h-4" />, 
          color: 'text-green-600 bg-green-50',
          description: 'Ready to use'
        },
        { 
          value: 'archived', 
          label: 'Archived', 
          icon: <Archive className="w-4 h-4" />, 
          color: 'text-gray-600 bg-gray-50',
          description: 'No longer active'
        }
      ]
    : [
        { 
          value: 'draft', 
          label: 'Draft', 
          icon: <Edit3 className="w-4 h-4" />, 
          color: 'text-amber-600 bg-amber-50',
          description: 'Work in progress'
        },
        { 
          value: 'pending_approval', 
          label: 'Pending Approval', 
          icon: <Clock className="w-4 h-4" />, 
          color: 'text-blue-600 bg-blue-50',
          description: 'Awaiting approval'
        },
        { 
          value: 'active', 
          label: 'Active', 
          icon: <CheckCircle className="w-4 h-4" />, 
          color: 'text-green-600 bg-green-50',
          description: 'Currently active'
        },
        { 
          value: 'expired', 
          label: 'Expired', 
          icon: <AlertCircle className="w-4 h-4" />, 
          color: 'text-red-600 bg-red-50',
          description: 'No longer valid'
        },
        { 
          value: 'archived', 
          label: 'Archived', 
          icon: <Archive className="w-4 h-4" />, 
          color: 'text-gray-600 bg-gray-50',
          description: 'No longer active'
        }
      ];

  const handleOptionClick = (action: () => void) => {
    action();
    setIsOpen(false);
    setShowStatusSubmenu(false);
  };

  const quickActions = [
    ...(canEdit && onEdit ? [{
      icon: <Edit3 className="w-4 h-4" />,
      label: 'Edit',
      action: onEdit,
      color: 'hover:bg-blue-50 hover:text-blue-700',
      shortcut: 'E'
    }] : []),
    ...(onShare ? [{
      icon: <Share2 className="w-4 h-4" />,
      label: 'Share',
      action: onShare,
      color: 'hover:bg-emerald-50 hover:text-emerald-700',
      shortcut: 'S'
    }] : []),
    ...(onDownload ? [{
      icon: <Download className="w-4 h-4" />,
      label: 'Download',
      action: onDownload,
      color: 'hover:bg-purple-50 hover:text-purple-700',
      shortcut: 'D'
    }] : []),
  ];

  const secondaryActions = [
    ...(onDuplicate ? [{
      icon: <Copy className="w-4 h-4" />,
      label: 'Duplicate',
      action: onDuplicate,
      color: 'hover:bg-indigo-50 hover:text-indigo-700'
    }] : []),
  ];

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative p-2 rounded-lg transition-all duration-200 group
          ${isOpen 
            ? 'bg-white/20 text-white shadow-lg' 
            : 'hover:bg-white/10 text-gray-400 hover:text-white'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) {
            updateDropdownPosition();
          }
          setIsOpen(!isOpen);
        }}
        title="More options"
        aria-label="More options"
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.div>
        
        {/* Pulse ring on hover */}
        <motion.div
          className="absolute inset-0 rounded-lg border border-white/20"
          initial={{ scale: 1, opacity: 0 }}
          whileHover={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Portal-based dropdown to escape stacking context */}
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              duration: 0.2 
            }}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999
            }}
            className="w-64 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/60">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                                     <h4 className="font-medium text-gray-900 text-sm truncate">
                     {document.title}
                   </h4>
                  <p className="text-xs text-gray-500">
                    {isUserDocument ? 'User Document' : 'Compliance Document'}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-2">
              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="px-2">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                    Quick Actions
                  </div>
                  <div className="space-y-1">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg
                          transition-all duration-200 flex items-center justify-between group
                          ${action.color} text-gray-700
                        `}
                        onClick={() => handleOptionClick(action.action)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="transition-transform group-hover:scale-110">
                            {action.icon}
                          </div>
                          {action.label}
                        </div>
                        {action.shortcut && (
                          <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded font-mono">
                            {action.shortcut}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Management */}
              {onChangeStatus && (
                <div className="px-2 mt-3">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                    Status Management
                  </div>
                  <div className="relative">
                    <motion.button
                      className="w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-all duration-200 flex items-center justify-between group"
                      onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                        Change Status
                      </div>
                      <motion.div
                        animate={{ rotate: showStatusSubmenu ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {showStatusSubmenu && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 ml-4 space-y-1 border-l-2 border-gray-100 pl-3"
                        >
                          {statusOptions.map((status, index) => (
                            <motion.button
                              key={status.value}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`
                                w-full px-3 py-2 text-left text-sm rounded-lg
                                transition-all duration-200 flex items-center gap-3 group
                                hover:shadow-sm ${status.color}
                              `}
                              onClick={() => handleOptionClick(() => onChangeStatus(status.value))}
                            >
                              <div className="transition-transform group-hover:scale-110">
                                {status.icon}
                              </div>
                              <div>
                                <div className="font-medium">{status.label}</div>
                                <div className="text-xs opacity-75">{status.description}</div>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Secondary Actions */}
              {secondaryActions.length > 0 && (
                <div className="px-2 mt-3">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                    More Actions
                  </div>
                  <div className="space-y-1">
                    {secondaryActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (quickActions.length + index) * 0.05 }}
                        className={`
                          w-full px-3 py-2 text-left text-sm font-medium rounded-lg
                          transition-all duration-200 flex items-center gap-3 group
                          ${action.color} text-gray-700
                        `}
                        onClick={() => handleOptionClick(action.action)}
                      >
                        <div className="transition-transform group-hover:scale-110">
                          {action.icon}
                        </div>
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Destructive Actions */}
              {onArchive && (
                <div className="px-2 mt-3 pt-3 border-t border-gray-100">
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-3 group"
                    onClick={() => handleOptionClick(onArchive)}
                  >
                    <div className="transition-transform group-hover:scale-110">
                      <Archive className="w-4 h-4" />
                    </div>
                    Archive Document
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        window.document.body
      )}
    </div>
  );
} 