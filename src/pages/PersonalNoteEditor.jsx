import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage'; // 1. Import your powerful hook

import { IoArrowBack, IoSaveOutline, IoWarningOutline } from "react-icons/io5";
import { toast } from 'react-toastify';

const PersonalNoteEditor = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const navigate = useNavigate();

    // 2. Define the dynamic key to get the ARRAY of notes for this chapter
    const localStorageKey = `personal_notes_items_${chapterId}`;
    const { value: notes, setValue: setNotes } = useLocalStorage(localStorageKey, []);

    // 3. Local state for the specific note we are editing
    const [currentNote, setCurrentNote] = useState(null);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // This effect finds the specific note in the array and sets the initial state
    useEffect(() => {
        const noteToEdit = notes.find(note => note.id === itemId);
        
        if (noteToEdit) {
            setCurrentNote(noteToEdit);
            setContent(noteToEdit.content || ''); // Set content for the editor
            setHeaderTitle(noteToEdit.name || 'Edit Note');
        } else {
            // If the note doesn't exist (e.g., bad URL), we'll mark it as not found
            setCurrentNote(undefined); 
        }
        setIsLoading(false);
    }, [itemId, notes, setHeaderTitle]);

    // 4. The core save logic
    const handleSave = useCallback(() => {
        if (!currentNote) return;

        setIsSaving(true);

        // Create the NEW, updated array of notes
        const updatedNotes = notes.map(note => 
            note.id === itemId 
                ? { ...note, content, updatedAt: new Date().toISOString() } // Replace the old note with the updated content
                : note // Keep all other notes the same
        );

        // Save the ENTIRE updated array back to local storage
        setNotes(updatedNotes);
        
        // Simulate a save delay for better UX and show a toast
        setTimeout(() => {
            toast.success('Note saved locally!');
            setIsSaving(false);
        }, 500);

    }, [currentNote, content, itemId, notes, setNotes]);

    const backLink = `/personal-notes/${subjectId}/${chapterId}`;

    if (isLoading) {
        return <div className="p-6">Loading note...</div>;
    }

    if (currentNote === undefined) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <IoWarningOutline size={64} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Note Not Found</h2>
                <p className="text-gray-600 mt-2">The note you are looking for does not exist or may have been deleted.</p>
                <Link to={backLink} className="mt-6 inline-block px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                    Go Back to Chapter
                </Link>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <Link to={backLink} className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Items</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 truncate">{currentNote?.name}</h1>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:opacity-50"
                    >
                        <IoSaveOutline className="mr-2" />
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-grow flex flex-col bg-white rounded-lg shadow-md">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing your note here... Your changes are saved locally to this device."
                        className="w-full h-full flex-grow p-6 border-none outline-none resize-none bg-transparent text-lg leading-relaxed"
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalNoteEditor;