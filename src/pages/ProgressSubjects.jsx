import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { useAuth } from '../AuthContext';

import { FaPlus, FaTimes, FaChartLine } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck, MdDragIndicator } from "react-icons/md";
import { IoBarChartOutline, IoCloudOfflineOutline } from "react-icons/io5";
import { HiOutlineAcademicCap, HiPlus } from "react-icons/hi2";
import { PiGraduationCapFill } from "react-icons/pi";

const ProgressSubjects = ({ setHeaderTitle }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        setHeaderTitle(currentUser ? 'Manage Curriculum' : 'Study Progress');
    }, [setHeaderTitle, currentUser]);

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
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [orderedSubjects, setOrderedSubjects] = useState([]);

    useEffect(() => {
        if (subjects) {
            const sorted = [...subjects].sort((a, b) => (a.order || 0) - (b.order || 0));
            setOrderedSubjects(sorted);
        }
    }, [subjects]);

    const handleSaveSubject = useCallback(async (e) => {
        e.preventDefault();
        if (newSubjectName.trim() === '') return;
        const order = orderedSubjects.length > 0 ? Math.max(...orderedSubjects.map(s => s.order || 0)) + 1 : 0;
        await addItem({ name: newSubjectName.trim(), order: order });
        toast.success(isOnline ? "Subject added!" : "Subject saved locally!");
        setNewSubjectName('');
        setIsAdding(false);
    }, [newSubjectName, addItem, isOnline, orderedSubjects]);

    const handleDelete = useCallback(async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            await deleteItem(subjectId, true);
            toast.success(isOnline ? "Subject deleted!" : "Deletion saved locally!");
        }
    }, [deleteItem, isOnline]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingSubjectName.trim() === '') return;
        await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
        toast.success(isOnline ? "Subject renamed!" : "Rename saved locally!");
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    }, [renamingSubjectName, renamingSubjectId, updateItem, isOnline]);
    
    const handleRenameClick = useCallback((subject) => {
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    }, []);

    const cancelAdd = () => { setIsAdding(false); setNewSubjectName(''); };
    const cancelRename = () => { setRenamingSubjectId(null); setRenamingSubjectName(''); };

    const handleNavigate = (subjectId) => {
        if (!renamingSubjectId && !draggedItem) navigate(`/progress/${subjectId}`);
    };

    const handleDragStart = (e, subject) => { setDraggedItem(subject); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragEnd = () => { setDraggedItem(null); setDragOverItem(null); };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDragEnter = (e, subject) => { e.preventDefault(); setDragOverItem(subject.id); };
    const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverItem(null); };
    const handleDrop = async (e, targetSubject) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetSubject.id) {
            setDraggedItem(null); setDragOverItem(null); return;
        }
        const newOrderedSubjects = [...orderedSubjects];
        const draggedIndex = newOrderedSubjects.findIndex(s => s.id === draggedItem.id);
        const targetIndex = newOrderedSubjects.findIndex(s => s.id === targetSubject.id);
        const [removed] = newOrderedSubjects.splice(draggedIndex, 1);
        newOrderedSubjects.splice(targetIndex, 0, removed);
        const updates = newOrderedSubjects.map((subject, index) => ({ id: subject.id, order: index }));
        setOrderedSubjects(newOrderedSubjects.map((subject, index) => ({ ...subject, order: index })));
        await Promise.all(updates.map(update => updateItem(update.id, { order: update.order })));
        toast.success(isOnline ? "Order updated!" : "Order saved locally!");
        setDraggedItem(null); setDragOverItem(null);
    };

    const SubjectsSkeleton = () => (
        <div className="space-y-2">{Array(4).fill(0).map((_, i) => (<div key={i} className="bg-white rounded-lg p-3 border border-gray-100"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div><div className="flex-1 space-y-1"><div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div><div className="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div></div></div></div>))}</div>
    );

    const EmptyState = () => (
        <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><HiOutlineAcademicCap size={28} className="text-blue-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Yet</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Create your first subject to start tracking study progress." : "The curriculum will appear here once added."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"><HiPlus className="mr-1.5" size={16} /> Add Subject</button>)}</div>
    );
    
    if (loading && !subjects) {
        return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><div className="mb-5"><div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-44 animate-pulse"></div></div><SubjectsSkeleton /></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
                <div className="mb-5"><h1 className="text-xl font-bold text-gray-900 mb-0.5">{currentUser ? 'Manage Curriculum' : 'Study Progress'}</h1><p className="text-sm text-gray-600">Track your learning progress</p></div>
                <div className="flex gap-2 mb-4">
                    <Link to="/progress/details" className="flex-1 flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"><div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><FaChartLine className="text-green-600" size={14} /></div><span className="text-sm font-medium text-gray-700">View Progress</span></Link>
                    {currentUser && !isAdding && (<button onClick={() => setIsAdding(true)} className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"><div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center"><HiPlus className="text-white" size={14} /></div><span className="text-sm font-medium text-white">Add Subject</span></button>)}
                </div>
                
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {currentUser && isAdding && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Subject</h3><form onSubmit={handleSaveSubject} className="space-y-3"><input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Subject name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" disabled={!newSubjectName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
                )}

                <div className="space-y-2">
                    {orderedSubjects && orderedSubjects.length > 0 ? (
                        orderedSubjects.map((subject, index) => (
                            currentUser && renamingSubjectId === subject.id ? (
                                <div key={subject.id} className="p-3 bg-white rounded-lg border-2 border-blue-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Subject</h3><form onSubmit={handleSaveRename} className="space-y-3"><input type="text" value={renamingSubjectName} onChange={(e) => setRenamingSubjectName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelRename} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" disabled={!renamingSubjectName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Save</button></div></form></div>
                            ) : (
                                <SubjectItem key={subject.id} subject={subject} index={index} totalSubjects={orderedSubjects.length} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} isDraggedOver={dragOverItem === subject.id} isDragging={draggedItem?.id === subject.id} currentUser={currentUser} />
                            )
                        ))
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

const SubjectItem = ({ subject, index, totalSubjects, onNavigate, onRenameClick, onDeleteClick, onDragStart, onDragEnd, onDragOver, onDragEnter, onDragLeave, onDrop, isDraggedOver, isDragging, currentUser }) => {
    const isPending = subject._metadata?.hasPendingWrites;
    const colorVariants = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-orange-500 to-orange-600', 'from-cyan-500 to-cyan-600', 'from-indigo-500 to-indigo-600', 'from-teal-500 to-teal-600'];
    const colorVariant = colorVariants[index % colorVariants.length];
    
    return (
        <div draggable={!!currentUser && totalSubjects > 1} onDragStart={(e) => onDragStart(e, subject)} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragEnter={(e) => onDragEnter(e, subject)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, subject)} className={`group bg-white rounded-lg border transition-all duration-200 cursor-pointer ${isDraggedOver ? 'bg-blue-50 border-blue-300 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'} ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-sm'} ${isPending ? 'opacity-75' : ''}`} onClick={() => onNavigate(subject.id)}>
            <div className="p-3 flex items-center gap-3">
                {currentUser && totalSubjects > 1 && (<div className="text-gray-400 group-hover:text-gray-600 transition-colors cursor-grab active:cursor-grabbing"><MdDragIndicator size={14} /></div>)}
                <div className={`w-10 h-10 bg-gradient-to-br ${colorVariant} rounded-lg flex items-center justify-center shadow-sm`}><PiGraduationCapFill className="text-white" size={18} /></div>
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-base text-gray-900 mb-0.5 break-words leading-snug">{subject.name}</h3><div className="flex items-center gap-1.5 text-xs text-gray-500"><IoBarChartOutline size={12} /><span>Tap to track progress</span>{isPending && (<><span className="text-gray-300">•</span><span className="text-orange-600 font-medium">Syncing...</span></>)}</div></div>
                {currentUser && (<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); onRenameClick(subject); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200" title="Edit"><MdEdit size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDeleteClick(subject.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200" title="Delete"><MdDelete size={16} /></button></div>)}
            </div>
        </div>
    );
};

export default ProgressSubjects;