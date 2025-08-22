import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const PersonalChapters = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const { data: chapters, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['personal_notes', subjectId, 'chapters']);
    
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');
    
    const { currentUser } = useAuth();

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
        setRenamingChapterName('');
    };

    const handleRenameClick = (chapter) => {
        setIsRenaming(true);
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    };

    const ChaptersSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md">
                    <Skeleton width={'60%'} height={24} />
                    <div className="flex items-center gap-2">
                        <Skeleton circle={true} height={32} width={32} />
                        <Skeleton circle={true} height={32} width={32} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-4">
                <Link to="/personal-notes" className="text-gray-600 hover:text-gray-800 p-2">
                    <IoArrowBack size={24} />
                </Link>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        <FaPlus className="mr-2" />
                        Add Chapter
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="New chapter name" className="border p-2 w-full mb-2 rounded-md" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveChapter} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}
            {isRenaming && (
                 <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="border p-2 w-full mb-2 rounded-md" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsRenaming(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveRename} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}

            {loading ? (
                <ChaptersSkeleton />
            ) : (
                chapters.length > 0 ? (
                    <ul className="space-y-3">
                        {chapters.map(chapter => (
                            <li key={chapter.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                                <span onClick={() => navigate(`/personal-notes/${subjectId}/${chapter.id}`)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                                    {chapter.name}
                                </span>
                                {currentUser && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleRenameClick(chapter)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100">
                                            <MdEdit size={22} />
                                        </button>
                                        <button onClick={() => handleDelete(chapter.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100">
                                            <MdDelete size={22} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center mt-10">
                        <IoDocumentsOutline size={64} className="mx-auto text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Chapters Yet</h2>
                        <p className="text-gray-500 mt-2">Click "Add Chapter" to organize your notes.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default PersonalChapters;