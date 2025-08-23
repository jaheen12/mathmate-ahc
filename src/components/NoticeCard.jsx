import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { 
    IoTrashOutline, 
    IoCreateOutline, 
    IoTimeOutline, 
    IoPersonOutline,
    IoChevronDownOutline,
    IoChevronUpOutline
} from 'react-icons/io5';

const NoticeCard = ({ notice, onDelete, onEdit }) => {
    const { currentUser } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Smart date formatting
    const formatNoticeDate = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate();
        
        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday at ${format(date, 'h:mm a')}`;
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE \'at\' h:mm a');
        } else {
            return format(date, 'MMM dd, yyyy \'at\' h:mm a');
        }
    };

    // Get relative time for tooltip
    const getRelativeTime = (timestamp) => {
        if (!timestamp) return '';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    };

    // Check if content should be truncated
    const shouldTruncate = notice.content && notice.content.length > 200;
    const displayContent = shouldTruncate && !isExpanded 
        ? notice.content.substring(0, 200) + '...'
        : notice.content;

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this notice? This action cannot be undone.")) {
            setIsDeleting(true);
            try {
                await onDelete(notice.id);
            } catch (_error) {
                setIsDeleting(false);
            }
        }
    };

    const getPriorityColor = (priority = 'normal') => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'border-l-red-500 bg-red-50/30';
            case 'medium':
                return 'border-l-yellow-500 bg-yellow-50/30';
            case 'urgent':
                return 'border-l-purple-500 bg-purple-50/30';
            default:
                return 'border-l-blue-500 bg-blue-50/20';
        }
    };

    return (
        <div className={`
            group relative bg-white/90 backdrop-blur-sm border border-gray-200 
            rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 
            hover:border-gray-300 overflow-hidden border-l-4 
            ${getPriorityColor(notice.priority)}
            ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}>
            {/* Priority indicator */}
            {notice.priority && notice.priority !== 'normal' && (
                <div className="absolute top-4 right-4">
                    <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${notice.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                        ${notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${notice.priority === 'urgent' ? 'bg-purple-100 text-purple-700' : ''}
                    `}>
                        {notice.priority}
                    </span>
                </div>
            )}

            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 pr-16 sm:pr-0 leading-tight">
                            {notice.title}
                        </h3>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1" title={getRelativeTime(notice.createdAt)}>
                                <IoTimeOutline size={16} />
                                <span className="font-medium">
                                    {formatNoticeDate(notice.createdAt)}
                                </span>
                            </div>
                            
                            {notice.author && (
                                <div className="flex items-center gap-1">
                                    <IoPersonOutline size={16} />
                                    <span>{notice.author}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative">
                    <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-0">
                            {displayContent}
                        </p>
                    </div>

                    {/* Expand/Collapse button for long content */}
                    {shouldTruncate && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-md px-1"
                        >
                            {isExpanded ? (
                                <>
                                    <span>Show less</span>
                                    <IoChevronUpOutline size={16} />
                                </>
                            ) : (
                                <>
                                    <span>Read more</span>
                                    <IoChevronDownOutline size={16} />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Actions */}
                {currentUser && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                            {notice.updatedAt && notice.updatedAt !== notice.createdAt ? (
                                <span title={format(notice.updatedAt.toDate(), 'PPpp')}>
                                    Edited {formatDistanceToNow(notice.updatedAt.toDate(), { addSuffix: true })}
                                </span>
                            ) : (
                                <span>Published {getRelativeTime(notice.createdAt)}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onEdit(notice)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                title="Edit notice"
                                disabled={isDeleting}
                            >
                                <IoCreateOutline size={18} />
                            </button>
                            
                            <button 
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                title="Delete notice"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                ) : (
                                    <IoTrashOutline size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
};

export default NoticeCard;