import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus, FaSearch, FaGraduationCap } from "react-icons/fa";
import { MdDelete, MdEdit, MdSchool, MdLibraryBooks } from "react-icons/md";
import { IoBookOutline, IoClose, IoCheckmark, IoLibrary } from "react-icons/io5";
import { HiOutlineAcademicCap } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteSubjects = ({ setHeaderTitle }) => {
    const { data: subjects, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['official_notes']);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // UI state
    const [newSubjectName, setNewSubjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setHeaderTitle('Official Notes');
    }, [setHeaderTitle]);

    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveSubject = async () => {
        if (newSubjectName.trim() === '') return;
        await addItem({ name: newSubjectName });
        setNewSubjectName('');
        setIsAdding(false);
    };

    const handleDelete = async (subjectId) => {
        setIsDeleting(true);
        await deleteItem(subjectId);
        setDeleteConfirm(null);
        setIsDeleting(false);
    };

    const handleSaveRename = async () => {
        if (renamingSubjectName.trim() === '') return;
        await updateItem(renamingSubjectId, { name: renamingSubjectName });
        setIsRenaming(false);
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    };

    const handleRenameClick = (subject) => {
        setIsRenaming(true);
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    };

    const handleSubjectClick = (subjectId) => {
        navigate(`/notes/${subjectId}`);
    };

    const handleKeyPress = (e, action) => {
        if (e.key === 'Enter') {
            if (action === 'add') handleSaveSubject();
            if (action === 'rename') handleSaveRename();
        } else if (e.key === 'Escape') {
            if (action === 'add') {
                setIsAdding(false);
                setNewSubjectName('');
            }
            if (action === 'rename') {
                setIsRenaming(false);
                setRenamingSubjectId(null);
                setRenamingSubjectName('');
            }
        }
    };

    const SubjectsSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill().map((_, index) => (
                <div key={index} className="p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                        <Skeleton circle={true} height={40} width={40} />
                        <Skeleton width={120} height={24} />
                    </div>
                    <Skeleton width={'100%'} height={16} className="mb-2" />
                    <Skeleton width={'70%'} height={16} />
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center mt-20 mb-8">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-blue-100 rounded-full blur-3xl opacity-60 w-40 h-40 mx-auto"></div>
                <HiOutlineAcademicCap size={100} className="mx-auto text-gray-400 relative z-10" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mt-8 mb-4">Welcome to Official Notes</h3>
            <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto">
                {currentUser 
                    ? "Start building your knowledge base by creating your first subject area."
                    : "Official subjects will appear here once an admin adds them to the system."
                }
            </p>
            {currentUser && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                    <FaPlus className="mr-2" />
                    Create First Subject
                </button>
            )}
        </div>
    );

    const SubjectCard = ({ subject, index }) => (
        <div 
            key={subject.id}
            className="group relative bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-green-200 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-400"></div>
            
            <div className="p-6">
                <div 
                    onClick={() => handleSubjectClick(subject.id)}
                    className="cursor-pointer"
                >
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <MdSchool size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors duration-200 truncate">
                                {subject.name}
                            </h3>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                                <IoBookOutline size={16} className="mr-1" />
                                Chapters
                            </span>
                            <span className="flex items-center">
                                <MdLibraryBooks size={16} className="mr-1" />
                                Notes
                            </span>
                        </div>
                    </div>
                </div>

                {currentUser && (
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {deleteConfirm === subject.id ? (
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                                <span className="text-sm text-gray-600">Delete?</span>
                                <button
                                    onClick={() => handleDelete(subject.id)}
                                    disabled={isDeleting}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                >
                                    No
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleRenameClick(subject)}
                                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="Edit subject"
                                >
                                    <MdEdit size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(subject.id)}
                                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Delete subject"
                                >
                                    <MdDelete size={16} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                                <IoLibrary size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Official Notes</h1>
                                <p className="text-gray-500 text-sm">Manage your study subjects</p>
                            </div>
                        </div>

                        {!showSearchBar && subjects.length > 6 && (
                            <button
                                onClick={() => setShowSearchBar(true)}
                                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <FaSearch size={16} />
                            </button>
                        )}
                    </div>

                    {currentUser && !isAdding && !isRenaming && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            <FaPlus className="mr-2" size={14} />
                            Add Subject
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {showSearchBar && (
                    <div className="mb-6 relative">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search subjects..."
                                className="w-full pl-12 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowSearchBar(false);
                                    setSearchQuery('');
                                }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <IoClose size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Subject Form */}
                {isAdding && (
                    <div className="mb-8 p-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">Create New Subject</h4>
                        <input 
                            type="text" 
                            value={newSubjectName} 
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'add')}
                            placeholder="Enter subject name..." 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewSubjectName('');
                                }} 
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveSubject} 
                                disabled={!newSubjectName.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <IoCheckmark className="inline mr-1" />
                                Create Subject
                            </button>
                        </div>
                    </div>
                )}

                {/* Rename Subject Form */}
                {isRenaming && (
                    <div className="mb-8 p-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-xl font-semibold text-gray-800 mb-4">Rename Subject</h4>
                        <input 
                            type="text" 
                            value={renamingSubjectName} 
                            onChange={(e) => setRenamingSubjectName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'rename')}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsRenaming(false);
                                    setRenamingSubjectId(null);
                                    setRenamingSubjectName('');
                                }} 
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveRename} 
                                disabled={!renamingSubjectName.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <IoCheckmark className="inline mr-1" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <SubjectsSkeleton />
                ) : filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSubjects.map((subject, index) => (
                            <SubjectCard key={subject.id} subject={subject} index={index} />
                        ))}
                    </div>
                ) : searchQuery ? (
                    <div className="text-center mt-16 mb-8">
                        <FaSearch size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching subjects</h3>
                        <p className="text-gray-500">
                            No subjects found for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearchBar(false);
                            }}
                            className="mt-4 px-4 py-2 text-green-500 hover:text-green-600 font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
};

export default NoteSubjects;