import React from 'react';
import { FileText, PlusCircle, Trash2, Pencil } from 'lucide-react';

function NoteList({ notes, onSelectNote, onCreateNew, onEdit, onDelete, emptyMessage, showCreateButton }) {
  
  const handleButtonClick = (e, callback) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div className="list-container">
      {notes.length > 0 ? (
        notes.map(note => (
          // The wrapper now has the .note-item class
          <div key={note.id} className="note-item">
            {/* The main content is inside a new div */}
            <div className="note-item-content" onClick={() => onSelectNote(note.id)}>
              <FileText size={20} />
              <span>{note.title || 'Untitled Note'}</span>
            </div>
            
            {/* The actions are a direct sibling */}
            {(onEdit || onDelete) && (
              <div className="note-item-actions">
                {onEdit && (
                  <button className="action-button edit-button" onClick={(e) => handleButtonClick(e, () => onEdit(note.id))}>
                    <Pencil size={18} />
                  </button>
                )}
                {onDelete && (
                  <button className="action-button delete-button" onClick={(e) => handleButtonClick(e, () => onDelete(note.id))}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="empty-notes-message">{emptyMessage}</p>
      )}

      {showCreateButton && (
        <button className="fab-button" onClick={onCreateNew}>
          <PlusCircle size={24} />
           New Note
        </button>
      )}
    </div>
  );
}

export default NoteList;