import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    X, 
    Save, 
    AlertTriangle,
    FileText,
    Type,
    Flag,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// Lightweight input component
const FormInput = React.memo(({ 
    label, 
    value, 
    onChange, 
    error, 
    placeholder, 
    required = false, 
    autoFocus = false,
    multiline = false,
    rows = 4,
    maxLength,
    icon: Icon
}) => {
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Delay focus to ensure modal is fully rendered
            const timer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    const Component = multiline ? 'textarea' : 'input';
    
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                {Icon && <Icon className="w-4 h-4" />}
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <Component
                    ref={inputRef}
                    type={multiline ? undefined : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={multiline ? rows : undefined}
                    maxLength={maxLength}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 resize-none
                        ${error 
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        } 
                        focus:outline-none placeholder-gray-500`}
                />
                {maxLength && (
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {value.length}/{maxLength}
                    </div>
                )}
            </div>
            {error && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
});

// Lightweight select component
const FormSelect = React.memo(({ label, value, onChange, options, icon: Icon }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        <div className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${
                value === 'urgent' ? 'bg-red-400' :
                value === 'high' ? 'bg-orange-400' :
                value === 'medium' ? 'bg-yellow-400' :
                'bg-gray-400'
            }`}></div>
            <span className="text-gray-600">
                {value === 'urgent' ? 'Requires immediate attention' :
                 value === 'high' ? 'Important but not critical' :
                 value === 'medium' ? 'Moderately important' :
                 'Standard priority'}
            </span>
        </div>
    </div>
));

// Optimized button component
const Button = React.memo(({ 
    children, 
    onClick, 
    disabled = false, 
    variant = 'primary', 
    loading = false,
    icon: Icon,
    className = '',
    ...props 
}) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed";
    
    const variantClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/50 disabled:bg-gray-400",
        secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500/50 disabled:bg-gray-100 disabled:text-gray-400",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50 disabled:bg-gray-400"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : Icon && (
                <Icon className="w-4 h-4" />
            )}
            {children}
        </button>
    );
});

const NoticeEditorModal = ({ isOpen, onClose, notice, onSave, isOnline }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal'
    });
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const isEditing = Boolean(notice?.id);
    
    // Memoized priority options
    const priorityOptions = useMemo(() => [
        { value: 'normal', label: 'Normal Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
        { value: 'urgent', label: 'Urgent Priority' }
    ], []);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && notice) {
            const initialData = {
                title: notice.title || '',
                content: notice.content || '',
                priority: notice.priority || 'normal'
            };
            setFormData(initialData);
            setErrors({});
            setHasUnsavedChanges(false);
        }
    }, [isOpen, notice]);

    // Track unsaved changes
    useEffect(() => {
        if (!notice) return;
        
        const hasChanges = 
            formData.title !== (notice.title || '') ||
            formData.content !== (notice.content || '') ||
            formData.priority !== (notice.priority || 'normal');
        
        setHasUnsavedChanges(hasChanges);
    }, [formData, notice]);

    // Memoized handlers
    const handlers = useMemo(() => ({
        updateField: (field) => (value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            // Clear error when user starts typing
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        },
        
        close: () => {
            if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                return;
            }
            onClose();
        },

        save: async () => {
            // Validate form
            const newErrors = {};
            if (!formData.title.trim()) newErrors.title = 'Title is required';
            if (!formData.content.trim()) newErrors.content = 'Content is required';
            
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                toast.error('Please fix the errors before saving.');
                return;
            }

            setIsSaving(true);
            try {
                await onSave({
                    id: notice?.id,
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    priority: formData.priority
                });
                
                // Show success message
                toast.success(isEditing ? 'Notice updated successfully!' : 'Notice created successfully!');
                onClose();
            } catch (error) {
                console.error('Save error:', error);
                toast.error('Failed to save notice. Please try again.');
            } finally {
                setIsSaving(false);
            }
        },

        backdropClick: (e) => {
            if (e.target === e.currentTarget) {
                handlers.close();
            }
        }
    }), [formData, errors, hasUnsavedChanges, notice, onSave, onClose, isEditing]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handlers.save();
            }
            if (e.key === 'Escape') {
                handlers.close();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handlers]);

    // Early return if modal should not be rendered
    if (!isOpen || !notice) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in-0 duration-200"
            onClick={handlers.backdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6" />
                            <h2 className="text-xl font-bold">
                                {isEditing ? 'Edit Notice' : 'Create New Notice'}
                            </h2>
                        </div>
                        <button 
                            onClick={handlers.close}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Status indicator */}
                    {!isOnline && (
                        <div className="flex items-center gap-2 mt-2 text-yellow-100">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">You're offline. Changes will be saved when you reconnect.</span>
                        </div>
                    )}
                </header>

                {/* Content */}
                <main className="flex-1 p-6 overflow-y-auto space-y-6">
                    <FormInput
                        label="Notice Title"
                        value={formData.title}
                        onChange={handlers.updateField('title')}
                        error={errors.title}
                        placeholder="Enter a clear and concise title..."
                        required
                        autoFocus
                        maxLength={100}
                        icon={Type}
                    />

                    <FormInput
                        label="Notice Content"
                        value={formData.content}
                        onChange={handlers.updateField('content')}
                        error={errors.content}
                        placeholder="Write your notice content here..."
                        required
                        multiline
                        rows={8}
                        maxLength={2000}
                        icon={FileText}
                    />

                    <FormSelect
                        label="Priority Level"
                        value={formData.priority}
                        onChange={handlers.updateField('priority')}
                        options={priorityOptions}
                        icon={Flag}
                    />
                </main>

                {/* Footer */}
                <footer className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {hasUnsavedChanges && (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    <span>You have unsaved changes</span>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={handlers.close}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                variant="primary"
                                onClick={handlers.save}
                                loading={isSaving}
                                disabled={!isOnline}
                                icon={isSaving ? undefined : Save}
                            >
                                {isSaving 
                                    ? 'Saving...' 
                                    : isEditing 
                                        ? 'Update Notice' 
                                        : 'Create Notice'
                                }
                            </Button>
                        </div>
                    </div>
                    
                    {/* Keyboard shortcut hint */}
                    <div className="mt-2 text-xs text-gray-400 text-right">
                        Press Ctrl+S to save, Esc to close
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default NoticeEditorModal;