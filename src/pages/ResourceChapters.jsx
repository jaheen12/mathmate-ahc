import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const ResourceChapters = () => {
    const { categoryId } = useParams();
    const [chapters, setChapters] = useState([]);
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchChapters = async () => {
            setLoading(true);
            try {
                const chaptersCollection = collection(db, "resources", categoryId, "chapters");
                const querySnapshot = await getDocs(chaptersCollection);
                const chaptersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setChapters(chaptersData);
            } catch (error) {
                console.error("Error fetching chapters: ", error);
                toast.error("Failed to fetch chapters.");
            } finally {
                setLoading(false);
            }
        };

        fetchChapters();
    }, [categoryId]);

    const handleSaveChapter = async () => {
        if (newChapterName.trim() === '') {
            toast.error('Chapter name cannot be empty');
            return;
        }
        try {
            const chaptersCollection = collection(db, "resources", categoryId, "chapters");
            const docRef = await addDoc(chaptersCollection, {
                name: newChapterName,
                createdAt: new Date()
            });
            setChapters([...chapters, { id: docRef.id, name: newChapterName }]);
            setNewChapterName('');
            setIsAdding(false);
            toast.success('Chapter added successfully!');
        } catch (error) {
            console.error("Error adding chapter: ", error);
            toast.error('Failed to add chapter.');
        }
    };

    const handleDelete = async (chapterId) => {
        if (window.confirm("Are you sure you want to delete this chapter?")) {
            try {
                await deleteDoc(doc(db, "resources", categoryId, "chapters", chapterId));
                setChapters(chapters.filter(chapter => chapter.id !== chapterId));
                toast.success('Chapter deleted successfully!');
            } catch (error) {
                console.error("Error deleting chapter: ", error);
                toast.error('Failed to delete chapter.');
            }
        }
    };
    
    const handleRename = (chapter) => {
        setIsRenaming(true);
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    };

    const handleSaveRename = async () => {
        if (renamingChapterName.trim() === '') {
            toast.error('Chapter name cannot be empty');
            return;
        }
        try {
            const chapterDoc = doc(db, "resources", categoryId, "chapters", renamingChapterId);
            await updateDoc(chapterDoc, { name: renamingChapterName });
            setChapters(chapters.map(c => c.id === renamingChapterId ? { ...c, name: renamingChapterName } : c));
            setIsRenaming(false);
            setRenamingChapterId(null);
            toast.success('Chapter renamed successfully!');
        } catch (error) {
            console.error("Error renaming chapter: ", error);
            toast.error('Failed to rename chapter.');
        }
    };

    // --- Loading Skeleton component for Chapters ---
    const ChaptersSkeleton = () => (
        <div className="space-y-2">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                    <Skeleton width={'60%'} height={24} />
                    <div className="flex items-center">
                        <Skeleton circle={true} height={32} width={32} style={{ marginRight: '10px' }} />
                        <Skeleton circle={true} height={32} width={32} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to="/resources" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Resource Chapters</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input
                        type="text"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        placeholder="New chapter name"
                        className="border p-2 w-full mb-2"
                    />
                    <button onClick={handleSaveChapter} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                    <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            {isRenaming && (
                 <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="border p-2 w-full mb-2" />
                    <button onClick={handleSaveRename} className="bg-green-500 text-white p-2 rounded mr-2">Save Rename</button>
                    <button onClick={() => setIsRenaming(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}

            {loading ? <ChaptersSkeleton /> : (
                <div>
                    {chapters.length > 0 ? (
                        <ul className="space-y-2">
                            {chapters.map(chapter => (
                                <li key={chapter.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <span 
                                        onClick={() => navigate(`/resources/${categoryId}/${chapter.id}`)} 
                                        className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                                    >
                                        {chapter.name}
                                    </span>
                                    {currentUser && (
                                        <div className="flex items-center">
                                            <button onClick={() => handleRename(chapter)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
                                            <button onClick={() => handleDelete(chapter.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No chapters found. Add a new one to get started.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceChapters;