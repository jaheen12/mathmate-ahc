import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import NoteEditor from '../components/NoteEditor';
import { useAuth } from '../AuthContext';
import { IoArrowBack, IoSaveOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteViewer = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    
    // Determine the correct collection path based on the URL
    const isPersonal = window.location.pathname.includes('personal-notes');
    const collectionPrefix = isPersonal ? 'personal_notes' : 'official_notes';
    const backLink = isPersonal 
        ? `/personal-notes/${subjectId}/${chapterId}` 
        : `/notes/${subjectId}/${chapterId}`;

    useEffect(() => {
        const fetchNote = async () => {
            setHeaderTitle('Loading Note...'); // Set a temporary title
            setLoading(true);
            if (!subjectId || !chapterId || !itemId) return;

            try {
                const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
                const docSnap = await getDoc(noteDocRef);

                if (docSnap.exists()) {
                    const noteData = docSnap.data();
                    setNoteContent(noteData.content || '');
                    // Set the header title to the note's name
                    setHeaderTitle(noteData.name || 'Note');
                } else {
                    toast.error("Note not found.");
                    setHeaderTitle('Note Not Found');
                }
            } catch (error) {
                console.error("Error fetching note: ", error);
                toast.error("Failed to load the note.");
                setHeaderTitle('Error');
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [subjectId, chapterId, itemId, collectionPrefix, setHeaderTitle]);

    const handleSave = async (content) => {
        try {
            const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
            await updateDoc(noteDocRef, { content: content });
            toast.success('Note saved successfully!');
        } catch (error) {
            console.error("Error saving note: ", error);
            toast.error('Failed to save note.');
        }
    };

    const EditorSkeleton = () => (
        <div>
            <Skeleton height={40} className="mb-2" /> 
            <Skeleton height={300} /> 
        </div>
    );

    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-4">
                <Link to={backLink} className="text-gray-600 hover:text-gray-800 p-2">
                    <IoArrowBack size={24} />
                </Link>
                {/* The save button is now part of the NoteEditor, but you could have one here too if needed */}
            </div>
            
            {loading ? (
                <EditorSkeleton />
            ) : (
                <NoteEditor 
                    initialContent={noteContent} 
                    onSave={handleSave} 
                    readOnly={!currentUser} 
                />
            )}
        </div>
    );
};

export default NoteViewer;