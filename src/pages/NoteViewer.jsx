import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { 
    IoArrowBack, 
    IoSaveOutline, 
    IoPencil, 
    IoClose, 
    IoExpandOutline,
    IoContractOutline,
    IoCloudDoneOutline,
    IoWarningOutline,
    IoCheckmarkCircleOutline
} from "react-icons/io5";

// HtmlRenderer component for displaying HTML content safely
const HtmlRenderer = ({ htmlString, className = "" }) => {
    if (!htmlString) {
        return <div className="text-gray-500 italic">No content available</div>;
    }

    return (
        <div 
            className={`prose prose-lg max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: htmlString }}
        />
    );
};

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton height={40} width={200} />
            <div className="flex space-x-2">
                <Skeleton height={40} width={80} />
                <Skeleton height={40} width={80} />
            </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
            <Skeleton height={600} />
        </div>
    </div>
);

// Auto-save indicator component
const AutoSaveIndicator = ({ hasUnsavedChanges, isSaving, lastSaved }) => {
    if (isSaving) {
        return (
            <div className="flex items-center text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                Saving...
            </div>
        );
    }

    if (hasUnsavedChanges) {
        return (
            <div className="flex items-center text-sm text-orange-600">
                <IoWarningOutline className="mr-1" size={16} />
                Unsaved changes
            </div>
        );
    }

    if (lastSaved) {
        return (
            <div className="flex items-center text-sm text-green-600">
                <IoCheckmarkCircleOutline className="mr-1" size={16} />
                Saved {lastSaved.toLocaleTimeString()}
            </div>
        );
    }

    return null;
};

const NoteViewer = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const textareaRef = useRef(null);
    
    // Determine the collection path based on the URL
    const isPersonal = window.location.pathname.includes('personal-notes');
    const collectionPrefix = isPersonal ? 'personal_notes' : 'official_notes';
    const notePath = [collectionPrefix, subjectId, "chapters", chapterId, "items", itemId];
    
    // Use the Firestore document hook
    const { 
        data: note, 
        loading, 
        updateDocument,
        isOnline,
        fromCache,
        hasPendingWrites
    } = useFirestoreDocument(notePath, { enableRealtime: true });

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
    
    const backLink = isPersonal 
        ? `/personal-notes/${subjectId}/${chapterId}` 
        : `/notes/${subjectId}/${chapterId}`;

    // Update the header and local editor content when the note data changes
    useEffect(() => {
        if (note) {
            setHeaderTitle(note.name || 'Note');
            // Only update editor content if not currently editing, to avoid overwriting user's work
            if (!isEditing) {
                setEditedContent(note.content || '');
            }
            if (note.lastModified) {
                setLastSaved(note.lastModified.toDate());
            }
        } else if (!loading) {
            setHeaderTitle('Note Not Found');
        }
    }, [note, loading, isEditing, setHeaderTitle]);

    const hasUnsavedChanges = editedContent !== (note?.content || '');

    // Auto-save functionality
    const performAutoSave = useCallback(async () => {
        if (!hasUnsavedChanges || !isOnline || !currentUser) return;
        
        setIsSaving(true);
        const result = await updateDocument({
            content: editedContent,
            lastModified: new Date()
        });
        
        if (result.success) {
            setLastSaved(new Date());
            toast.success('Auto-saved', { autoClose: 2000 });
        }
        setIsSaving(false);
    }, [editedContent, hasUnsavedChanges, isOnline, currentUser, updateDocument]);

    // Debounced auto-save when content changes
    useEffect(() => {
        if (!isEditing || !hasUnsavedChanges) return;

        // Clear existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        // Set new timeout for auto-save
        const timeout = setTimeout(performAutoSave, 3000); // Auto-save after 3 seconds of inactivity
        setAutoSaveTimeout(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [editedContent, isEditing, hasUnsavedChanges, performAutoSave]);

    // Manual save handler
    const handleSave = async () => {
        if (!hasUnsavedChanges || !isOnline) return;
        
        // Clear auto-save timeout since we're manually saving
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
            setAutoSaveTimeout(null);
        }
        
        setIsSaving(true);
        const result = await updateDocument({
            content: editedContent,
            lastModified: new Date()
        });
        
        if (result.success) {
            setLastSaved(new Date());
            toast.success('Saved successfully');
        }
        setIsSaving(false);
    };

    // Edit mode toggle logic
    const toggleEditMode = useCallback(async () => {
        if (isEditing) {
            // Exiting edit mode
            if (hasUnsavedChanges) {
                const shouldSave = window.confirm('You have unsaved changes. Do you want to save them before exiting?');
                if (shouldSave && isOnline) {
                    await handleSave();
                } else if (!shouldSave) {
                    // Reset content to original if canceling
                    setEditedContent(note?.content || '');
                }
            }
            // Clear any pending auto-save
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
                setAutoSaveTimeout(null);
            }
        } else {
            // Entering edit mode
            setEditedContent(note?.content || '');
        }
        
        setIsEditing(!isEditing);
    }, [isEditing, hasUnsavedChanges, isOnline, note?.content, autoSaveTimeout, handleSave]);

    // Handle content changes in textarea
    const handleContentChange = useCallback((e) => {
        setEditedContent(e.target.value);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Save shortcut (Ctrl/Cmd + S)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isEditing && hasUnsavedChanges && isOnline) {
                    handleSave();
                }
            }
            
            // Edit shortcut (Ctrl/Cmd + E)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (currentUser && isOnline) {
                    toggleEditMode();
                }
            }
            
            // Escape to exit edit mode
            if (e.key === 'Escape' && isEditing) {
                toggleEditMode();
            }
            
            // Fullscreen toggle (F11 or Ctrl/Cmd + Shift + F)
            if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F')) {
                e.preventDefault();
                setIsFullscreen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, hasUnsavedChanges, isOnline, currentUser, handleSave, toggleEditMode]);

    // Handle beforeunload to warn about unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges && isEditing) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, isEditing]);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditing]);

    // Show loading skeleton while loading and no cached data
    if (loading && !note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <LoadingSkeleton />
                </div>
            </div>
        );
    }

    // Show not found message if no note exists and not loading
    if (!loading && !note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto text-center py-16">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Note Not Found</h1>
                    <p className="text-gray-600 mb-8">The note you're looking for doesn't exist or has been deleted.</p>
                    <Link 
                        to={backLink}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <IoArrowBack className="mr-2" size={20} />
                        Go Back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-all duration-300 ${
            isFullscreen 
                ? 'fixed inset-0 z-50 bg-white' 
                : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
        }`}>
            <div className={`${isFullscreen ? 'h-full' : 'max-w-4xl mx-auto'} p-4`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to={backLink}
                            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                            title="Go back to chapter"
                        >
                            <IoArrowBack className="mr-2" size={20} />
                            Back
                        </Link>
                        
                        <h1 className="text-2xl font-bold text-gray-800 truncate">
                            {note?.name || 'Loading...'}
                        </h1>
                        
                        {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Auto-save indicator */}
                        <AutoSaveIndicator 
                            hasUnsavedChanges={hasUnsavedChanges}
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                        />

                        {/* Fullscreen toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                            title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (F11)`}
                        >
                            {isFullscreen ? <IoContractOutline size={20} /> : <IoExpandOutline size={20} />}
                        </button>

                        {/* Edit/Save buttons */}
                        {currentUser && (
                            <div className="flex items-center space-x-2">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={toggleEditMode}
                                            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                            title="Cancel editing (Escape)"
                                        >
                                            <IoClose className="mr-2" size={18} />
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSave}
                                            disabled={!hasUnsavedChanges || isSaving || !isOnline}
                                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={!isOnline ? 'Cannot save while offline' : 'Save changes (Ctrl+S)'}
                                        >
                                            <IoSaveOutline className="mr-2" size={18} />
                                            {isSaving ? 'Saving...' : isOnline ? 'Save' : 'Offline'}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={toggleEditMode}
                                        disabled={!isOnline}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!isOnline ? 'Cannot edit while offline' : 'Edit note (Ctrl+E)'}
                                    >
                                        <IoPencil className="mr-2" size={18} />
                                        {isOnline ? 'Edit' : 'Offline'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Network Status */}
                <div className="mb-4">
                    <NetworkStatus 
                        isOnline={isOnline}
                        fromCache={fromCache}
                        hasPendingWrites={hasPendingWrites}
                    />
                </div>

                {/* Main content */}
                <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                    isFullscreen ? 'h-[calc(100vh-160px)]' : 'min-h-[600px]'
                }`}>
                    {isEditing ? (
                        <div className="h-full">
                            <textarea
                                ref={textareaRef}
                                value={editedContent}
                                onChange={handleContentChange}
                                placeholder="Start writing your note content here..."
                                className="w-full h-full p-6 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                                disabled={!isOnline}
                                style={{ minHeight: isFullscreen ? '100%' : '600px' }}
                            />
                        </div>
                    ) : (
                        <div className={`${isFullscreen ? 'h-full overflow-auto' : ''} p-6`}>
                            {note?.content ? (
                                <HtmlRenderer htmlString={note.content} />
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <p className="text-lg mb-4">This note is empty</p>
                                    {currentUser && isOnline && (
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <IoPencil className="mr-2" size={20} />
                                            Start Writing
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Help text for keyboard shortcuts */}
                {isEditing && (
                    <div className="mt-4 text-sm text-gray-600 text-center">
                        <p>
                            <strong>Shortcuts:</strong> Ctrl+S to save, Ctrl+E to toggle edit, Escape to cancel, F11 for fullscreen
                        </p>
                        <p className="mt-1">Auto-save occurs every 3 seconds while typing</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteViewer;