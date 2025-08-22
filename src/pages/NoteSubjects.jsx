import React, { useState, useEffect } from 'react'; // Import useEffect
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5"; // Changed icon for consistency
import Skeleton from 'react-loading-skeleton';

// The component now accepts the 'setHeaderTitle' prop
const NoteSubjects = ({ setHeaderTitle }) => {
    const { data: subjects, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['official_notes']);
    
    // --- NEW: Set the header title for this page ---
    useEffect(() => {
        setHeaderTitle('Official Notes');
    }, [setHeaderTitle]);

    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');
    
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '') return;
        await addItem({ name: newSubjectName });
        setNewSubjectName('');
        setIsAdding(false);
    };

    const handleDelete = async (subjectId) => {
        await deleteItem(subjectId);
    };

    const handleSaveRename = async () => {
        if (renamingSubjectName.trim() === '') return;
        await updateItem(renamingSubjectId, { name: renamingSubjectName });
        setIsRenaming(false);
        setRenamingSubjectId(null);
    };

    const handleRenameClick = (subject) => {
        setIsRenaming(true);
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    };

    const handleSubjectClick = (subjectId) => {
        navigate(`/notes/${subjectId}`);
    };

    const SubjectsSkeleton = () => (
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
            {currentUser && (
                <div className="flex justify-end mb-4">
                     <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        <FaPlus className="mr-2" />
                        Add Subject
                    </button>
                </div>
            )}

            {isAdding && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="border p-2 w-full mb-2 rounded-md" placeholder="New subject name" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveSubject} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}
            {isRenaming && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={renamingSubjectName} onChange={(e) => setRenamingSubjectName(e.target.value)} className="border p-2 w-full mb-2 rounded-md" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsRenaming(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveRename} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}

            {loading ? <SubjectsSkeleton /> : (
                <div>
                    {subjects.length > 0 ? (
                        <ul className="space-y-3">
                            {subjects.map(subject => (
                                <li key={subject.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                                    <span onClick={() => handleSubjectClick(subject.id)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                                        {subject.name}
                                    </span>
                                    {currentUser && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleRenameClick(subject)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"><MdEdit size={22} /></button>
                                            <button onClick={() => handleDelete(subject.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"><MdDelete size={22} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center mt-10">
                            <IoBookOutline size={64} className="mx-auto text-gray-300" />
                            <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Official Subjects</h2>
                            <p className="text-gray-500 mt-2">An admin needs to add subjects to this section.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NoteSubjects;