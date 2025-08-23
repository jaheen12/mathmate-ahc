import React, { useState, useEffect, useRef } from 'react';
import { 
    IoCloseOutline, 
    IoSaveOutline, 
    IoWarningOutline,
    IoDocumentTextOutline,
    IoTextOutline,
    IoFlagOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';

const NoticeEditorModal = ({ isOpen, onClose, notice, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('normal');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const titleInputRef = useRef(null);
    const modalRef = useRef(null);
    
    const isEditing = notice?.id;
    
    useEffect(() => {
        if (isOpen && notice) {
            setTitle(notice.title || '');
            setContent(notice.content || '');
            setPriority(notice.priority || 'normal');
            setErrors({});
            setHasUnsavedChanges(false);
            
            // Focus title input after modal opens
            setTimeout(() => {
                titleInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, notice]);

    // Track unsaved changes
    useEffect(() => {
        if (isOpen && notice) {
            const hasChanges = 
                title !== (notice.title || '') ||
                content !== (notice.content || '') ||
                priority !== (notice.priority || 'normal');
            setHasUnsavedChanges(hasChanges);
        }
    }, [title, content, priority, isOpen, notice]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, hasUnsavedChanges]);

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!title.trim()) {
            newErrors.title = 'Title is required';
        } else if (title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        } else if (title.trim().length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }
        
        if (!content.trim()) {
            newErrors.content = 'Content is required';
        } else if (content.trim().length < 10) {
            newErrors.content = 'Content must be at least 10 characters';
        } else if (content.trim().length > 2000) {
            newErrors.content = 'Content must be less than 2000 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before saving.');
            return;
        }

        setIsSaving(true);
        
        try {
            await onSave({
                id: notice?.id,
                title: title.trim(),
                content: content.trim(),
                priority: priority
            });
            
            toast.success(isEditing ? 'Notice updated successfully!' : 'Notice created successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to save notice. Please try again.');
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        }
    };

    if (!isOpen) return null;

    const priorityOptions = [
        { value: 'normal', label: 'Normal', color: 'text-gray-700' },
        { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
        { value: 'high', label: 'High', color: 'text-red-600' },
        { value: 'urgent', label: 'Urgent', color: 'text-purple-600' }
    ];

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <IoDocumentTextOutline size={24} />
                            </div>
                            <div>
                                <h2 id="modal-title" className="text-xl font-bold">
                                    {isEditing ? 'Edit Notice' : 'Create New Notice'}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {isEditing ? 'Update your notice details' : 'Share important information with your team'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Close modal"
                        >
                            <IoCloseOutline size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-6">
                        {/* Title Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <IoTextOutline size={16} />
                                Notice Title
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                                    errors.title 
                                        ? 'border-red-300 focus:border-red-500' 
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                placeholder="Enter a clear, descriptive title..."
                                maxLength="100"
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.title && (
                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                        <IoWarningOutline size={14} />
                                        {errors.title}
                                    </p>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                    {title.length}/100
                                </span>
                            </div>
                        </div>

                        {/* Priority Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <IoFlagOutline size={16} />
                                Priority Level
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {priorityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPriority(option.value)}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                                            priority === option.value
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <div className={`font-semibold ${option.color}`}>
                                            {option.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Field */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <IoDocumentTextOutline size={16} />
                                Notice Content
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-none ${
                                    errors.content 
                                        ? 'border-red-300 focus:border-red-500' 
                                        : 'border-gray-300 focus:border-blue-500'
                                }`}
                                placeholder="Write your notice content here... You can use line breaks and formatting."
                                rows="8"
                                maxLength="2000"
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.content && (
                                    <p className="text-red-500 text-sm flex items-center gap-1">
                                        <IoWarningOutline size={14} />
                                        {errors.content}
                                    </p>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                    {content.length}/2000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                                Ctrl + S
                            </kbd>
                            <span className="ml-2">to save</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={isSaving || Object.keys(errors).length > 0}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <IoSaveOutline size={18} />
                                        {isEditing ? 'Update Notice' : 'Create Notice'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeEditorModal;