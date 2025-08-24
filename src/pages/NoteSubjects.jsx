import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete, MdEdit, MdSchool } from "react-icons/md";
import { IoBookOutline, IoLibrary } from "react-icons/io5";
import { HiOutlineAcademicCap } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteSubjects = ({ setHeaderTitle }) => {
    const { 
        data: subjects, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem, 
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection('official_notes', {
        enableRealtime: true,
        cacheFirst: true
    });
    
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // UI state
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        setHeaderTitle('Official Notes');
    }, [setHeaderTitle]);

    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        if (!searchQuery.trim()) return subjects;
        return subjects.filter(subject =>
            subject.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [subjects, searchQuery]);

    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '') return;
        await addItem({ name: newSubjectName.trim() });
        setNewSubjectName('');
        setIsAdding(false);
    };

    const handleDelete = async (subjectId) => {
        await deleteItem(subjectId, false);
    };

    const handleSaveRename = async () => {
        if (renamingSubjectName.trim() === '') return;
        await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    };

    const handleRenameClick = (subject) => {
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    };

    const handleSubjectClick = (subjectId) => {
        navigate(`/notes/${subjectId}`);
    };

    const SubjectsSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill().map((_, index) => (
                <div key={index} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Skeleton circle height={48} width={48} className="mb-4" />
                    <Skeleton height={24} width="70%" />
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <HiOutlineAcademicCap size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Subjects Found</h3>
            <p className="text-gray-500 mt-2">
                {currentUser ? "Click 'Add Subject' to create the first one." : "Official subjects will appear here."}
            </p>
        </div>
    );

    if (!subjects) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <SubjectsSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    {/* Header Title */}
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                            <IoLibrary size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Official Notes</h1>
                            <p className="text-gray-500 text-sm">Manage your study subjects</p>
                        </div>
                    </div>
                    {currentUser && (
                        <button 
                            onClick={() => setIsAdding(true)}
                            disabled={!isOnline}
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                        >
                            <FaPlus className="mr-2" size={14} />
                            {isOnline ? 'Add Subject' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add/Rename forms would go here */}

                <div className="mt-6">
                    {loading && filteredSubjects.length === 0 ? (
                        <SubjectsSkeleton />
                    ) : filteredSubjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSubjects.map((subject, index) => (
                                <SubjectCard
                                    key={subject.id}
                                    subject={subject}
                                    index={index}
                                    isOnline={isOnline}
                                    onDelete={handleDelete}
                                    onRename={handleRenameClick}
                                    onClick={handleSubjectClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

const SubjectCard = ({ subject, index, isOnline, onDelete, onRename, onClick }) => {
    const isPending = subject._metadata?.hasPendingWrites;

    return (
        <div 
            className={`group relative bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}
            onClick={() => onClick(subject.id)}
        >
            <div className="p-6 cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center">
                        <MdSchool size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 truncate">
                            {subject.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                    </div>
                </div>
            </div>
            {isOnline && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onRename(subject); }} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50">
                        <MdEdit size={20} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(subject.id); }} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50">
                        <MdDelete size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoteSubjects;