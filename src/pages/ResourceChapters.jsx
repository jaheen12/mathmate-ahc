import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaPlus, FaSearch, FaBook, FaChevronRight } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline } from "react-icons/io5";

const ResourceChapters = ({ setHeaderTitle }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [categoryName, setCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredChapter, setHoveredChapter] = useState(null);

  useEffect(() => {
    const fetchCategoryName = async () => {
      setHeaderTitle('Chapters'); // Set a default title first
      if (categoryId) {
        try {
          const docRef = doc(db, 'resources', categoryId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const name = docSnap.data().name;
            setCategoryName(name);
            setHeaderTitle(name);
          }
        } catch (error) {
          console.error("Error fetching category name: ", error);
        }
      }
    };
    fetchCategoryName();
  }, [categoryId, setHeaderTitle]);

  const { data: chapters, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['resources', categoryId, 'chapters']);
  
  const [newChapterName, setNewChapterName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingChapterId, setRenamingChapterId] = useState(null);
  const [renamingChapterName, setRenamingChapterName] = useState('');

  // Filter chapters based on search term
  const filteredChapters = chapters.filter(chapter =>
    chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveChapter = async () => {
    if (newChapterName.trim() === '') return;
    setIsSaving(true);
    try {
      await addItem({ name: newChapterName });
      setNewChapterName('');
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (chapterId) => {
    setIsDeleting(chapterId);
    try {
      await deleteItem(chapterId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveRename = async () => {
    if (renamingChapterName.trim() === '') return;
    setIsSaving(true);
    try {
      await updateItem(renamingChapterId, { name: renamingChapterName });
      setIsRenaming(false);
      setRenamingChapterId(null);
      setRenamingChapterName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameClick = (chapter) => {
    setIsRenaming(true);
    setRenamingChapterId(chapter.id);
    setRenamingChapterName(chapter.name);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setIsRenaming(false);
    }
  };

  const handleNavigateToChapter = (chapterId) => {
    navigate(`/resources/${categoryId}/${chapterId}`);
  };

  const ChaptersSkeleton = () => (
    <div className="space-y-4">
      {Array(5).fill().map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/resources" 
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Back to categories"
              >
                <IoArrowBack className="text-2xl" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IoDocumentsOutline className="text-white text-2xl" />
                </div>
                <div>
                  <nav className="text-sm text-gray-500 mb-1">
                    <Link to="/resources" className="hover:text-gray-700 transition-colors">Resources</Link>
                    <span className="mx-2">/</span>
                    <span>{categoryName || 'Category'}</span>
                  </nav>
                  <h1 className="text-3xl font-bold text-gray-900">Chapters</h1>
                  <p className="text-gray-600 mt-1">Organize resources into chapters</p>
                </div>
              </div>
            </div>
            
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Add Chapter
              </button>
            )}
          </div>

          {/* Search Bar */}
          {chapters.length > 0 && (
            <div className="relative max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Add Chapter Form */}
        {isAdding && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaPlus className="text-green-600 text-sm" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Chapter</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSaveChapter)}
                placeholder="Enter chapter name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveChapter}
                  disabled={!newChapterName.trim() || isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-200 font-medium min-w-[80px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Chapter Form */}
        {isRenaming && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdEdit className="text-blue-600 text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Rename Chapter</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={renamingChapterName}
                onChange={(e) => setRenamingChapterName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSaveRename)}
                placeholder="Enter new chapter name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setIsRenaming(false)} 
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRename}
                  disabled={!renamingChapterName.trim() || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 font-medium min-w-[80px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapters List */}
        {loading ? (
          <ChaptersSkeleton />
        ) : filteredChapters.length > 0 ? (
          <div className="space-y-3">
            {filteredChapters.map((chapter, index) => (
              <div 
                key={chapter.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden"
                onMouseEnter={() => setHoveredChapter(chapter.id)}
                onMouseLeave={() => setHoveredChapter(null)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleNavigateToChapter(chapter.id)}
                      className="flex items-center space-x-4 cursor-pointer flex-grow group-hover:text-purple-600 transition-colors duration-200"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredChapter === chapter.id 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-bold mr-1">{index + 1}</span>
                          <FaBook className="text-sm" />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                          {chapter.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Chapter {index + 1} • Click to view resources</p>
                      </div>
                      <FaChevronRight className={`text-xl text-gray-400 transition-all duration-300 ${
                        hoveredChapter === chapter.id ? 'text-purple-600 transform translate-x-1' : ''
                      }`} />
                    </div>
                    
                    {currentUser && (
                      <div className={`flex items-center space-x-2 ml-4 transition-all duration-300 ${
                        hoveredChapter === chapter.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <button 
                          onClick={() => handleRenameClick(chapter)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Rename chapter"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button 
                          onClick={() => handleDelete(chapter.id)}
                          disabled={isDeleting === chapter.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Delete chapter"
                        >
                          {isDeleting === chapter.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MdDelete className="text-lg" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any chapters matching "{searchTerm}". Try adjusting your search terms.
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <IoDocumentsOutline className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Chapters Yet</h3>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Get started by creating your first chapter to organize resources within this category. Chapters help structure your content logically.
            </p>
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus className="mr-3" />
                Create Your First Chapter
              </button>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {filteredChapters.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                <IoDocumentsOutline className="text-purple-600" />
                <span>
                  {searchTerm ? `${filteredChapters.length} of ${chapters.length}` : chapters.length} 
                  {" "}
                  {chapters.length === 1 ? 'chapter' : 'chapters'} in {categoryName || 'this category'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceChapters;