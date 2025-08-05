import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';

// This component is the editor for a single note
function NoteEditor({ note, onSave, onBack }) {
  const [title, setTitle] = React.useState(note.title);
  const [content, setContent] = React.useState(note.content);

  const handleSave = () => {
    onSave(note.id, title, content);
  };

  return (
    <div className="note-editor-container">
      <div className="note-editor-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={24} /></button>
        <input
          type="text"
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button className="save-button" onClick={handleSave}><Save size={24} /></button>
      </div>
      <textarea
        className="content-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your note here..."
      />
    </div>
  );
}

export default NoteEditor;