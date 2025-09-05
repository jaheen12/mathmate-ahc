import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from 'react-toastify';
// --- NEW: Import local file helpers ---
import { saveFileLocally } from '../utils/localFileStore';

import { IoArrowBack, IoSaveOutline, IoWarningOutline, IoCheckmarkCircleOutline, IoAttach } from "react-icons/io5";

const PersonalNoteEditor = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const localStorageKey = `personal_notes_items_${chapterId}`;
    const [notes, setNotes] = useLocalStorage(localStorageKey, []);
    
    const [currentNote, setCurrentNote] = useState(null);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState(null);
    const hasUnsavedChanges = currentNote ? content !== (currentNote.content || '') : false;
    const autoSaveTimeoutRef = useRef(null);
    const fileInputRef = useRef(null); // Ref for the hidden file input

    useEffect(() => {
        const noteToEdit = notes.find(note => note.id === itemId);
        if (noteToEdit) {
            setCurrentNote(noteToEdit);
            setContent(noteToEdit.content || '');
            setHeaderTitle(noteToEdit.name || 'Edit Note');
        } else {
            setCurrentNote(undefined);
        }
        setIsLoading(false);
    }, [itemId, notes, setHeaderTitle]);

    const performSave = useCallback(() => {
        if (!currentNote || !hasUnsavedChanges) return;
        setIsSaving(true);
        const updatedNotes = notes.map(note => 
            note.id === itemId 
                ? { ...note, content, updatedAt: new Date().toISOString() } 
                : note
        );
        setNotes(updatedNotes);
        setTimeout(() => {
            setLastSaved(new Date());
            setIsSaving(false);
        }, 300);
    }, [currentNote, content, itemId, notes, setNotes, hasUnsavedChanges]);
    
    const handleManualSave = () => {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        performSave();
        toast.success('Note saved locally!');
    };

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => { performSave(); }, 2000);
        return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
    }, [content, hasUnsavedChanges, performSave]);

    // --- NEW: File Upload Handler ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.info('Attaching file locally...');
            const fileId = await saveFileLocally(file);
            
            // Insert a special placeholder into the note content
            const placeholder = `\n[local-file:${fileId}]\n`;
            setContent(prevContent => prevContent + placeholder);
            
            toast.success('File attached successfully!');
        } catch (error) {
            console.error("Failed to save file locally:", error);
            toast.error("Could not attach file.");
        }
        // Reset file input
        e.target.value = null; 
    };

    const triggerFileInput = () => fileInputRef.current?.click();
    const backLink = `/personal-notes/${subjectId}/${chapterId}`;

    if (isLoading) return <div className="p-6 text-center">Loading note...</div>;
    if (currentNote === undefined) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <IoWarningOutline size={64} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Note Not Found</h2>
                <Link to={backLink} className="mt-6 inline-block px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">Go Back</Link>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <Link to={backLink} className="flex items-center text-gray-600 p-2 rounded-lg hover:bg-gray-200">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 truncate">{currentNote?.name}</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            {isSaving ? "Saving..." : !hasUnsavedChanges && lastSaved ? <span className="flex items-center gap-1 text-green-600"><IoCheckmarkCircleOutline /> Saved</span> : hasUnsavedChanges ? "Unsaved changes" : ""}
                        </div>
                        {/* --- NEW: Attach Button --- */}
                        <button onClick={triggerFileInput} className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">
                            <IoAttach className="mr-2" /> Attach
                        </button>
                        <button onClick={handleManualSave} disabled={isSaving || !hasUnsavedChanges} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:opacity-50">
                            <IoSaveOutline className="mr-2" /> Save
                        </button>
                    </div>
                </div>
                {/* --- NEW: Hidden File Input --- */}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                
                <div className="flex-grow flex flex-col bg-white rounded-lg shadow-md">
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start writing... Attach files to save them on this device." className="w-full h-full flex-grow p-6 border-none outline-none resize-none bg-transparent text-lg leading-relaxed" spellCheck="false" />
                </div>
            </div>
        </div>
    );
};

export default PersonalNoteEditor;