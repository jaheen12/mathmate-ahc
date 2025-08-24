import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns';
import { IoTrashOutline, IoCreateOutline, IoChevronDownOutline, IoChevronUpOutline, IoTimeOutline } from 'react-icons/io5';

// 1. Add a default empty object for the notice prop
const NoticeCard = ({ notice = {}, onDelete, onEdit, isOnline }) => {
    const { currentUser } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    // This function is now safer
    const formatNoticeDate = (timestamp) => {
        if (!timestamp?.toDate) return 'Just now'; // Handles optimistic updates and missing dates
        const date = timestamp.toDate();
        return format(date, 'MMM dd, yyyy');
    };

    // 2. Use optional chaining (?.) and nullish coalescing (??) for safety
    const content = notice.content ?? ''; // If notice.content is null/undefined, use an empty string
    const shouldTruncate = content.length > 200;
    const displayContent = shouldTruncate && !isExpanded 
        ? content.substring(0, 200) + '...' 
        : content;

    const handleDelete = () => {
        // This is already correct: it lets the parent hook handle confirmation
        onDelete(notice.id);
    };

    const isPending = notice._metadata?.hasPendingWrites;

    const getPriorityColor = (priority = 'normal') => {
        switch (priority) {
            case 'medium': return 'border-yellow-400';
            case 'high': return 'border-red-500';
            case 'urgent': return 'border-purple-600';
            default: return 'border-blue-500';
        }
    };

    return (
        <div className={`
            group relative bg-white/90 backdrop-blur-sm border border-gray-200 
            rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 
            hover:border-gray-300 overflow-hidden border-l-4 
            ${getPriorityColor(notice.priority)}
            ${isPending ? 'opacity-60 pointer-events-none' : ''}
        `}>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 pr-16 sm:pr-0 leading-tight">
                            {/* 3. Provide a default title to prevent crash */}
                            {notice.title || 'Untitled Notice'}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <p className="text-gray-700 text-sm whitespace-pre-line">{displayContent}</p>
                {shouldTruncate && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                        {isExpanded ? 'Show Less' : 'Read More'}
                        {isExpanded ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                    </button>
                )}

                {/* Actions */}
                {currentUser && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <IoTimeOutline />
                            {formatNoticeDate(notice.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onEdit(notice)}
                                disabled={!isOnline || isPending}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                                title={isOnline ? "Edit notice" : "Cannot edit while offline"}
                            >
                                <IoCreateOutline size={18} />
                            </button>
                            
                            <button 
                                onClick={handleDelete}
                                disabled={!isOnline || isPending}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                                title={isOnline ? "Delete notice" : "Cannot delete while offline"}
                            >
                                <IoTrashOutline size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoticeCard;