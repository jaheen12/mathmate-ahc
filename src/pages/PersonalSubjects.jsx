import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'; // Import our hook
import { where } from 'firebase/firestore'; // Import the 'where' function
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const PersonalSubjects = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // --- Use the hook with a query to filter by userId ---
    const queryConstraint = currentUser ? where("userId", "==", currentUser.uid) : null;
    const { data: subjects, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(
        ['personal_notes'], 
        queryConstraint
    );
    
    // --- UI-specific state ---
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');

    // --- Simple handlers that call the hook's functions ---
    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '' || !currentUser) return;
        // Add the userId to the new item data
        await addItem({ name: newSubjectName, userId: currentUser.uid });
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

    // --- UI action helpers ---
    const handleRenameClick = (subject) => {
        setIsRenaming(true);
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    };

    // --- Skeleton Component ---
    const SubjectsSkeleton = () => (
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
                <Link to="/profile" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">My Note Subjects</h1>
                <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                    <FaPlus />
                </button>
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="New subject name" className="border p-2 w-full mb-2" />
                    <button onClick={handleSaveSubject} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                    <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            {isRenaming && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={renamingSubjectName} onChange={(e) => setRenamingSubjectName(e.target.value)} className="border p-2 w-full mb-2" />
                    <button onClick={handleSaveRename} className="bg-green-500 text-white p-2 rounded mr-2">Save Rename</button>
                    <button onClick={() => setIsRenaming(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            
            {loading ? <SubjectsSkeleton /> : (
                <>
                    {subjects.length > 0 ? (
                        <ul className="space-y-2">
                            {subjects.map(subject => (
                                <li key={subject.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <span onClick={() => navigate(`/personal-notes/${subject.id}`)} className="cursor-pointer font-semibold flex-grow hover:text-blue-600">
                                        {subject.name}
                                    </span>
                                    <div className="flex items-center">
                                        <button onClick={() => handleRenameClick(subject)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
                                        <button onClick={() => handleDelete(subject.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No subjects found. Add a new one to get started.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default PersonalSubjects;