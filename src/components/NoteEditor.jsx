// src/components/NoteEditor.jsx
import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';

function NoteEditor({ note, onSave, onBack }) {
  // We use React.useState to manage the title and content
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);

  const handleSave = () => {
    onSave(note.id, title, content);
  };

  return (
    <div className="note-editor-container">
      <div className="note-editor-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <input
          type="text"
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        {/* The old save button is now removed from here */}
      </div>
      <textarea
        className="content-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note here..."
      />
      
      {/* THE FIX: A new, prominent "Save Note" button at the bottom */}
      <button className="fab-button save-fab" onClick={handleSave}>
        <Save size={24} />
        Save Note
      </button>
    </div>
  );
}

export default NoteEditor;