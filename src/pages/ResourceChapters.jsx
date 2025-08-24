import React, { useState, useEffect, useMemo } from 'react'; // The typo is fixed here
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaBook, FaChevronRight } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceChapters = ({ setHeaderTitle }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: categoryDoc } = useFirestoreDocument(['resources', categoryId]);

  useEffect(() => {
    setHeaderTitle(categoryDoc?.name || 'Chapters');
  }, [categoryDoc, setHeaderTitle]);

  const { 
    data: chapters, 
    loading, 
    addItem, 
    deleteItem, 
    updateItem,
    isOnline,
    fromCache,
    hasPendingWrites
  } = useFirestoreCollection(['resources', categoryId, 'chapters'], {
      enableRealtime: true,
      cacheFirst: true
  });
  
  const [newChapterName, setNewChapterName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [renamingChapterId, setRenamingChapterId] = useState(null);
  const [renamingChapterName, setRenamingChapterName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    return chapters.filter(chapter =>
      chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chapters, searchTerm]);

  const handleSaveChapter = async () => {
    if (newChapterName.trim() === '') return;
    await addItem({ name: newChapterName.trim() });
    setNewChapterName('');
    setIsAdding(false);
  };

  const handleDelete = async (chapterId) => {
    await deleteItem(chapterId, false);
  };

  const handleSaveRename = async () => {
    if (renamingChapterName.trim() === '') return;
    await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
    setRenamingChapterId(null);
    setRenamingChapterName('');
  };

  const handleRenameClick = (chapter) => {
    setRenamingChapterId(chapter.id);
    setRenamingChapterName(chapter.name);
  };

  const handleNavigateToChapter = (chapterId) => {
    navigate(`/resources/${categoryId}/${chapterId}`);
  };

  const ChaptersSkeleton = () => (
    <div className="space-y-3">
        {Array(4).fill().map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <Skeleton height={28} width="60%" />
            </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
        <IoDocumentsOutline size={80} className="mx-auto text-gray-300" />
        <h3 className="text-2xl font-bold text-gray-700 mt-4">No Chapters Yet</h3>
        <p className="text-gray-500 mt-2">Create the first chapter to start adding resources.</p>
    </div>
  );

  if (!chapters) {
      return (
          <div className="max-w-6xl mx-auto p-6">
              <ChaptersSkeleton />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
             <Link to="/resources" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <IoArrowBack size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{categoryDoc?.name || 'Chapters'}</h1>
            {currentUser && (
              <button onClick={() => setIsAdding(true)} disabled={!isOnline} className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50">
                <FaPlus className="mr-2" />
                {isOnline ? 'Add Chapter' : 'Offline'}
              </button>
            )}
          </div>
        </div>

        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {isAdding && (<div>Add form here...</div>)}
        {renamingChapterId && (<div>Rename form here...</div>)}
        
        <div className="mt-6">
            {loading && filteredChapters.length === 0 ? (
                <ChaptersSkeleton />
            ) : filteredChapters.length > 0 ? (
                <div className="space-y-3">
                    {filteredChapters.map((chapter, index) => (
                    <ChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        index={index}
                        currentUser={currentUser}
                        isOnline={isOnline}
                        onNavigate={handleNavigateToChapter}
                        onRenameClick={handleRenameClick}
                        onDeleteClick={handleDelete}
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

const ChapterItem = ({ chapter, index, currentUser, isOnline, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const [hovered, setHovered] = useState(false);

    return (
        <div 
            className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="p-6 flex items-center justify-between">
                <div onClick={() => onNavigate(chapter.id)} className="flex items-center space-x-4 cursor-pointer flex-grow">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <FaBook className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-purple-600">
                            {chapter.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Chapter {index + 1}</p>
                    </div>
                </div>
                <div className={`flex items-center space-x-2 ml-4 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                    {currentUser && (
                        <>
                            <button onClick={() => onRenameClick(chapter)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50">
                                <MdEdit className="text-lg" />
                            </button>
                            <button onClick={() => onDeleteClick(chapter.id)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                                <MdDelete className="text-lg" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceChapters;