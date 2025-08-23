import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete, MdOutlineNoteAdd } from "react-icons/md";
import { IoArrowBack, IoCreateOutline, IoClose, IoCheckmark } from "react-icons/io5";
import { HiDotsVertical } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchChapterName = async () => {
            setHeaderTitle('Note Items'); // Default title
            if (subjectId && chapterId) {
                try {
                    const docRef = doc(db, 'official_notes', subjectId, 'chapters', chapterId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setHeaderTitle(docSnap.data().name);
                    }
                } catch (error) {
                    console.error("Error fetching chapter name:", error);
                }
            }
        };
        fetchChapterName();
    }, [subjectId, chapterId, setHeaderTitle]);

    const { data: items, loading, addItem, deleteItem } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items']);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveItem = async () => {
        if (newItemName.trim() === '') return;
        await addItem({ name: newItemName });
        setNewItemName('');
        setIsAdding(false);
    };

    const handleDelete = async (itemId) => {
        setIsDeleting(true);
        await deleteItem(itemId);
        setDeleteConfirm(null);
        setIsDeleting(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSaveItem();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewItemName('');
        }
    };

    const ItemsSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                        <Skeleton circle={true} height={10} width={10} />
                        <Skeleton width={200} height={20} />
                    </div>
                    <Skeleton circle={true} height={32} width={32} />
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center mt-16 mb-8">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-60 w-32 h-32 mx-auto"></div>
                <MdOutlineNoteAdd size={80} className="mx-auto text-gray-400 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-2">No Notes Yet</h3>
            <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
                Start building your knowledge base by creating your first note in this chapter.
            </p>
            {currentUser && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                    <FaPlus className="mr-2" />
                    Create First Note
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to={`/notes/${subjectId}`} 
                            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <IoArrowBack size={20} />
                        </Link>
                        
                        {!showSearchBar && items.length > 3 && (
                            <button
                                onClick={() => setShowSearchBar(true)}
                                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <FaSearch size={16} />
                            </button>
                        )}
                    </div>

                    {currentUser && !isAdding && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            <FaPlus className="mr-2" size={14} />
                            Add Note
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
                                placeholder="Search notes..."
                                className="w-full pl-12 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

                {/* Add Item Form */}
                {isAdding && (
                    <div className="mb-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Create New Note</h4>
                        <input 
                            type="text" 
                            value={newItemName} 
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Enter note title..." 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewItemName('');
                                }} 
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveItem} 
                                disabled={!newItemName.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
                            >
                                <IoCheckmark className="inline mr-1" />
                                Create
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <ItemsSkeleton />
                ) : filteredItems.length > 0 ? (
                    <div className="space-y-3">
                        {filteredItems.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="group flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div 
                                    onClick={() => navigate(`/notes/${subjectId}/${chapterId}/${item.id}`)} 
                                    className="cursor-pointer flex items-center space-x-3 flex-grow"
                                >
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                                        {item.name}
                                    </span>
                                </div>
                                
                                {currentUser && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {deleteConfirm === item.id ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">Delete?</span>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            >
                                                <MdDelete size={16} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : searchQuery ? (
                    <div className="text-center mt-16 mb-8">
                        <FaSearch size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching notes</h3>
                        <p className="text-gray-500">
                            No notes found for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearchBar(false);
                            }}
                            className="mt-4 px-4 py-2 text-blue-500 hover:text-blue-600 font-medium"
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

export default NoteItems;