import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IoArrowBack, IoSaveOutline, IoCheckmarkCircle, IoTimeOutline } from 'react-icons/io5';
import { MdEdit, MdAutoAwesome } from 'react-icons/md';

const NoteEditor = ({ note, onSave, onBack }) => {
  const [title, setTitle] = useState(note?.name || '');
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Track changes
  useEffect(() => {
    const originalTitle = note?.name || '';
    const originalContent = note?.content || '';
    setHasChanges(title !== originalTitle || content !== originalContent);
  }, [title, content, note]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (title.trim() || content.trim()) {
        handleSave(true); // Auto-save
      }
    }, 3000); // Longer delay for better typing experience

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, hasChanges]);

  // Memoized handlers
  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!title.trim() && !content.trim()) return;
    
    setIsSaving(true);
    
    try {
      await onSave(note?.id, { name: title.trim(), content: content.trim() });
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note?.id, title, content, onSave]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditingTitle(false);
      contentRef.current?.focus();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      titleRef.current?.blur();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case '1':
            e.preventDefault();
            titleRef.current?.focus();
            setIsEditingTitle(true);
            break;
          case '2':
            e.preventDefault();
            contentRef.current?.focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now - lastSaved;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  // Auto-resize content on mount
  useEffect(() => {
    if (contentRef.current) {
      const textarea = contentRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Minimal Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
            >
              <IoArrowBack size={20} />
            </button>

            {/* Save Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Word Count */}
              <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
                <span>{wordCount} words</span>
              </div>

              {/* Save Status */}
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {!isSaving && lastSaved && !hasChanges && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <IoCheckmarkCircle size={16} />
                    <span>Saved {formatLastSaved()}</span>
                  </div>
                )}
                {hasChanges && !isSaving && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <IoTimeOutline size={16} />
                    <span>Unsaved</span>
                  </div>
                )}
              </div>

              {/* Manual Save Button */}
              {hasChanges && (
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <IoSaveOutline size={16} />
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Title Section */}
        <div className="pt-8 pb-6">
          {isEditingTitle || !title.trim() ? (
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={() => setIsEditingTitle(false)}
              placeholder="Give your note a title..."
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 p-0"
              style={{ lineHeight: '1.2' }}
              autoFocus={isEditingTitle}
            />
          ) : (
            <div 
              onClick={() => {
                setIsEditingTitle(true);
                setTimeout(() => titleRef.current?.focus(), 0);
              }}
              className="group cursor-text flex items-start gap-3"
            >
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                {title}
              </h1>
              <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-500">
                <MdEdit size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="pb-20">
          <div className="relative">
            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing..."
              className="w-full min-h-[600px] text-lg text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 resize-none p-0 leading-relaxed"
              style={{ 
                lineHeight: '1.8',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            />
            
            {/* Placeholder enhancement */}
            {!content.trim() && (
              <div className="absolute top-0 left-0 pointer-events-none text-gray-400 text-lg leading-relaxed">
                <div className="flex items-center gap-2 mb-2">
                  <MdAutoAwesome size={20} className="text-blue-400" />
                  <span>Start writing your thoughts...</span>
                </div>
                <div className="text-sm text-gray-300 ml-7">
                  <p>• Press Ctrl/Cmd + S to save</p>
                  <p>• Auto-save happens every 3 seconds</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Panel */}
      <div className="fixed bottom-4 left-4 hidden lg:block">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Ctrl+S</kbd>
              <span>Save</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Ctrl+1</kbd>
              <span>Edit title</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Ctrl+2</kbd>
              <span>Focus content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;