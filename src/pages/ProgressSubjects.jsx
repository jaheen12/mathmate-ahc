import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoBarChartOutline, IoChevronForward, IoCloudOfflineOutline } from "react-icons/io5";

const ProgressSubjects = ({ setHeaderTitle }) => {
    const navigate = useNavigate();

    useEffect(() => {
        setHeaderTitle('Manage Study Progress');
    }, [setHeaderTitle]);

    const { 
        data: subjects, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem,
        isOnline,
        fromCache,
        hasPendingWrites
    } = useFirestoreCollection('study_progress');
    
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');

    const handleSaveSubject = useCallback(async (e) => {
        e.preventDefault();
        if (newSubjectName.trim() === '') return;
        try {
            await addItem({ name: newSubjectName.trim() });
            toast.success(isOnline ? "Subject added!" : "Subject saved locally!");
            setNewSubjectName('');
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to add subject.");
        }
    }, [newSubjectName, addItem, isOnline]);

    const handleDelete = useCallback(async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject and all its chapters & topics?')) {
            try {
                await deleteItem(subjectId, true);
                toast.success(isOnline ? "Subject deleted!" : "Deletion saved locally!");
            } catch (error) {
                toast.error("Failed to delete subject.");
            }
        }
    }, [deleteItem, isOnline]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingSubjectName.trim() === '') return;
        try {
            await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
            toast.success(isOnline ? "Subject renamed!" : "Rename saved locally!");
            setRenamingSubjectId(null);
            setRenamingSubjectName('');
        } catch (error) {
            toast.error("Failed to rename subject.");
        }
    }, [renamingSubjectName, renamingSubjectId, updateItem, isOnline]);
    
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

    const handleNavigate = (subjectId) => {
        if (!renamingSubjectId) {
            navigate(`/progress/${subjectId}`);
        }
    };

    const SubjectsSkeleton = () => (
        <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (<div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100"><Skeleton height={28} width="60%" /></div>))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <IoBarChartOutline size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Subjects Added Yet</h3>
            <p className="text-gray-500 mt-2">Click "Add Subject" to build your study curriculum.</p>
        </div>
    );

    if (loading && !subjects) {
        return <div className="max-w-4xl mx-auto p-4 sm:p-6"><SubjectsSkeleton /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Curriculum</h1>
                    <Link to="/progress/details" className="inline-flex items-center px-4 py-2 bg-white text-green-600 font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-green-50 transition-colors">
                        <IoBarChartOutline className="mr-2" />
                        View Overall Progress
                    </Link>
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105">
                            <FaPlus className="mr-2" /> Add Subject
                        </button>
                    )}
                </div>
                
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {isAdding && (
                    <form onSubmit={handleSaveSubject} className="my-4 p-4 bg-white rounded-lg shadow-md border animate-in fade-in-0 duration-300">
                        <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="New subject name" className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-500" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes className="mr-1"/>Cancel</button>
                            <button type="submit" disabled={!newSubjectName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Save
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4">
                    {subjects && subjects.length > 0 ? (
                        <div className="space-y-3">
                            {subjects.map(subject => (
                                renamingSubjectId === subject.id ? (
                                    <form onSubmit={handleSaveRename} key={subject.id} className="p-4 bg-white rounded-xl shadow-lg border-2 border-blue-500">
                                        <div className="flex gap-2 items-center">
                                            <input type="text" value={renamingSubjectName} onChange={(e) => setRenamingSubjectName(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus />
                                            <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                                            <button type="submit" disabled={!renamingSubjectName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">Save</button>
                                        </div>
                                    </form>
                                ) : (
                                    <SubjectItem key={subject.id} subject={subject} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                                )
                            ))}
                        </div>
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

const SubjectItem = ({ subject, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = subject._metadata?.hasPendingWrites;
    return (
        // --- THIS IS THE CORRECTED LINE ---
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-center justify-between">
                <div onClick={() => onNavigate(subject.id)} className="flex-grow min-w-0 cursor-pointer">
                    <h3 className="font-semibold text-xl text-gray-900 group-hover:text-green-600 truncate">
                        {subject.name}
                        {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                    </h3>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onRenameClick(subject)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit/></button>
                        <button onClick={() => onDeleteClick(subject.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete/></button>
                    </div>
                    <IoChevronForward className="text-gray-400 group-hover:text-green-600 transition-transform duration-300 transform group-hover:translate-x-1 ml-2" />
                </div>
            </div>
        </div>
    );
};

export default ProgressSubjects;
