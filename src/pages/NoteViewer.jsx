import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import NoteEditor from '../components/NoteEditor';
import { useAuth } from '../contexts/AuthContext';
import { IoArrowBack } from "react-icons/io5";

const NoteViewer = () => {
    const { subjectId, chapterId, itemId } = useParams();
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    
    // This determines which collection to use based on the URL
    const isPersonal = window.location.pathname.includes('personal-notes');
    const collectionPrefix = isPersonal ? 'personal_notes' : 'official_notes';

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            try {
                const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
                const docSnap = await getDoc(noteDocRef);

                if (docSnap.exists()) {
                    // Use the content field, or default to an empty string if it doesn't exist
                    setNoteContent(docSnap.data().content || '');
                } else {
                    toast.error("Note not found.");
                }
            } catch (error) {
                console.error("Error fetching note: ", error);
                toast.error("Failed to load the note.");
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [subjectId, chapterId, itemId, collectionPrefix]);

    const handleSave = async (content) => {
        try {
            const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
            await updateDoc(noteDocRef, {
                content: content
            });
            toast.success('Note saved successfully!');
        } catch (error) {
            console.error("Error saving note: ", error);
            toast.error('Failed to save note. Changes are saved locally and will sync when online.');
        }
    };

    const backLink = isPersonal 
        ? `/personal-notes/${subjectId}/${chapterId}` 
        : `/notes/${subjectId}/${chapterId}`;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to={backLink} className="text-blue-500 hover:underline">
                    <IoArrowBack size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Note Editor</h1>
            </div>
            
            {loading ? (
                <p>Loading note...</p>
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