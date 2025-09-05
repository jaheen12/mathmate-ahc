import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import LocalContentRenderer from '../components/LocalContentRenderer'; // Import our new renderer

import { IoArrowBack, IoPencil, IoWarningOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const PersonalNoteViewer = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const navigate = useNavigate();

    // The key is dynamic to this specific chapter, to get the array of notes
    const localStorageKey = useMemo(() => `personal_notes_items_${chapterId}`, [chapterId]);
    const [notes] = useLocalStorage(localStorageKey, []);

    // Local state for the specific note we are viewing
    const [currentNote, setCurrentNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // This effect finds the specific note in the array from local storage
    useEffect(() => {
        const noteToView = notes.find(note => note.id === itemId);
        
        if (noteToView) {
            setCurrentNote(noteToView);
            setHeaderTitle(noteToView.name || 'View Note');
        } else {
            setCurrentNote(undefined); // Mark as not found if the ID is invalid
        }
        setIsLoading(false);
    }, [itemId, notes, setHeaderTitle]);

    const handleEdit = () => {
        // Navigate to the editor for this specific note
        navigate(`/personal-notes/${subjectId}/${chapterId}/${itemId}/edit`);
    };

    const backLink = `/personal-notes/${subjectId}/${chapterId}`;

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Skeleton height={40} width={300} className="mb-4" />
                <Skeleton height={600} />
            </div>
        );
    }

    if (currentNote === undefined) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center">
                <IoWarningOutline size={64} className="mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Note Not Found</h2>
                <p className="text-gray-600 mt-2">The note you are looking for does not exist or may have been deleted.</p>
                <Link to={backLink} className="mt-6 inline-block px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
                    Go Back to Notes
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
                        <span className="font-semibold hidden sm:inline">Back to Notes</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{currentNote?.name}</h1>
                    <button 
                        onClick={handleEdit}
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:scale-105"
                    >
                        <IoPencil className="mr-2" />
                        Edit Note
                    </button>
                </div>

                {/* Content Display */}
                <div className="flex-grow bg-white rounded-lg shadow-md p-6 prose prose-lg max-w-none">
                    {currentNote?.content ? (
                        <LocalContentRenderer content={currentNote.content} />
                    ) : (
                        <div className="text-center py-16 text-gray-500">
                            <p className="text-lg mb-4">This note is empty.</p>
                            <button 
                                onClick={handleEdit}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <IoPencil className="mr-2" size={20} />
                                Start Writing
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalNoteViewer;