// src/components/NoteEditor.jsx
import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

const NoteEditor = ({ note, onSave, onBack }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return; // Avoid saving empty notes
    onSave(note.id, title, content);
  };

  return (
    <div className="note-editor-container flex flex-col h-full p-4 bg-gray-50">
      {/* Header */}
      <div className="note-editor-header flex items-center gap-3 mb-4">
        <button
          className="back-button p-2 rounded-lg hover:bg-gray-200 transition"
          onClick={onBack}
        >
          <ArrowLeft size={24} />
        </button>
        <input
          type="text"
          className="title-input flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
      </div>

      {/* Content */}
      <textarea
        className="content-textarea flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note here..."
      />

      {/* Save Button */}
      <button
        className="fab-button save-fab mt-4 w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 active:scale-95 transition-transform duration-150"
        onClick={handleSave}
      >
        <Save size={20} />
        Save Note
      </button>
    </div>
  );
};

export default NoteEditor;