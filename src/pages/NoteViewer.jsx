// src/pages/NoteViewer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { 
    IoArrowBack, 
    IoSaveOutline, 
    IoPencil, 
    IoClose, 
    IoEyeOutline,
    IoExpandOutline,
    IoContractOutline,
    IoCloudDoneOutline,
    IoAlertCircleOutline,
    IoTimeOutline
} from "react-icons/io5";

// Enhanced HTML renderer with better styling and error handling
const HtmlRenderer = ({ htmlString, className = "" }) => {
    const containerRef = React.useRef(null);
    const [renderError, setRenderError] = useState(false);

    React.useEffect(() => {
        if (containerRef.current) {
            try {
                const content = htmlString || '<div class="text-gray-500 italic text-center py-8">No content available</div>';
                containerRef.current.innerHTML = content;
                setRenderError(false);
                
                // Add click handlers for interactive elements
                const links = containerRef.current.querySelectorAll('a');
                links.forEach(link => {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                });
            } catch (error) {
                console.error('HTML rendering error:', error);
                setRenderError(true);
            }
        }
    }, [htmlString]);

    if (renderError) {
        return (
            <div className="flex items-center justify-center py-12 text-red-500">
                <IoAlertCircleOutline className="mr-2" size={24} />
                <span>Error rendering content</span>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className={`prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-blue-600 prose-code:bg-gray-100 prose-pre:bg-gray-900 prose-blockquote:border-l-blue-500 ${className}`} 
        />
    );
};

const NoteViewer = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    
    const { currentUser } = useAuth();
    
    const isPersonal = window.location.pathname.includes('personal-notes');
    const collectionPrefix = isPersonal ? 'personal_notes' : 'official_notes';
    const backLink = isPersonal 
        ? `/personal-notes/${subjectId}/${chapterId}` 
        : `/notes/${subjectId}/${chapterId}`;

    // Auto-save functionality
    useEffect(() => {
        if (!autoSaveEnabled || !hasUnsavedChanges || !isEditing) return;
        
        const autoSaveTimer = setTimeout(() => {
            handleSave(true); // true indicates auto-save
        }, 3000); // Auto-save after 3 seconds of inactivity

        return () => clearTimeout(autoSaveTimer);
    }, [editedContent, hasUnsavedChanges, isEditing, autoSaveEnabled]);

    // Handle content changes
    const handleContentChange = useCallback((newContent) => {
        setEditedContent(newContent);
        setHasUnsavedChanges(newContent !== (note?.content || ''));
    }, [note?.content]);

    // Fetch note data
    useEffect(() => {
        const fetchNote = async () => {
            setHeaderTitle('Loading Note...');
            setLoading(true);
            if (!itemId) return;

            try {
                const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
                const docSnap = await getDoc(noteDocRef);

                if (docSnap.exists()) {
                    const noteData = docSnap.data();
                    setNote(noteData);
                    setEditedContent(noteData.content || '');
                    setHeaderTitle(noteData.name || 'Note');
                    setLastSaved(noteData.lastModified?.toDate() || null);
                } else {
                    toast.error("Note not found.");
                    setHeaderTitle('Note Not Found');
                }
            } catch (error) {
                console.error("Error fetching note:", error);
                toast.error("Failed to load the note.");
                setHeaderTitle('Error');
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [itemId, setHeaderTitle, subjectId, chapterId, collectionPrefix]);

    // Handle save operation
    const handleSave = async (isAutoSave = false) => {
        if (!hasUnsavedChanges) return;
        
        setIsSaving(true);
        try {
            const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
            const updateData = {
                content: editedContent,
                lastModified: new Date()
            };
            
            await updateDoc(noteDocRef, updateData);
            
            setNote(prev => ({ ...prev, ...updateData }));
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            
            if (isAutoSave) {
                toast.success('Auto-saved', { autoClose: 1000 });
            } else {
                toast.success('Note saved successfully!');
            }
        } catch (error) {
            console.error("Error saving note:", error);
            toast.error('Failed to save note.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle edit mode toggle
    const toggleEditMode = () => {
        if (isEditing && hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Do you want to save before exiting edit mode?')) {
                handleSave();
            } else {
                setEditedContent(note?.content || '');
                setHasUnsavedChanges(false);
            }
        }
        setIsEditing(!isEditing);
    };

    // Handle navigation with unsaved changes
    const handleNavigation = (e) => {
        if (hasUnsavedChanges && isEditing) {
            e.preventDefault();
            if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                navigate(backLink);
            }
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        if (isEditing) handleSave();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (currentUser) toggleEditMode();
                        break;
                    case 'Escape':
                        if (isEditing) toggleEditMode();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, currentUser]);

    const LoadingSkeleton = () => (
        <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="w-24 h-10 bg-gray-300 rounded"></div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <LoadingSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${isEditing ? 'editing-mode' : ''}`}>
            <div className={`${isFullscreen ? 'h-full' : 'max-w-4xl mx-auto'} p-4`}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to={backLink} 
                            onClick={handleNavigation}
                            className="group flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
                            title="Back to chapter"
                        >
                            <IoArrowBack 
                                size={20} 
                                className="text-gray-600 group-hover:text-gray-800 transition-colors" 
                            />
                        </Link>
                        
                        {note && (
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-gray-800 truncate max-w-md">
                                    {note.name || 'Untitled Note'}
                                </h1>
                                {lastSaved && (
                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                        <IoTimeOutline className="mr-1" size={14} />
                                        Last saved: {lastSaved.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                        {/* Fullscreen toggle */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50"
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? (
                                <IoContractOutline size={18} className="text-gray-600" />
                            ) : (
                                <IoExpandOutline size={18} className="text-gray-600" />
                            )}
                        </button>

                        {/* Save status indicator */}
                        {isEditing && (
                            <div className="hidden sm:flex items-center space-x-2">
                                {isSaving ? (
                                    <div className="flex items-center text-blue-600 text-sm">
                                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                                        Saving...
                                    </div>
                                ) : hasUnsavedChanges ? (
                                    <div className="flex items-center text-orange-600 text-sm">
                                        <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                                        Unsaved changes
                                    </div>
                                ) : (
                                    <div className="flex items-center text-green-600 text-sm">
                                        <IoCloudDoneOutline className="mr-1" size={16} />
                                        Saved
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Edit/Save buttons */}
                        {currentUser && (
                            <div className="flex items-center space-x-2">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={() => toggleEditMode()}
                                            className="flex items-center justify-center w-10 h-10 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-600 transition-all duration-200"
                                            title="Cancel editing (Esc)"
                                        >
                                            <IoClose size={20} />
                                        </button>
                                        <button 
                                            onClick={() => handleSave()}
                                            disabled={!hasUnsavedChanges || isSaving}
                                            className="flex items-center px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Save changes (Ctrl+S)"
                                        >
                                            <IoSaveOutline className="mr-2" size={18} />
                                            <span className="hidden sm:inline">Save</span>
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-blue-600 transition-all duration-200"
                                        title="Edit note (Ctrl+E)"
                                    >
                                        <IoPencil className="mr-2" size={18} />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content */}
                <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'min-h-[600px]'}`}>
                    {isEditing ? (
                        <div className={`${isFullscreen ? 'h-full' : 'h-[600px]'} flex flex-col`}>
                            {/* Editor toolbar */}
                            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>HTML Editor</span>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={autoSaveEnabled}
                                            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                                            className="mr-2"
                                        />
                                        Auto-save
                                    </label>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {editedContent.length} characters
                                </div>
                            </div>
                            
                            {/* Editor */}
                            <textarea
                                value={editedContent}
                                onChange={(e) => handleContentChange(e.target.value)}
                                className="flex-1 p-6 border-none outline-none font-mono text-sm bg-gray-50 resize-none placeholder-gray-400"
                                placeholder="Enter your HTML content with MathML here...

Tips:
- Use standard HTML tags for formatting
- Include MathML for mathematical expressions
- Press Ctrl+S to save
- Press Ctrl+E to toggle edit mode"
                                spellCheck="false"
                            />
                        </div>
                    ) : (
                        <div className={`${isFullscreen ? 'h-full overflow-auto' : ''} p-6`}>
                            <HtmlRenderer 
                                htmlString={note?.content} 
                                className="leading-relaxed"
                            />
                        </div>
                    )}
                </div>

                {/* Keyboard shortcuts help */}
                {isEditing && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800">
                            <strong>Keyboard shortcuts:</strong> 
                            <span className="ml-2">Ctrl+S (Save) • Ctrl+E (Toggle Edit) • Esc (Cancel)</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Loading overlay */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 shadow-xl">
                        <div className="flex items-center">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                            Saving...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoteViewer;