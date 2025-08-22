import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'; // Import our hook
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteChapters = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    
    // --- Use the hook with a dynamic path ---
    const { data: chapters, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['official_notes', subjectId, 'chapters']);
    
    // --- UI-specific state ---
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');
    
    const { currentUser } = useAuth();

    // --- Simple handlers that call the hook's functions ---
    const handleSaveChapter = async () => {
        if (newChapterName.trim() === '') return;
        await addItem({ name: newChapterName });
        setNewChapterName('');
        setIsAdding(false);
    };

    const handleDelete = async (chapterId) => {
        await deleteItem(chapterId);
    };

    const handleSaveRename = async () => {
        if (renamingChapterName.trim() === '') return;
        await updateItem(renamingChapterId, { name: renamingChapterName });
        setIsRenaming(false);
        setRenamingChapterId(null);
    };

    // --- UI action helpers ---
    const handleRenameClick = (chapter) => {
        setIsRenaming(true);
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    };

    // --- Skeleton Component ---
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
                <Link to="/notes" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Chapters</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="New chapter name" className="border p-2 w-full mb-2" />
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
                                    <span onClick={() => navigate(`/notes/${subjectId}/${chapter.id}`)} className="cursor-pointer font-semibold flex-grow hover:text-blue-600">
                                        {chapter.name}
                                    </span>
                                    {currentUser && (
                                        <div className="flex items-center">
                                            <button onClick={() => handleRenameClick(chapter)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
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

export default NoteChapters;