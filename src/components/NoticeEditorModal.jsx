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

const NoticeEditorModal = ({ isOpen, onClose, notice, onSave, isOnline }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('normal');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const titleInputRef = useRef(null);
    
    const isEditing = Boolean(notice?.id);
    
    useEffect(() => {
        // This effect will now only run when `isOpen` is true and `notice` is a valid object
        if (isOpen && notice) {
            setTitle(notice.title || '');
            setContent(notice.content || '');
            setPriority(notice.priority || 'normal');
            setErrors({});
            setHasUnsavedChanges(false);

            setTimeout(() => titleInputRef.current?.focus(), 100);
        }
    }, [isOpen, notice]);

    // This effect can stay as it is
    useEffect(() => {
        const hasChanges = 
            notice && (
                title !== (notice.title || '') ||
                content !== (notice.content || '') ||
                priority !== (notice.priority || 'normal')
            );
        setHasUnsavedChanges(hasChanges);
    }, [title, content, priority, notice]);

    const handleClose = () => {
        if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            return;
        }
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) handleClose();
    };
    
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, hasUnsavedChanges]); // Dependencies are correct
    
    const validateForm = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (!content.trim()) newErrors.content = 'Content is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors before saving.');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: notice.id, title: title.trim(), content: content.trim(), priority });
            onClose();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            handleSave();
        }
    };
    
    // --- CRITICAL FIX: Add a guard clause ---
    // This prevents the modal from trying to render if it's not open or if the notice object is missing.
    // This is the ultimate safety net against the "Cannot read properties of null" error.
    if (!isOpen || !notice) {
        return null;
    }

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
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        {/* ... header content ... */}
                        <h2 className="text-xl font-bold">{isEditing ? 'Edit Notice' : 'Create New Notice'}</h2>
                        <button onClick={handleClose}><IoCloseOutline size={24} /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* ... form fields, now safe to use `title`, `content`, etc. ... */}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
                    <div className="flex items-center gap-3">
                        <button onClick={handleClose} className="px-4 py-2" disabled={isSaving}>Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isOnline}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : (isEditing ? 'Update Notice' : 'Create Notice')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeEditorModal;