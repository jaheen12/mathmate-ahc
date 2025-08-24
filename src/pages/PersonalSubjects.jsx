import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoBookOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const PersonalSubjects = ({ setHeaderTitle }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        setHeaderTitle('My Notes');
    }, [setHeaderTitle]);

    const subjectsQuery = useMemo(() => {
        if (!currentUser) return null; 
        const subjectsRef = collection(db, 'personal_notes');
        return query(subjectsRef, where("userId", "==", currentUser.uid));
    }, [currentUser]);

    const { 
        data: subjects, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem,
        isOnline,
        fromCache,
        hasPendingWrites
    } = useFirestoreCollection(subjectsQuery);
    
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');

    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '' || !currentUser) return;
        await addItem({ name: newSubjectName.trim(), userId: currentUser.uid });
        setNewSubjectName('');
        setIsAdding(false);
    };

    const handleDelete = async (subjectId) => {
        await deleteItem(subjectId, false);
    };

    const handleSaveRename = async () => {
        if (renamingSubjectName.trim() === '' || !currentUser) return;
        await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    };
    
    const handleRenameClick = (subject) => {
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    };

    const SubjectsSkeleton = () => (
        <ul className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
                <li key={i} className="p-4 bg-white rounded-lg shadow-md">
                    <Skeleton height={24} width="60%" />
                </li>
            ))}
        </ul>
    );

    const EmptyState = () => (
        <div className="text-center mt-10">
            <IoBookOutline size={64} className="mx-auto text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-700 mt-4">Your Notebook is Empty</h2>
            <p className="text-gray-500 mt-2">Click "Add Subject" to create your first notebook.</p>
        </div>
    );
    
    if (subjects === null) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <SubjectsSkeleton />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
                    {currentUser && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            disabled={!isOnline || isAdding || renamingSubjectId}
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
                        >
                            <FaPlus className="mr-2" />
                            {isOnline ? 'Add Subject' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus 
                    isOnline={isOnline}
                    fromCache={fromCache}
                    hasPendingWrites={hasPendingWrites}
                />

                {isAdding && (
                    <div className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        <input 
                            type="text" 
                            value={newSubjectName} 
                            onChange={(e) => setNewSubjectName(e.target.value)} 
                            placeholder="New subject name" 
                            className="border p-2 w-full mb-2 rounded-md" 
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveSubject} disabled={!newSubjectName.trim() || !isOnline} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">
                                {isOnline ? 'Save' : 'Offline'}
                            </button>
                        </div>
                    </div>
                )}
                {renamingSubjectId && (
                     <div className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        <input 
                            type="text" 
                            value={renamingSubjectName} 
                            onChange={(e) => setRenamingSubjectName(e.target.value)} 
                            placeholder="Rename subject" 
                            className="border p-2 w-full mb-2 rounded-md" 
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRenamingSubjectId(null)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>                            <button onClick={handleSaveRename} disabled={!renamingSubjectName.trim() || !isOnline} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">
                                {isOnline ? 'Save Changes' : 'Offline'}
                            </button>
                        </div>
                    </div>
                )}
            
                <div className="mt-4">
                    {loading && subjects.length === 0 ? (
                        <SubjectsSkeleton />
                    ) : subjects.length > 0 ? (
                        <ul className="space-y-3">
                            {subjects.map(subject => (
                                <SubjectItem 
                                    key={subject.id}
                                    subject={subject}
                                    isOnline={isOnline}
                                    onNavigate={() => navigate(`/personal-notes/${subject.id}`)}
                                    onRenameClick={handleRenameClick}
                                    onDeleteClick={handleDelete}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

const SubjectItem = ({ subject, isOnline, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = subject._metadata?.hasPendingWrites;
    return (
        <li className={`flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={onNavigate} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                {subject.name}
                {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onRenameClick(subject)} disabled={!isOnline} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
                    <MdEdit size={22} />
                </button>
                <button onClick={() => onDeleteClick(subject.id)} disabled={!isOnline} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
                    <MdDelete size={22} />
                </button>
            </div>
        </li>
    );
};

export default PersonalSubjects;