// src/pages/NoteViewer.jsx
import React, { useState, useEffect } from 'react'; // CORRECTED THIS LINE
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { IoArrowBack, IoSaveOutline, IoPencil } from "react-icons/io5";

// A robust component to render ANY valid HTML, including MathML
const HtmlRenderer = ({ htmlString }) => {
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = htmlString || '<p>No content yet.</p>';
        }
    }, [htmlString]);

    return <div ref={containerRef} className="prose max-w-none" />;
};


const NoteViewer = ({ setHeaderTitle }) => {
    const { subjectId, chapterId, itemId } = useParams();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    
    const { currentUser } = useAuth();
    
    const isPersonal = window.location.pathname.includes('personal-notes');
    const collectionPrefix = isPersonal ? 'personal_notes' : 'official_notes';
    const backLink = isPersonal 
        ? `/personal-notes/${subjectId}/${chapterId}` 
        : `/notes/${subjectId}/${chapterId}`;

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
                } else {
                    toast.error("Note not found.");
                    setHeaderTitle('Note Not Found');
                }
            } catch (error) {
                console.error("Error fetching note:", error); // Added error logging
                toast.error("Failed to load the note.");
                setHeaderTitle('Error');
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [itemId, setHeaderTitle, subjectId, chapterId, collectionPrefix]); // Added dependencies

    const handleSave = async () => {
        try {
            const noteDocRef = doc(db, collectionPrefix, subjectId, "chapters", chapterId, "items", itemId);
            await updateDoc(noteDocRef, { content: editedContent });
            toast.success('Note saved successfully!');
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving note:", error); // Added error logging
            toast.error('Failed to save note.');
        }
    };

    const ViewerSkeleton = () => ( 
        <div>
            <Skeleton height={300} />
        </div> 
    );

    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-4">
                <Link to={backLink} className="text-gray-600 hover:text-gray-800 p-2">
                    <IoArrowBack size={24} />
                </Link>
                {currentUser && (
                    isEditing ? (
                        <button onClick={handleSave} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600">
                            <IoSaveOutline className="mr-2" /> Save
                        </button>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                            <IoPencil className="mr-2" /> Edit
                        </button>
                    )
                )}
            </div>
            
            {loading ? (
                <ViewerSkeleton />
            ) : (
                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                    {isEditing ? (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-96 p-2 border rounded font-mono text-sm bg-gray-50"
                            placeholder="Enter your HTML code with MathML here..."
                        />
                    ) : (
                        <HtmlRenderer htmlString={note?.content} />
                    )}
                </div>
            )}
        </div>
    );
};

export default NoteViewer;