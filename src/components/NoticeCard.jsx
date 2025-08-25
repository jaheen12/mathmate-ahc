import React, { useState, useMemo, useCallback, memo } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  Zap,
  Bookmark,
  MoreHorizontal,
  Eye,
  Calendar
} from 'lucide-react';

// Move priority configs outside component to prevent recreation on every render
const PRIORITY_CONFIGS = {
  normal: {
    color: 'border-slate-400',
    bg: 'bg-slate-50',
    icon: Bookmark,
    iconColor: 'text-slate-500',
    label: 'Normal',
    accentColor: 'slate'
  },
  medium: {
    color: 'border-amber-400',
    bg: 'bg-amber-50',
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    label: 'Medium',
    accentColor: 'amber'
  },
  high: {
    color: 'border-orange-500',
    bg: 'bg-orange-50',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    label: 'High',
    accentColor: 'orange'
  },
  urgent: {
    color: 'border-red-500',
    bg: 'bg-red-50',
    icon: Zap,
    iconColor: 'text-red-600',
    label: 'Urgent',
    accentColor: 'red'
  }
};

// Optimized date formatter - moved outside component
const formatDate = (createdAt) => {
  if (!createdAt?.toDate) return 'Just now';
  const date = createdAt.toDate();
  const now = new Date();
  const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
};

const NoticeCard = memo(({ notice = {}, onDelete, onEdit, isOnline }) => {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Optimize expensive calculations with better memoization
  const { 
    formattedDate, 
    displayContent, 
    shouldTruncate, 
    priorityConfig, 
    wordCount,
    isPending
  } = useMemo(() => {
    const content = notice.content ?? '';
    const shouldTruncate = content.length > 200;
    const displayContent = shouldTruncate && !isExpanded 
      ? content.substring(0, 200) + '...' 
      : content;
    
    const priorityConfig = PRIORITY_CONFIGS[notice.priority] || PRIORITY_CONFIGS.normal;
    
    // More efficient word count
    const wordCount = content ? content.split(/\s+/).filter(word => word.length > 0).length : 0;
    const formattedDate = formatDate(notice.createdAt);
    const isPending = notice._metadata?.hasPendingWrites;
    
    return { 
      formattedDate, 
      displayContent, 
      shouldTruncate, 
      priorityConfig, 
      wordCount,
      isPending
    };
  }, [notice.content, notice.createdAt, notice.priority, notice._metadata?.hasPendingWrites, isExpanded]);

  const PriorityIcon = priorityConfig.icon;

  // Memoize event handlers to prevent child re-renders
  const handleDelete = useCallback(() => onDelete(notice.id), [onDelete, notice.id]);
  const handleEdit = useCallback(() => onEdit(notice), [onEdit, notice]);
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);
  const toggleActions = useCallback(() => setShowActions(prev => !prev), []);

  // Optimize mouse handlers
  const handleMouseLeave = useCallback(() => {
    setShowActions(false);
  }, []);

  return (
    <div 
      className={`
        group relative bg-white/95 backdrop-blur-sm border border-gray-200/80 
        rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 ease-out
        hover:border-gray-300/80 overflow-hidden border-l-4 transform
        hover:scale-[1.01] hover:-translate-y-1
        ${priorityConfig.color}
        ${isPending ? 'opacity-60 pointer-events-none animate-pulse' : ''}
      `}
      onMouseLeave={handleMouseLeave}
    >
      {/* Simplified background pattern - less performance impact */}
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-gray-50/50 to-transparent"></div>
      </div>

      {/* Simplified priority indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${priorityConfig.bg} opacity-30`}></div>

      <div className="relative p-6">
        {/* Header with enhanced layout */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-start gap-3">
              {/* Priority icon */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-lg ${priorityConfig.bg} 
                flex items-center justify-center mt-1 transition-transform duration-200
                group-hover:scale-105
              `}>
                <PriorityIcon className={`w-4 h-4 ${priorityConfig.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight break-words">
                  {notice.title || 'Untitled Notice'}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 ml-2 text-sm font-normal text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      saving...
                    </span>
                  )}
                </h3>

                {/* Enhanced metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <PriorityIcon className="w-3 h-3" />
                    {priorityConfig.label}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {wordCount} words
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-friendly actions toggle */}
          <div className="relative flex-shrink-0">
            {currentUser && (
              <button
                onClick={toggleActions}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                aria-label="Show actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}

            {/* Actions dropdown */}
            {showActions && currentUser && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 min-w-[160px] animate-in slide-in-from-top-2 duration-200">
                <button
                  onClick={handleEdit}
                  disabled={!isOnline || isPending}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-150"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Notice
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!isOnline || isPending}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Notice
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced content with better typography */}
        <div className="relative">
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line font-light tracking-wide">
            {displayContent}
          </p>
          
          {shouldTruncate && (
            <button
              onClick={toggleExpanded}
              className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50/50 hover:bg-blue-100/50 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              {isExpanded ? 'Show Less' : 'Read More'}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Enhanced footer - desktop actions */}
        {currentUser && (
          <div className="hidden sm:flex items-center justify-between mt-6 pt-4 border-t border-gray-100/80">
            <div className="flex items-center gap-4">
              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50/50 px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </div>
              
              {!isOnline && (
                <div className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Offline Mode
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={handleEdit}
                disabled={!isOnline || isPending}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110"
                title={isOnline ? "Edit notice" : "Cannot edit while offline"}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDelete}
                disabled={!isOnline || isPending}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110"
                title={isOnline ? "Delete notice" : "Cannot delete while offline"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile footer */}
        {currentUser && (
          <div className="sm:hidden mt-6 pt-4 border-t border-gray-100/80">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </div>
              
              {!isOnline && (
                <div className="text-xs text-amber-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Offline
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Simplified shine effect - better performance */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 -left-4 w-6 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
      </div>
    </div>
  );
});

NoticeCard.displayName = 'NoticeCard';

export default NoticeCard;