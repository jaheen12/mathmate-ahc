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

// Enhanced HtmlRenderer component with better equation handling
const HtmlRenderer = ({ htmlString, className = "", isFullscreen = false }) => {
    if (!htmlString) {
        return <div className="text-gray-500 italic">No content available</div>;
    }

    const baseClasses = isFullscreen 
        ? "prose prose-xl max-w-none w-full" 
        : "prose prose-lg max-w-none";

    return (
        <div 
            className={`${baseClasses} ${className} enhanced-content`}
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
    const contentRef = useRef(null);
    
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
        if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        const timeout = setTimeout(performAutoSave, 3000);
        setAutoSaveTimeout(timeout);
        return () => clearTimeout(timeout);
    }, [editedContent, isEditing, hasUnsavedChanges, performAutoSave]);

    // Manual save handler
    const handleSave = async () => {
        if (!hasUnsavedChanges || !isOnline) return;
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
            if (hasUnsavedChanges) {
                if (window.confirm('You have unsaved changes. Save before exiting?')) {
                    if(isOnline) await handleSave();
                } else {
                    setEditedContent(note?.content || '');
                }
            }
            if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
        } else {
            setEditedContent(note?.content || '');
        }
        setIsEditing(!isEditing);
    }, [isEditing, hasUnsavedChanges, isOnline, note?.content, autoSaveTimeout, handleSave]);

    const handleContentChange = useCallback((e) => setEditedContent(e.target.value), []);

    // Enhanced fullscreen toggle with body scroll lock
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => {
            const newFullscreen = !prev;
            if (newFullscreen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'unset';
            }
            return newFullscreen;
        });
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isEditing && hasUnsavedChanges && isOnline) handleSave();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (currentUser && isOnline) toggleEditMode();
            }
            if (e.key === 'Escape' && isEditing) toggleEditMode();
            if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
                e.preventDefault();
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, hasUnsavedChanges, isOnline, currentUser, handleSave, toggleEditMode, toggleFullscreen]);

    // Cleanup fullscreen on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Unload warning
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges && isEditing) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes that will be lost.';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, isEditing]);

    // Focus textarea on edit
    useEffect(() => {
        if (isEditing && textareaRef.current) textareaRef.current.focus();
    }, [isEditing]);

    if (loading && !note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto"><LoadingSkeleton /></div>
            </div>
        );
    }

    if (!loading && !note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto text-center py-16">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Note Not Found</h1>
                    <p className="text-gray-600 mb-8">This note may have been deleted.</p>
                    <Link to={backLink} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <IoArrowBack className="mr-2" size={20} /> Go Back
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Enhanced CSS for better content display */}
            <style>{`
                /* Enhanced content styles */
                .enhanced-content {
                    line-height: 1.7;
                    font-size: 16px;
                }
                
                /* Better equation and code block handling */
                .enhanced-content pre,
                .enhanced-content code,
                .enhanced-content .font-mono,
                .enhanced-content .bg-gray-50,
                .enhanced-content .bg-gradient-to-br {
                    overflow-x: auto;
                    max-width: 100%;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                
                /* Long equation specific styling */
                .enhanced-content .equation-block,
                .enhanced-content .math-display,
                .enhanced-content [class*="katex"],
                .enhanced-content [class*="math"] {
                    overflow-x: auto;
                    overflow-y: hidden;
                    max-width: 100%;
                    display: block;
                    margin: 1em 0;
                    padding: 0.5em;
                    background: rgba(0,0,0,0.02);
                    border-radius: 4px;
                }
                
                /* Table responsiveness */
                .enhanced-content table {
                    display: block;
                    overflow-x: auto;
                    white-space: nowrap;
                    max-width: 100%;
                }
                
                /* Image responsiveness */
                .enhanced-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                /* Fullscreen specific styles */
                .fullscreen-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: white;
                    z-index: 9999;
                    overflow: hidden;
                }
                
                .fullscreen-content {
                    height: calc(100vh - 80px);
                    overflow-y: auto;
                    padding: 2rem;
                    font-size: 18px;
                    line-height: 1.8;
                    max-width: none;
                }
                
                /* Better scrollbars */
                .enhanced-content::-webkit-scrollbar,
                .fullscreen-content::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                .enhanced-content::-webkit-scrollbar-track,
                .fullscreen-content::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                .enhanced-content::-webkit-scrollbar-thumb,
                .fullscreen-content::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                
                .enhanced-content::-webkit-scrollbar-thumb:hover,
                .fullscreen-content::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                
                /* Focus styles for accessibility */
                .enhanced-content:focus-visible {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                
                /* Print styles */
                @media print {
                    .enhanced-content {
                        font-size: 12pt;
                        line-height: 1.5;
                        max-width: none;
                    }
                }
            `}</style>
            
            <div className={isFullscreen ? 'fullscreen-container' : 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'}>
                <div className={isFullscreen ? 'h-full flex flex-col' : 'max-w-6xl mx-auto p-4'}>
                    {/* Header */}
                    <div className={`flex justify-between items-center mb-6 flex-wrap gap-4 ${isFullscreen ? 'px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0' : ''}`}>
                        <div className="flex items-center space-x-4">
                            <Link 
                                to={backLink} 
                                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" 
                                title="Go back to chapter"
                            >
                                <IoArrowBack className="mr-2" size={20} /> Back
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-800 truncate">
                                {note?.name || 'Loading...'}
                            </h1>
                            {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <AutoSaveIndicator 
                                hasUnsavedChanges={hasUnsavedChanges} 
                                isSaving={isSaving} 
                                lastSaved={lastSaved} 
                            />
                            
                            <button 
                                onClick={toggleFullscreen} 
                                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" 
                                title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (F11)`}
                            >
                                {isFullscreen ? <IoContractOutline size={20} /> : <IoExpandOutline size={20} />}
                            </button>
                            
                            {currentUser && (
                                <div className="flex items-center space-x-2">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={toggleEditMode} 
                                                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors" 
                                                title="Cancel editing (Escape)"
                                            >
                                                <IoClose className="mr-2" size={18} /> Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave} 
                                                disabled={!hasUnsavedChanges || isSaving || !isOnline} 
                                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                                title={!isOnline ? 'Cannot save while offline' : 'Save changes (Ctrl+S)'}
                                            >
                                                <IoSaveOutline className="mr-2" size={18} /> 
                                                {isSaving ? 'Saving...' : 'Save'}
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
                    {!isFullscreen && (
                        <div className="mb-4">
                            <NetworkStatus 
                                isOnline={isOnline} 
                                fromCache={fromCache} 
                                hasPendingWrites={hasPendingWrites} 
                            />
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`bg-white shadow-lg transition-all duration-300 ${
                        isFullscreen 
                            ? 'flex-1 overflow-hidden' 
                            : 'rounded-xl min-h-[70vh]'
                    }`}>
                        {isEditing ? (
                            <div className={isFullscreen ? 'h-full' : 'h-full min-h-[70vh]'}>
                                <textarea
                                    ref={textareaRef}
                                    value={editedContent}
                                    onChange={handleContentChange}
                                    placeholder="Start writing your note content here..."
                                    className={`w-full h-full border-none outline-none resize-none font-mono leading-relaxed ${
                                        isFullscreen 
                                            ? 'text-lg p-8' 
                                            : 'text-sm p-6'
                                    }`}
                                    disabled={!isOnline}
                                />
                            </div>
                        ) : (
                            <div className={
                                isFullscreen 
                                    ? 'fullscreen-content' 
                                    : 'p-6 overflow-x-auto'
                            }>
                                {note?.content ? (
                                    <HtmlRenderer 
                                        htmlString={note.content} 
                                        isFullscreen={isFullscreen}
                                    />
                                ) : (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-lg mb-4">This note is empty</p>
                                        {currentUser && isOnline && (
                                            <button 
                                                onClick={() => setIsEditing(true)} 
                                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <IoPencil className="mr-2" size={20} /> Start Writing
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Edit Mode Shortcuts */}
                    {isEditing && !isFullscreen && (
                        <div className="mt-4 text-sm text-gray-600 text-center">
                            <p><strong>Shortcuts:</strong> Ctrl+S to save, Ctrl+E to toggle edit, Escape to cancel, F11 for fullscreen</p>
                            <p className="mt-1">Auto-save occurs 3 seconds after you stop typing</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NoteViewer;