import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoBookOutline, IoCloudOfflineOutline } from "react-icons/io5";
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

    // --- CHANGE: The options object is removed ---
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

    // --- Handlers with toast feedback and offline support ---
    const handleSaveSubject = useCallback(async (e) => {
        e.preventDefault();
        if (newSubjectName.trim() === '' || !currentUser) return;
        try {
            await addItem({ name: newSubjectName.trim(), userId: currentUser.uid });
            toast.success(isOnline ? "Subject created!" : "Subject saved locally!");
            setNewSubjectName('');
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to create subject.");
            console.error(error);
        }
    }, [newSubjectName, addItem, currentUser, isOnline]);

    const handleDelete = useCallback(async (subjectId) => {
        if (!currentUser) return;
        if (window.confirm('Are you sure you want to delete this subject and all its notes?')) {
            try {
                await deleteItem(subjectId, true); // Assuming deep delete for personal notes might be desired
                toast.success(isOnline ? "Subject deleted!" : "Deletion saved locally!");
            } catch (error) {
                toast.error("Failed to delete subject.");
                console.error(error);
            }
        }
    }, [deleteItem, currentUser, isOnline]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingSubjectName.trim() === '' || !currentUser) return;
        try {
            await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
            toast.success(isOnline ? "Subject renamed!" : "Rename saved locally!");
            setRenamingSubjectId(null);
            setRenamingSubjectName('');
        } catch (error) {
            toast.error("Failed to rename subject.");
            console.error(error);
        }
    }, [renamingSubjectName, renamingSubjectId, updateItem, currentUser, isOnline]);
    
    const handleRenameClick = useCallback((subject) => {
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    }, []);

    const cancelAdd = () => {
        setIsAdding(false);
        setNewSubjectName('');
    };

    const cancelRename = () => {
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    };

    const SubjectsSkeleton = () => (
        <ul className="space-y-3">
            {Array(4).fill(0).map((_, i) => (<li key={i} className="p-4 bg-white rounded-lg shadow-md"><Skeleton height={24} width="60%" /></li>))}
        </ul>
    );

    const EmptyState = () => (
        <div className="text-center mt-10">
            <IoBookOutline size={64} className="mx-auto text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-700 mt-4">Your Notebook is Empty</h2>
            <p className="text-gray-500 mt-2">Click "Add Subject" to create your first notebook.</p>
        </div>
    );
    
    if (loading && !subjects) {
        return (<div className="max-w-4xl mx-auto p-4 sm:p-6"><SubjectsSkeleton /></div>);
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
                    {currentUser && !isAdding && !renamingSubjectId && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:scale-105">
                            <FaPlus className="mr-2" /> Add Subject
                        </button>
                    )}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {isAdding && (
                    <form onSubmit={handleSaveSubject} className="my-4 p-4 bg-white rounded-lg shadow-md border animate-in fade-in-0 duration-300">
                        <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="New subject name" className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-500" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes className="mr-1" />Cancel</button>
                            <button type="submit" disabled={!newSubjectName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Save
                            </button>
                        </div>
                    </form>
                )}
                
                {renamingSubjectId && (
                     <form onSubmit={handleSaveRename} className="my-4 p-4 bg-white rounded-lg shadow-md border animate-in fade-in-0 duration-300">
                        <input type="text" value={renamingSubjectName} onChange={(e) => setRenamingSubjectName(e.target.value)} placeholder="Rename subject" className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-500" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={!renamingSubjectName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">Save Changes</button>
                        </div>
                    </form>
                )}
            
                <div className="mt-4">
                    {loading && subjects.length === 0 ? <SubjectsSkeleton /> : subjects.length > 0 ? (
                        <ul className="space-y-3">
                            {subjects.map(subject => (
                                <SubjectItem key={subject.id} subject={subject} onNavigate={() => navigate(`/personal-notes/${subject.id}`)} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                            ))}
                        </ul>
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

const SubjectItem = ({ subject, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = subject._metadata?.hasPendingWrites;
    return (
        <li className={`flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={onNavigate} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow min-w-0 truncate">
                {subject.name}
                {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onRenameClick(subject)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"><MdEdit size={22} /></button>
                <button onClick={() => onDeleteClick(subject.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"><MdDelete size={22} /></button>
            </div>
        </li>
    );
};

export default PersonalSubjects;