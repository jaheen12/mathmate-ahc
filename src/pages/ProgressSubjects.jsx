import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { FaPlus, FaTimes, FaGripVertical, FaChartLine } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck, MdDragIndicator } from "react-icons/md";
import { IoBarChartOutline, IoCloudOfflineOutline } from "react-icons/io5";
import { HiOutlineAcademicCap, HiPlus } from "react-icons/hi2";
import { PiGraduationCapFill } from "react-icons/pi";

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
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [orderedSubjects, setOrderedSubjects] = useState([]);

    // Update ordered subjects when subjects data changes
    useEffect(() => {
        if (subjects) {
            const sorted = [...subjects].sort((a, b) => (a.order || 0) - (b.order || 0));
            setOrderedSubjects(sorted);
        }
    }, [subjects]);

    const handleSaveSubject = useCallback(async (e) => {
        e.preventDefault();
        if (newSubjectName.trim() === '') return;
        try {
            const order = orderedSubjects.length > 0 ? Math.max(...orderedSubjects.map(s => s.order || 0)) + 1 : 0;
            await addItem({ 
                name: newSubjectName.trim(),
                order: order
            });
            toast.success(isOnline ? "Subject added!" : "Subject saved locally!");
            setNewSubjectName('');
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to add subject");
        }
    }, [newSubjectName, addItem, isOnline, orderedSubjects]);

    const handleDelete = useCallback(async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject and all its chapters & topics?')) {
            try {
                await deleteItem(subjectId, true);
                toast.success(isOnline ? "Subject deleted!" : "Deletion saved locally!");
            } catch (error) {
                toast.error("Failed to delete subject");
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
            toast.error("Failed to rename subject");
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
        if (!renamingSubjectId && !draggedItem) {
            navigate(`/progress/${subjectId}`);
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, subject) => {
        setDraggedItem(subject);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, subject) => {
        e.preventDefault();
        setDragOverItem(subject.id);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverItem(null);
        }
    };

    const handleDrop = async (e, targetSubject) => {
        e.preventDefault();
        
        if (!draggedItem || draggedItem.id === targetSubject.id) {
            setDraggedItem(null);
            setDragOverItem(null);
            return;
        }

        try {
            const newOrderedSubjects = [...orderedSubjects];
            const draggedIndex = newOrderedSubjects.findIndex(s => s.id === draggedItem.id);
            const targetIndex = newOrderedSubjects.findIndex(s => s.id === targetSubject.id);

            const [removed] = newOrderedSubjects.splice(draggedIndex, 1);
            newOrderedSubjects.splice(targetIndex, 0, removed);

            const updates = newOrderedSubjects.map((subject, index) => ({
                id: subject.id,
                order: index
            }));

            setOrderedSubjects(newOrderedSubjects.map((subject, index) => ({
                ...subject,
                order: index
            })));

            await Promise.all(updates.map(update => 
                updateItem(update.id, { order: update.order })
            ));

            toast.success(isOnline ? "Order updated!" : "Order saved locally!");
        } catch (error) {
            toast.error("Failed to update order");
            setOrderedSubjects([...subjects].sort((a, b) => (a.order || 0) - (b.order || 0)));
        }

        setDraggedItem(null);
        setDragOverItem(null);
    };

    const SubjectsSkeleton = () => (
        <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <HiOutlineAcademicCap size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Subjects Added Yet</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
                Create your first subject to start tracking your study progress.
            </p>
            <button 
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
                <HiPlus className="mr-2" size={18} />
                Add Subject
            </button>
        </div>
    );

    if (loading && !subjects) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="px-4 pt-6 pb-8">
                    <div className="mb-6">
                        <div className="h-7 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
                    </div>
                    <SubjectsSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-6 pb-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Study Progress</h1>
                    <p className="text-gray-600">Track your learning progress</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <Link 
                        to="/progress/details" 
                        className="flex flex-col items-center justify-center p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                            <FaChartLine className="text-green-600" size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">View Progress</span>
                    </Link>
                    
                    {!isAdding && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="flex flex-col items-center justify-center p-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-2">
                                <HiPlus className="text-white" size={18} />
                            </div>
                            <span className="text-sm font-medium text-white">Add Subject</span>
                        </button>
                    )}
                </div>
                
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add Subject Form */}
                {isAdding && (
                    <div className="mb-6 p-4 bg-white rounded-xl">
                        <h3 className="font-medium text-gray-900 mb-3">Add New Subject</h3>
                        <form onSubmit={handleSaveSubject} className="space-y-4">
                            <input 
                                type="text" 
                                value={newSubjectName} 
                                onChange={(e) => setNewSubjectName(e.target.value)} 
                                placeholder="Subject name" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                autoFocus 
                            />
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={cancelAdd} 
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!newSubjectName.trim()} 
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {isOnline ? <MdCheck className="mr-1" size={16} /> : <IoCloudOfflineOutline className="mr-1" size={16} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Subjects List */}
                <div className="space-y-3">
                    {orderedSubjects && orderedSubjects.length > 0 ? (
                        orderedSubjects.map((subject, index) => (
                            renamingSubjectId === subject.id ? (
                                <div key={subject.id} className="p-4 bg-white rounded-xl border border-blue-200">
                                    <h3 className="font-medium text-gray-900 mb-3">Edit Subject</h3>
                                    <form onSubmit={handleSaveRename} className="space-y-4">
                                        <input 
                                            type="text" 
                                            value={renamingSubjectName} 
                                            onChange={(e) => setRenamingSubjectName(e.target.value)} 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                            autoFocus 
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={cancelRename} 
                                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={!renamingSubjectName.trim()} 
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <SubjectItem 
                                    key={subject.id} 
                                    subject={subject}
                                    index={index}
                                    totalSubjects={orderedSubjects.length}
                                    onNavigate={handleNavigate} 
                                    onRenameClick={handleRenameClick} 
                                    onDeleteClick={handleDelete}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    isDraggedOver={dragOverItem === subject.id}
                                    isDragging={draggedItem?.id === subject.id}
                                />
                            )
                        ))
                    ) : ( 
                        <EmptyState /> 
                    )}
                </div>
            </div>
        </div>
    );
};

const SubjectItem = ({ 
    subject, 
    index,
    totalSubjects,
    onNavigate, 
    onRenameClick, 
    onDeleteClick,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    isDraggedOver,
    isDragging
}) => {
    const isPending = subject._metadata?.hasPendingWrites;
    
    // Color variations for subjects - matching the notes section
    const colorVariants = [
        'from-blue-400 to-blue-500',
        'from-green-400 to-green-500', 
        'from-purple-400 to-purple-500',
        'from-pink-400 to-pink-500',
        'from-orange-400 to-orange-500',
        'from-cyan-400 to-cyan-500'
    ];
    
    const colorVariant = colorVariants[index % colorVariants.length];
    
    return (
        <div 
            draggable={totalSubjects > 1}
            onDragStart={(e) => onDragStart(e, subject)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, subject)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, subject)}
            className={`
                group bg-white rounded-xl transition-all duration-200 cursor-pointer
                ${isDraggedOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}
                ${isDragging ? 'opacity-50' : ''}
                ${isPending ? 'opacity-75' : ''}
            `}
            onClick={() => onNavigate(subject.id)}
        >
            <div className="p-4 flex items-center gap-4">
                {/* Drag Handle */}
                {totalSubjects > 1 && (
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <MdDragIndicator size={16} />
                    </div>
                )}
                
                {/* Subject Icon */}
                <div className={`w-14 h-14 bg-gradient-to-r ${colorVariant} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <PiGraduationCapFill className="text-white" size={24} />
                </div>
                
                {/* Subject Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-800 mb-1 break-words leading-tight">
                        {subject.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <IoBarChartOutline size={14} />
                        <span>Tap to track progress</span>
                        {isPending && (
                            <>
                                <span>•</span>
                                <span className="text-orange-600">Syncing...</span>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRenameClick(subject);
                        }} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <MdEdit size={18} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(subject.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <MdDelete size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProgressSubjects;